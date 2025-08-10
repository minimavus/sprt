package generator

import (
	"fmt"
	"net"

	"github.com/cisco-open/sprt/go-generator/sdk/iputils"
)

func (g *generator) GetAvailableIPSources(includeAll bool) ([]iputils.Source, error) {
	if !g.cfg.SourceIP.AutoDetect {
		g.app.Logger().Debug().Msg("IP source auto-detection is disabled")
		return g.getExplicitSources()
	}

	srcs, err := iputils.GetAvailableIPSources(g.app.Logger())
	if err != nil {
		return nil, err
	}

	if includeAll || (len(g.cfg.SourceIP.ExcludeMatchers) == 0 && len(g.cfg.SourceIP.AllowedMatchers) == 0) {
		return srcs, nil
	}

	filtered := g.filterExcluded(srcs)
	filtered = g.filterAllowed(filtered)

	return filtered, nil
}

func (g *generator) filterExcluded(in []iputils.Source) []iputils.Source {
	if len(g.cfg.SourceIP.ExcludeMatchers) == 0 {
		return in
	}

	filtered := make([]iputils.Source, 0, len(in))

	for _, src := range in {
		if g.isExcluded(src) {
			continue
		}
		filtered = append(filtered, src)
	}

	return filtered
}

func (g *generator) isExcluded(src iputils.Source) bool {
	for _, matcher := range g.cfg.SourceIP.ExcludeMatchers {
		if matcher(src.Address) {
			return true
		}
	}
	return false
}

func (g *generator) filterAllowed(in []iputils.Source) []iputils.Source {
	if len(g.cfg.SourceIP.AllowedMatchers) == 0 {
		return in
	}

	filtered := make([]iputils.Source, 0, len(in))

	for _, src := range in {
		if g.isAllowed(src) {
			filtered = append(filtered, src)
		}
	}

	return filtered
}

func (g *generator) isAllowed(src iputils.Source) bool {
	for _, matcher := range g.cfg.SourceIP.AllowedMatchers {
		if matcher(src.Address) {
			return true
		}
	}
	return false
}

func (g *generator) getExplicitSources() ([]iputils.Source, error) {
	sources := make([]iputils.Source, 0, len(g.cfg.SourceIP.ExplicitSources))
	for _, addr := range g.cfg.SourceIP.ExplicitSources {
		p := net.ParseIP(addr)
		if p == nil {
			return nil, fmt.Errorf("invalid explicit source IP: %s", addr)
		}
		fam := iputils.IPv4
		if p.To4() == nil {
			fam = iputils.IPv6
		}
		sources = append(sources, iputils.Source{
			Address:   p.String(),
			Family:    fam,
			Interface: "explicit",
		})
	}
	return sources, nil
}
