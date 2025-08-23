package vars

import (
	"crypto/rand"
	"fmt"
	"math/big"
	"reflect"
	"strings"

	"github.com/lucasjones/reggen"
	"github.com/rs/zerolog"
)

// StringGenerator generates strings based on different variants like list, random, etc.
type (
	StringGenerator struct {
		baseGenerator
		nextFunc func() (string, error)

		// State for 'list' variant
		list      []string
		nextIndex int64
	}
)

// NewStringGenerator creates a new StringGenerator.
func NewStringGenerator(params map[string]any, logger *zerolog.Logger, allVars *Vars) (Generator, error) {
	g := &StringGenerator{}
	g.baseGenerator.Init(params, logger, allVars)

	var initErr error
	switch how, _ := g.params["how"].(string); how {
	case "list":
		g.nextFunc = g.nextList
		initErr = g.initList()
	case "random", "pattern":
		g.nextFunc = g.nextRandom
	case "static":
		g.nextFunc = g.nextStatic
	case "faker":
		// Placeholder for faker implementation
		return nil, fmt.Errorf("TODO: faker variant is not yet implemented")
	default:
		initErr = fmt.Errorf("unsupported variant '%s' for string generator", how)
	}

	if initErr != nil {
		return nil, initErr
	}

	return g, nil
}

// Next calls the appropriate next function based on the variant.
func (g *StringGenerator) Next() (any, error) {
	return g.nextFunc()
}

func (g *StringGenerator) initList() error {
	listParam, exists := g.params["list"]
	if !exists {
		return fmt.Errorf("list parameter is required for 'list' variant")
	}

	switch v := reflect.ValueOf(listParam); v.Kind() {
	case reflect.Slice:
		g.list = make([]string, v.Len())
		for i := 0; i < v.Len(); i++ {
			v := v.Index(i).Interface()
			strV, ok := v.(string)
			if !ok {
				return fmt.Errorf("unsupported type for 'list' element %d: %T, expected string", i, v)
			}
			g.list[i] = strV
		}
	case reflect.String:
		// Split string by newlines
		lines := strings.Split(v.String(), "\n")
		g.list = make([]string, len(lines))
		for i, line := range lines {
			if line == "" {
				continue
			}
			g.list[i] = line
		}
	default:
		return fmt.Errorf("unsupported type for 'list' parameter: %T", listParam)
	}

	g.nextIndex = 0
	return nil
}

func (g *StringGenerator) nextList() (string, error) {
	if len(g.list) == 0 {
		return "", fmt.Errorf("list is empty")
	}

	var idx int64
	if how, _ := g.params["select"].(string); how == "sequential" {
		if g.nextIndex >= int64(len(g.list)) {
			g.nextIndex = 0
		}
		idx = g.nextIndex
		g.nextIndex++
	} else {
		idxInt, err := rand.Int(rand.Reader, big.NewInt(int64(len(g.list))))
		if err != nil {
			return "", fmt.Errorf("failed to get random index: %w", err)
		}
		idx = idxInt.Int64()
	}

	val := g.list[idx]
	g.setLatest(val)
	return val, nil
}

func (g *StringGenerator) nextRandom() (string, error) {
	pattern, _ := g.params["pattern"].(string)
	if pattern == "" {
		minLength, _ := g.params["minLength"].(int)
		maxLength, _ := g.params["maxLength"].(int)
		length, _ := g.params["length"].(int)

		if length > 0 {
			minLength = length
			maxLength = length
		}

		if minLength == 0 && maxLength == 0 {
			return "", fmt.Errorf("either 'pattern', 'length', or 'min/max-length' must be provided for random string")
		}

		genLen, err := rand.Int(rand.Reader, big.NewInt(int64(maxLength-minLength+1)))
		if err != nil {
			return "", err
		}
		finalLen := int(genLen.Int64()) + minLength
		pattern = fmt.Sprintf("\\w{%d}", finalLen)
	}

	str, err := reggen.Generate(pattern, 100)
	if err != nil {
		return "", fmt.Errorf("failed to generate string from pattern '%s': %w", pattern, err)
	}

	g.setLatest(str)
	return str, nil
}

func (g *StringGenerator) nextStatic() (string, error) {
	val, exists := g.params["value"]
	if !exists {
		return "", fmt.Errorf("'value' parameter is required for 'static' variant")
	}
	valStr, ok := val.(string)
	if !ok {
		return "", fmt.Errorf("'value' parameter must be a string for 'static' variant")
	}

	g.setLatest(valStr)
	return valStr, nil
}

func init() {
	RegisterGenerator("string", NewStringGenerator)
}
