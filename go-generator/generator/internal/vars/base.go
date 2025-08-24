package vars

import (
	"github.com/rs/zerolog"
)

// baseGenerator provides a common base for all variable generators.
// It handles common parameters and stores the latest generated value.
// It is intended to be embedded in specific generator structs.
type baseGenerator struct {
	params       map[string]any
	logger       *zerolog.Logger
	allVars      *Vars
	latest       any
	used         map[any]struct{} // Replace slice with map
	maxTries     int
	allowRepeats bool
}

// Init initializes the base generator with common properties.
func (b *baseGenerator) Init(params map[string]any, logger *zerolog.Logger, allVars *Vars) {
	b.params = params
	b.logger = logger
	b.allVars = allVars
	b.used = make(map[any]struct{}) // Initialize used as a map

	maxTries, ok := params["maxTries"].(int)
	if !ok {
		maxTries = 10 // Default value
	}
	b.maxTries = maxTries

	allowRepeats, ok := params["allowRepeats"].(bool)
	if !ok {
		allowRepeats = false // Default value
	}
	b.allowRepeats = allowRepeats
}

// Latest returns the last generated value.
func (b *baseGenerator) Latest() any {
	return b.latest
}

// setLatest sets the last generated value.
func (b *baseGenerator) setLatest(value any) {
	b.latest = value
}

// Amount returns the number of possible values for the generator.
// Base implementation returns 1 and should be overridden by specific generators
// if they can produce more than one value.
func (b *baseGenerator) Amount() int {
	return 1
}

// isUsable checks if a value has been used before, if allow_repeats is true.
func (b *baseGenerator) isUsable(value any) bool {
	if b.allowRepeats {
		return true
	}
	_, exists := b.used[value]
	return !exists
}

// pushToUsed adds a value to the used list if allow_repeats is false.
func (b *baseGenerator) pushToUsed(value any) {
	if !b.allowRepeats {
		b.used[value] = struct{}{}
	}
}
