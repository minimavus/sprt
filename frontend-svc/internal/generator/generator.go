package generator

import (
	"context"
	"fmt"
	"net"
	"os"
	"path"
	"regexp"
	"strings"
	"sync"

	"github.com/google/uuid"
	"github.com/spf13/cast"
	"layeh.com/radius/dictionary"

	"github.com/cisco-open/sprt/frontend-svc/internal/db"
	"github.com/cisco-open/sprt/frontend-svc/internal/iputils"
	"github.com/cisco-open/sprt/frontend-svc/internal/variables"
	"github.com/cisco-open/sprt/frontend-svc/shared"

	sdk "github.com/cisco-open/sprt/go-generator/sdk/variables"
	"github.com/cisco-open/sprt/go-generator/sdk/variables/dictionaries/radius"
)

type (
	Dictionary struct {
		File    string   `json:"file"`
		Name    string   `json:"name"`
		Vendors []string `json:"vendors"`
	}

	cachedDictionaries struct {
		sync.RWMutex
		data map[string]*dictionary.Dictionary
	}

	generator struct {
		app    shared.LogDB
		cfg    Specs
		parser *dictionary.Parser
		cache  *cachedDictionaries
	}
)

func New(app shared.LogDB, cfg Specs) (*generator, error) {
	parser := dictionary.Parser{IgnoreIdenticalAttributes: true}
	cache := cachedDictionaries{data: make(map[string]*dictionary.Dictionary)}

	g := &generator{app, cfg, &parser, &cache}

	g.buildExcludeMatchers(cfg.SourceIP.Exclude)
	g.buildAllowedMatchers(cfg.SourceIP.Allowed)

	app.(shared.SpecNotifier).OnSpecChange("generator.source-ip.exclude", g.onSpecChange)
	app.(shared.SpecNotifier).OnSpecChange("generator.source-ip.allowed", g.onSpecChange)
	app.(shared.SpecNotifier).OnSpecChange("generator.source-ip.auto-detect", g.onSpecChange)
	app.(shared.SpecNotifier).OnSpecChange("generator.source-ip.explicit-sources", g.onSpecChange)

	return g, nil
}

func (g *generator) onSpecChange(key string, value any) {
	switch key {
	case "generator.source-ip.exclude":
		g.buildExcludeMatchers(value)
	case "generator.source-ip.allowed":
		g.buildAllowedMatchers(value)
	case "generator.source-ip.auto-detect":
		v, ok := value.(bool)
		if !ok {
			g.app.Logger().Error().Msgf("invalid type for generator.source-ip.auto-detect: %v", value)
			return
		}
		g.cfg.SourceIP.AutoDetect = v
	case "generator.source-ip.explicit-sources":
		v, err := cast.ToStringSliceE(value)
		if err != nil {
			g.app.Logger().Error().Err(err).Msgf("invalid type for generator.source-ip.explicit-sources: %v", value)
			return
		}
		g.cfg.SourceIP.ExplicitSources = v
	}
}

func (g *generator) buildExcludeMatchers(value any) {
	exclude, err := cast.ToStringSliceE(value)
	if err != nil {
		g.app.Logger().Error().Err(err).Msgf("invalid type for generator.source-ip.exclude: %v", value)
		return
	}

	g.cfg.SourceIP.Exclude = exclude
	g.cfg.SourceIP.ExcludeMatchers = make([]Matcher, 0, len(exclude))
	g.app.Logger().Debug().Strs("exclude", exclude).Msg("source IP exclude list")
	for _, ip := range exclude {
		if iputils.IsIP(ip) {
			g.cfg.SourceIP.ExcludeMatchers = append(g.cfg.SourceIP.ExcludeMatchers, matchIP(ip))
		} else {
			g.cfg.SourceIP.ExcludeMatchers = append(g.cfg.SourceIP.ExcludeMatchers, matchRegex(ip))
		}
	}
}

func (g *generator) buildAllowedMatchers(value any) {
	allowed, err := cast.ToStringSliceE(value)
	if err != nil {
		g.app.Logger().Error().Err(err).Msgf("invalid type for generator.source-ip.allowed: %v", value)
		return
	}

	g.cfg.SourceIP.Allowed = allowed
	g.cfg.SourceIP.AllowedMatchers = make([]Matcher, 0, len(allowed))
	g.app.Logger().Debug().Strs("allowed", allowed).Msg("source IP allowed list")
	for _, ip := range allowed {
		if iputils.IsIP(ip) {
			g.cfg.SourceIP.AllowedMatchers = append(g.cfg.SourceIP.AllowedMatchers, matchIP(ip))
		} else {
			g.cfg.SourceIP.AllowedMatchers = append(g.cfg.SourceIP.AllowedMatchers, matchRegex(ip))
		}
	}
}

func (g *generator) ListDictionaries() ([]Dictionary, error) {
	dir, err := os.Open(g.cfg.FreeRadiusDictionariesPath)
	if err != nil {
		return nil, err
	}
	defer dir.Close()

	files, err := dir.Readdir(-1)
	if err != nil {
		return nil, err
	}

	dicts := make([]Dictionary, 0)

	for _, file := range files {
		if file.IsDir() {
			continue
		}
		filePath := path.Join(g.cfg.FreeRadiusDictionariesPath, file.Name())
		dict, err := g.parseFile(filePath)
		if err != nil {
			g.app.Logger().Warn().Err(err).Str("file", filePath).Msg("failed to parse dictionary file")
			continue
		}

		d := Dictionary{
			File:    file.Name(),
			Name:    sanitizeName(file.Name()),
			Vendors: make([]string, 0, len(dict.Vendors)),
		}

		for _, vendor := range dict.Vendors {
			d.Vendors = append(d.Vendors, vendor.Name)
		}

		dicts = append(dicts, d)
	}

	return dicts, nil
}

func (g *generator) getDictionaryFromDB(ctx context.Context, name, user string) (*dictionary.Dictionary, string, error) {
	mdb, err := db.Exec(g.app).GetDictionaryByID(ctx, name, user)
	if err != nil {
		return nil, "", err
	}
	if mdb == nil {
		return nil, "", os.ErrNotExist
	}
	d, _, err := radius.ParseFromString(mdb.Content.String)
	return d, mdb.Name, err
}

func (g *generator) GetDictionary(ctx context.Context, name, user string) (*dictionary.Dictionary, string, error) {
	if err := uuid.Validate(name); err == nil {
		// got UUID, need to load from DB instead of file
		return g.getDictionaryFromDB(ctx, name, user)
	}

	fromCache, ok := g.getFromCache(name)
	if ok {
		return fromCache, "", nil
	}

	filePath := path.Clean(path.Join(g.cfg.FreeRadiusDictionariesPath, name))

	if !strings.HasPrefix(filePath, g.cfg.FreeRadiusDictionariesPath) {
		return nil, "", os.ErrNotExist
	}

	parsed, err := g.parseFile(filePath)
	if err != nil {
		return nil, "", err
	}

	g.putToCache(name, parsed)
	return parsed, "", nil
}

func (g *generator) parseFile(filePath string) (*dictionary.Dictionary, error) {
	f, err := os.Open(filePath)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	dict, err := g.parser.Parse(f)
	if err != nil {
		return nil, err
	}

	return dict, nil
}

func (g *generator) getFromCache(name string) (*dictionary.Dictionary, bool) {
	g.cache.RLock()
	defer g.cache.RUnlock()
	dict, ok := g.cache.data[name]
	return dict, ok
}

func (g *generator) putToCache(name string, dict *dictionary.Dictionary) {
	g.cache.Lock()
	defer g.cache.Unlock()
	g.cache.data[name] = dict
}

func sanitizeName(name string) string {
	if strings.HasPrefix(name, "dictionary.") {
		return name[len("dictionary."):]
	}
	return name
}

func (g *generator) GetTLSCipherSuites(tlsVersion string) ([]sdk.OptionsGroup[bool], error) {
	switch tlsVersion {
	case variables.TLSVersionTLSv1, variables.TLSVersionTLSv11, variables.TLSVersionTLSv12, variables.TLSVersionTLSv13:
		m := variables.CiphersMap[tlsVersion]

		return m, nil
	default:
		return nil, fmt.Errorf("unsupported TLS version: %s", tlsVersion)
	}
}

func matchIP(ip string) Matcher {
	parsed := net.ParseIP(ip)
	return func(s string) bool {
		ps := net.ParseIP(s)
		return ps != nil && ps.Equal(parsed)
	}
}

func matchRegex(re string) Matcher {
	compiled := regexp.MustCompile(re)
	return func(s string) bool {
		return compiled.MatchString(s)
	}
}
