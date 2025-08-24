package vars

import (
	"crypto/rand"
	"fmt"
	"math/big"
	"reflect"
	"strings"

	"github.com/cisco-open/sprt/go-generator/generator/internal/vars/internal/mac"
	"github.com/go-viper/mapstructure/v2"
	"github.com/lucasjones/reggen"
	"github.com/rs/zerolog"
)

// MacGenerator generates MAC addresses based on different variants.
type (
	MacGenerator struct {
		baseGenerator
		nextFunc func() (string, error)
		state    any
	}

	macGeneratorStateList struct {
		List      []string   `mapstructure:"list"`
		Select    SelectType `mapstructure:"select"`
		NextIndex int64      `mapstructure:"nextIndex"`
	}

	macGeneratorStateRange struct {
		Start  string `mapstructure:"start"`
		End    string `mapstructure:"end"`
		Step   int64  `mapstructure:"step"`
		Random bool   `mapstructure:"random"`

		currentMac *mac.MAC
		lastMac    *mac.MAC
		firstMac   *mac.MAC
	}

	macGeneratorStateRandom struct {
		Pattern string `mapstructure:"pattern"`

		reggenerator *reggen.Generator
	}
)

// NewMacGenerator creates a new MAC address generator.
func NewMacGenerator(params map[string]any, logger *zerolog.Logger, allVars *Vars) (Generator, error) {
	g := &MacGenerator{}
	g.baseGenerator.Init(params, logger, allVars)

	var initErr error
	switch how, _ := g.params["how"].(string); how {
	case "list", "dictionary":
		g.nextFunc = g.nextList
		initErr = g.initListState(how)
	case "range":
		g.nextFunc = g.nextRange
		initErr = g.initRangeState()
	case "random", "pattern":
		g.nextFunc = g.nextRandom
		initErr = g.initRandomState(how)
	default:
		initErr = fmt.Errorf("unsupported variant '%s' for mac generator", how)
	}

	if initErr != nil {
		return nil, initErr
	}

	return g, nil
}

// Next calls the appropriate next function based on the variant.
func (g *MacGenerator) Next() (any, error) {
	val, err := g.nextFunc()
	if err != nil {
		return nil, err
	}
	if !g.isUsable(val) {
		return nil, fmt.Errorf("generated value '%s' has already been used", val)
	}
	g.pushToUsed(val)
	g.setLatest(val)
	return val, nil
}

func (g *MacGenerator) initListState(variant string) error {
	st := &macGeneratorStateList{}

	if variant == "dictionary" {
		// TODO: implement dictionary
		return fmt.Errorf("dictionary variant is not yet implemented")
		// dictName, ok := g.params["dictionaries"].([]string)
		// if !ok {
		// 	return fmt.Errorf("'dictionaries' parameter is required for 'dictionary' variant")
		// }
		// lines, err := g.allVars.App.LoadUserDictionaries(dictName)
		// if err != nil {
		// 	return fmt.Errorf("failed to load dictionary '%s': %w", dictName, err)
		// }
		// st.List = lines
	}

	listParam, ok := g.params["list"]
	if ok {
		switch v := reflect.ValueOf(listParam); v.Kind() {
		case reflect.String:
			lines := strings.Split(v.String(), "\n")
			st.List = make([]string, len(lines))
			for i, line := range lines {
				if line == "" {
					continue
				}
				st.List[i] = line
			}
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
		default:
			return fmt.Errorf("unsupported type for 'list' parameter: %T", listParam)
		}
	}
	if len(st.List) == 0 {
		return fmt.Errorf("MAC list is empty")
	}

	selectParam, ok := g.params["select"].(string)
	if !ok || selectParam != "sequential" {
		st.Select = SelectTypeRandom
	} else {
		st.Select = SelectTypeSequential
	}

	g.state = st
	return nil
}

func (g *MacGenerator) nextList() (string, error) {
	st := g.state.(*macGeneratorStateList)
	if len(st.List) == 0 {
		return "", fmt.Errorf("MAC list is empty")
	}

	var idx int64
	if st.Select == SelectTypeSequential {
		if st.NextIndex >= int64(len(st.List)) {
			if g.allowRepeats {
				st.NextIndex = 0
			} else {
				return "", fmt.Errorf("no more MACs in list")
			}
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

func (g *MacGenerator) initRangeState() error {
	st := &macGeneratorStateRange{Step: 1}
	if err := mapstructure.Decode(g.params, st); err != nil {
		return fmt.Errorf("failed to decode range mac generator params: %w", err)
	}

	var err error
	st.firstMac, err = mac.New(st.Start)
	if err != nil {
		return fmt.Errorf("invalid 'start': %w", err)
	}
	currentMac := *st.firstMac
	st.currentMac = &currentMac

	st.lastMac, err = mac.New(st.End)
	if err != nil {
		return fmt.Errorf("invalid 'end': %w", err)
	}

	g.state = st
	return nil
}

func (g *MacGenerator) nextRange() (string, error) {
	st := g.state.(*macGeneratorStateRange)

	if st.Random {
		// Generate random MAC within the range
		return g.generateRandomMacInRange(st)
	}

	// Sequential generation
	// Check if current MAC is beyond the range
	if st.currentMac.Compare(st.lastMac) > 0 {
		if g.allowRepeats {
			// Reset to first MAC - create a proper copy
			resetMac, err := mac.New(st.Start)
			if err != nil {
				return "", fmt.Errorf("failed to reset MAC: %w", err)
			}
			st.currentMac = resetMac
		} else {
			return "", fmt.Errorf("last MAC reached")
		}
	}

	// Return current MAC and increment for next call
	result := st.currentMac.ShowHex()
	st.currentMac.Increase(st.Step)

	return result, nil
}

func (g *MacGenerator) generateRandomMacInRange(st *macGeneratorStateRange) (string, error) {
	// Convert MAC addresses to big integers for calculation
	startBytes := st.firstMac.HwAddr()
	endBytes := st.lastMac.HwAddr()

	startInt := new(big.Int).SetBytes(startBytes)
	endInt := new(big.Int).SetBytes(endBytes)

	// Calculate the range size
	rangeSize := new(big.Int).Sub(endInt, startInt)
	rangeSize.Add(rangeSize, big.NewInt(1)) // Include the end MAC

	// Generate random number within range
	randomOffset, err := rand.Int(rand.Reader, rangeSize)
	if err != nil {
		return "", fmt.Errorf("failed to generate random number: %w", err)
	}

	// Calculate the random MAC address
	randomMacInt := new(big.Int).Add(startInt, randomOffset)

	// Convert back to MAC address bytes (6 bytes for MAC)
	macBytes := randomMacInt.Bytes()

	// Pad with leading zeros if necessary to ensure 6 bytes
	if len(macBytes) < 6 {
		paddedBytes := make([]byte, 6)
		copy(paddedBytes[6-len(macBytes):], macBytes)
		macBytes = paddedBytes
	}

	// Create MAC from bytes and return hex representation
	randomMac, err := mac.NewFromBytes(macBytes)
	if err != nil {
		return "", fmt.Errorf("failed to create MAC from random bytes: %w", err)
	}

	return randomMac.ShowHex(), nil
}

func (g *MacGenerator) initRandomState(variant string) error {
	st := &macGeneratorStateRandom{}

	if variant == "random" {
		st.Pattern = `[0-9A-F]{2}:[0-9A-F]{2}:[0-9A-F]{2}:[0-9A-F]{2}:[0-9A-F]{2}:[0-9A-F]{2}`
	} else {
		if err := mapstructure.Decode(g.params, st); err != nil {
			return fmt.Errorf("failed to decode random MAC generator params: %w", err)
		}
	}

	if st.Pattern == "" {
		return fmt.Errorf("'pattern' parameter is required for pattern variant")
	}

	var err error
	st.reggenerator, err = reggen.NewGenerator(st.Pattern)
	if err != nil {
		return fmt.Errorf("failed to create MAC generator: %w", err)
	}

	g.state = st
	return nil
}

func (g *MacGenerator) nextRandom() (string, error) {
	st := g.state.(*macGeneratorStateRandom)

	for i := 0; i < g.maxTries; i++ {
		str := st.reggenerator.Generate(100)

		if g.isUsable(str) {
			return str, nil
		}
	}

	return "", fmt.Errorf("could not generate a unique random MAC after %d tries", g.maxTries)
}

func init() {
	RegisterGenerator("mac", NewMacGenerator)
}
