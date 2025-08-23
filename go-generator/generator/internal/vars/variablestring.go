package vars

import (
	"fmt"

	"github.com/rs/zerolog"
)

// VariableStringGenerator generates a string by substituting variables and functions in a pattern.
type VariableStringGenerator struct {
	baseGenerator
	pattern string
}

// NewVariableStringGenerator creates a new VariableStringGenerator.
func NewVariableStringGenerator(params map[string]any, logger *zerolog.Logger, allVars *Vars) (Generator, error) {
	pattern, ok := params["pattern"].(string)
	if !ok {
		return nil, fmt.Errorf("'pattern' parameter is required and must be a string for variablestring generator")
	}

	g := &VariableStringGenerator{
		pattern: pattern,
	}
	g.Init(params, logger, allVars)

	return g, nil
}

// Next generates the next string value by substituting the pattern.
func (g *VariableStringGenerator) Next() (any, error) {
	for i := 0; i < g.maxTries; i++ {
		// Substitute the pattern using all available variables and functions.
		// We pass nil for additional vars and true for functions, as in the Perl original.
		substituted, err := g.allVars.Substitute(g.pattern, &SubstituteOpts{RunFunctions: true})
		if err != nil {
			return nil, fmt.Errorf("failed to substitute pattern: %w", err)
		}

		if g.isUsable(substituted) {
			g.pushToUsed(substituted)
			g.setLatest(substituted)
			return substituted, nil
		}
	}

	return nil, fmt.Errorf("failed to generate a unique value after %d tries", g.maxTries)
}

func init() {
	RegisterGenerator("variablestring", NewVariableStringGenerator)
}
