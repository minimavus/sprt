package vars

import (
	"crypto/rand"
	"fmt"
	"math/big"
	"reflect"
	"strings"

	"github.com/go-viper/mapstructure/v2"
	"github.com/lucasjones/reggen"
	"github.com/rs/zerolog"
)

// StringGenerator generates strings based on different variants like list, random, etc.
type (
	StringGenerator struct {
		baseGenerator
		nextFunc func() (string, error)

		state any
	}

	stringGeneratorStateRandom struct {
		Pattern   string `mapstructure:"pattern"`
		MinLength int    `mapstructure:"minLength"`
		MaxLength int    `mapstructure:"maxLength"`
		Length    int    `mapstructure:"length"`

		reggenerator     *reggen.Generator
		useDynamicLength bool // true when using min/max length instead of fixed pattern
	}

	stringGeneratorStateList struct {
		List      []string   `mapstructure:"list"`
		Select    SelectType `mapstructure:"select"`
		NextIndex int64      `mapstructure:"nextIndex"`
	}

	stringGeneratorStateStatic struct {
		Value string `mapstructure:"value"`
	}
)

type SelectType int8

const (
	SelectTypeRandom SelectType = iota
	SelectTypeSequential
)

// NewStringGenerator creates a new StringGenerator.
func NewStringGenerator(params map[string]any, logger *zerolog.Logger, allVars *Vars) (Generator, error) {
	g := &StringGenerator{}
	g.baseGenerator.Init(params, logger, allVars)

	var initErr error
	switch how, _ := g.params["how"].(string); how {
	case "list":
		g.nextFunc = g.nextList
		initErr = g.initListState()
	case "random", "pattern":
		g.nextFunc = g.nextRandom
		initErr = g.initRandomState()
	case "static":
		g.nextFunc = g.nextStatic
		initErr = g.initStaticState()
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
	val, err := g.nextFunc()
	if err != nil {
		return nil, err
	}
	g.setLatest(val)
	return val, nil
}

func (g *StringGenerator) initListState() error {
	listParam, ok := g.params["list"]
	if !ok {
		return fmt.Errorf("list parameter is required for 'list' variant")
	}

	st := &stringGeneratorStateList{
		NextIndex: 0,
	}

	selectParam, ok := g.params["select"].(string)
	if !ok || selectParam != "sequential" {
		st.Select = SelectTypeRandom
	} else {
		st.Select = SelectTypeSequential
	}

	switch v := reflect.ValueOf(listParam); v.Kind() {
	case reflect.Slice:
		st.List = make([]string, v.Len())
		for i := 0; i < v.Len(); i++ {
			v := v.Index(i).Interface()
			strV, ok := v.(string)
			if !ok {
				return fmt.Errorf("unsupported type for 'list' element %d: %T, expected string", i, v)
			}
			st.List[i] = strV
		}
	case reflect.String:
		// Split string by newlines
		lines := strings.Split(v.String(), "\n")
		st.List = make([]string, 0, len(lines))
		for _, line := range lines {
			if line != "" {
				st.List = append(st.List, line)
			}
		}
	default:
		return fmt.Errorf("unsupported type for 'list' parameter: %T", listParam)
	}

	g.state = st
	return nil
}

func (g *StringGenerator) nextList() (string, error) {
	st := g.state.(*stringGeneratorStateList)
	if len(st.List) == 0 {
		return "", fmt.Errorf("list is empty")
	}

	var idx int64
	if st.Select == SelectTypeSequential {
		if st.NextIndex >= int64(len(st.List)) {
			st.NextIndex = 0
		}
		idx = st.NextIndex
		st.NextIndex++
	} else {
		idxInt, err := rand.Int(rand.Reader, big.NewInt(int64(len(st.List))))
		if err != nil {
			return "", fmt.Errorf("failed to get random index: %w", err)
		}
		idx = idxInt.Int64()
	}

	val := st.List[idx]

	return val, nil
}

func (g *StringGenerator) initRandomState() error {
	st := &stringGeneratorStateRandom{}

	err := mapstructure.Decode(g.params, st)
	if err != nil {
		return fmt.Errorf("failed to decode random string generator params: %w", err)
	}

	if st.Pattern == "" {

		if st.Length > 0 {
			// Fixed length - create specific pattern
			st.Pattern = fmt.Sprintf("\\w{%d}", st.Length)
		} else {
			// For dynamic length generation, we'll create the pattern in nextRandom
			st.useDynamicLength = true
			st.Pattern = "\\w" // Base pattern for word characters
		}

		if st.MinLength == 0 && st.MaxLength == 0 && st.Length == 0 {
			return fmt.Errorf("either 'pattern', 'length', or 'min/max-length' must be provided for random string")
		}
	}

	if !st.useDynamicLength {
		st.reggenerator, err = reggen.NewGenerator(st.Pattern)
		if err != nil {
			return fmt.Errorf("failed to create string generator: %w", err)
		}
	}

	g.state = st
	return nil
}

func (g *StringGenerator) nextRandom() (string, error) {
	st := g.state.(*stringGeneratorStateRandom)

	if st.useDynamicLength {
		genLen, err := rand.Int(rand.Reader, big.NewInt(int64(st.MaxLength-st.MinLength+1)))
		if err != nil {
			return "", fmt.Errorf("failed to generate random length: %w", err)
		}
		finalLen := int(genLen.Int64()) + st.MinLength

		// Create pattern for this specific length
		pattern := fmt.Sprintf("\\w{%d}", finalLen)
		return reggen.Generate(pattern, 100)
	}

	return st.reggenerator.Generate(100), nil
}

func (g *StringGenerator) initStaticState() error {
	st := &stringGeneratorStateStatic{}

	val, exists := g.params["value"]
	if !exists {
		return fmt.Errorf("'value' parameter is required for 'static' variant")
	}
	valStr, ok := val.(string)
	if !ok {
		return fmt.Errorf("'value' parameter must be a string for 'static' variant")
	}
	st.Value = valStr

	g.state = st
	return nil
}

func (g *StringGenerator) nextStatic() (string, error) {
	st := g.state.(*stringGeneratorStateStatic)
	return st.Value, nil
}

func init() {
	RegisterGenerator("string", NewStringGenerator)
}
