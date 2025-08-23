package vars

import (
	"fmt"
	"strings"

	"github.com/rs/zerolog"
)

// CredentialsGenerator generates credentials (username/password pairs) from a list.
// It wraps the StringGenerator and processes its output.
type CredentialsGenerator struct {
	StringGenerator // Embed StringGenerator to reuse its functionality
}

// NewCredentialsGenerator creates a new CredentialsGenerator.
// It requires the 'variant' to be 'list'.
func NewCredentialsGenerator(params map[string]any, logger *zerolog.Logger, allVars *Vars) (Generator, error) {
	how, ok := params["how"].(string)
	if !ok || how != "list" {
		return nil, fmt.Errorf("only 'list' variant is supported for credentials generator")
	}

	// Create an underlying StringGenerator
	stringGen, err := NewStringGenerator(params, logger, allVars)
	if err != nil {
		return nil, err
	}

	g := &CredentialsGenerator{
		StringGenerator: *(stringGen.(*StringGenerator)),
	}

	return g, nil
}

// Next gets the next item from the list (via the embedded StringGenerator)
// and splits it into a username/password slice.
func (g *CredentialsGenerator) Next() (any, error) {
	// Call the embedded StringGenerator's Next method
	nextVal, err := g.StringGenerator.Next()
	if err != nil {
		return nil, err
	}

	nextStr, ok := nextVal.(string)
	if !ok {
		return nil, fmt.Errorf("expected a string from the underlying generator, but got %T", nextVal)
	}

	// Split the string by the first colon
	parts := strings.SplitN(nextStr, ":", 2)

	g.setLatest(parts)
	return parts, nil
}

func init() {
	RegisterGenerator("credentials", NewCredentialsGenerator)
}
