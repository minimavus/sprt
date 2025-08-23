package vars

import (
	"fmt"

	"github.com/rs/zerolog"
)

// ConstGenerator is a generator that always returns the same constant value.
type ConstGenerator struct {
	baseGenerator
}

// NewConstGenerator creates a new ConstGenerator.
// It expects a "value" parameter in the params map.
func NewConstGenerator(params map[string]any, logger *zerolog.Logger, allVars *Vars) (Generator, error) {
	value, exists := params["value"]
	if !exists {
		return nil, fmt.Errorf("no 'value' parameter provided for const generator")
	}

	g := &ConstGenerator{}
	g.baseGenerator.Init(params, logger, allVars)
	g.setLatest(value) // The value is constant, so we can set it once.
	return g, nil
}

// Next returns the constant value.
func (g *ConstGenerator) Next() (any, error) {
	// For a constant, Next() always returns the same value.
	return g.latest, nil
}

func init() {
	RegisterGenerator("const", NewConstGenerator)
}
