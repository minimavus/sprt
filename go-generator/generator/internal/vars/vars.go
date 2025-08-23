package vars

import (
	"fmt"
	"regexp"
	"strings"

	"github.com/cisco-open/sprt/go-generator/sdk/app"
	"github.com/cisco-open/sprt/go-generator/sdk/utils"
	"github.com/rs/zerolog"
)

// Generator is the interface that all variable generators must implement.
type Generator interface {
	Next() (any, error)
	Latest() any
	Amount() int
}

// GeneratorFactory is a function that creates a new generator instance.
type GeneratorFactory func(params map[string]any, logger *zerolog.Logger, allVars *Vars) (Generator, error)

var generatorRegistry = make(map[string]GeneratorFactory)

// RegisterGenerator is used by generator implementations to register themselves.
func RegisterGenerator(typeName string, factory GeneratorFactory) {
	if _, exists := generatorRegistry[typeName]; exists {
		panic(fmt.Sprintf("generator type '%s' is already registered", typeName))
	}
	generatorRegistry[typeName] = factory
}

// Vars is the main struct for managing variables and their generation.
type Vars struct {
	logger       *zerolog.Logger
	maxTries     int
	stopIfNoMore bool
	Error        error
	App          app.App
	variables    map[string]Generator
	aliases      map[string]string
	order        []string
	noNext       bool
	lastSnapshot map[string]any
}

// New creates and initializes a new Vars object.
func New(parent app.App, opts ...varsOption) *Vars {
	o := defaultVarsOptions()
	o = applyVarsOptions(o, opts)

	if o.logger == nil {
		o.logger = parent.Logger()
	}

	return &Vars{
		logger:       o.logger,
		App:          parent,
		maxTries:     o.maxTries,
		stopIfNoMore: o.stopIfNoMore,

		variables:    make(map[string]Generator),
		aliases:      make(map[string]string),
		order:        []string{},
		lastSnapshot: make(map[string]any),
	}
}

// Add creates and adds a new variable generator.
func (v *Vars) Add(name, typeName string, params map[string]any) error {
	factory, exists := generatorRegistry[typeName]
	if !exists {
		return fmt.Errorf("generator type '%s' not found", typeName)
	}

	gen, err := factory(params, v.logger, v)
	if err != nil {
		return fmt.Errorf("failed to create generator '%s': %w", name, err)
	}

	v.variables[name] = gen
	v.order = append(v.order, name)
	return nil
}

// AddAlias adds an alias for a variable. The alias can be a path to a nested value.
func (v *Vars) AddAlias(aliasName, sourcePath string) {
	v.aliases[aliasName] = sourcePath
}

// IsAdded checks if a variable generator has been added.
func (v *Vars) IsAdded(name string) bool {
	_, exists := v.variables[name]
	return exists
}

// Snapshot returns a map of the latest values of all variables and aliases.
func (v *Vars) Snapshot() map[string]any {
	r := make(map[string]any)
	for name, gen := range v.variables {
		r[name] = gen.Latest()
	}

	// Resolve aliases
	for alias, path := range v.aliases {
		val, err := utils.GetByPath(r, path)
		if err == nil {
			r[alias] = val
		} else {
			r[alias] = ""
			v.logger.Warn().Err(err).Msgf("Could not resolve alias '%s' with path '%s'", alias, path)
		}
	}

	v.lastSnapshot = r
	return r
}

// NextAll advances all variable generators to their next value.
func (v *Vars) NextAll() (map[string]any, error) {
	if v.noNext && v.stopIfNoMore {
		return nil, nil // No more values
	}

	r := make(map[string]any)
	for _, name := range v.order {
		gen := v.variables[name]
		nextVal, err := gen.Next()
		if err != nil {
			v.Error = err
			v.noNext = true
			return nil, fmt.Errorf("error getting next value for '%s': %w", name, err)
		}
		r[name] = nextVal
	}
	v.lastSnapshot = r
	return r, nil
}

// SubstituteOpts provides options for the Substitute function.
type SubstituteDelimiter string

const (
	SubstituteDelimiterDollar SubstituteDelimiter = "DOLLAR"
	SubstituteDelimiterBraces SubstituteDelimiter = "BRACES"
)

type SubstituteOpts struct {
	Vars         map[string]any
	Delimiter    SubstituteDelimiter
	RunFunctions bool
}

// Substitute replaces placeholders in a string with their corresponding variable values.
func (v *Vars) Substitute(line string, opts *SubstituteOpts) (string, error) {
	if opts == nil {
		opts = &SubstituteOpts{}
	}
	vars := opts.Vars
	if vars == nil {
		vars = v.Snapshot()
	}

	delimiter := opts.Delimiter
	if delimiter != SubstituteDelimiterDollar && delimiter != SubstituteDelimiterBraces {
		delimiter = SubstituteDelimiterDollar // Default
	}

	// Create a slice of variable names for the regex.
	varNames := make([]string, 0, len(vars))
	for k := range vars {
		varNames = append(varNames, regexp.QuoteMeta(k))
	}

	// Build the regex dynamically.
	var start, end string
	if delimiter == SubstituteDelimiterDollar {
		start, end = `\$`, `\$`
	} else {
		start, end = `\{\{`, `\}\}`
	}

	reStr := fmt.Sprintf("%s((?:%s)(?:\\.[\\w-]+)*)%s", start, strings.Join(varNames, "|"), end)
	re := regexp.MustCompile(reStr)

	// Iteratively replace to handle nested variables.
	processed := line
	for {
		matches := re.FindStringSubmatch(processed)
		if len(matches) == 0 {
			break
		}
		fullMatch := matches[0]
		path := matches[1]

		val, err := utils.GetByPath(vars, path)
		if err != nil {
			// In case of error, replace with empty string to avoid infinite loops
			processed = strings.Replace(processed, fullMatch, "", 1)
			continue
		}

		processed = strings.Replace(processed, fullMatch, fmt.Sprintf("%v", val), 1)
	}

	// Process functions if enabled
	if opts.RunFunctions {
		var err error
		processed, err = ProcessFunctions(processed)
		if err != nil {
			return "", err
		}
	}

	return processed, nil
}

// Clear resets the variables, aliases, and order.
func (v *Vars) Clear() {
	v.variables = make(map[string]Generator)
	v.aliases = make(map[string]string)
	v.order = []string{}
	v.lastSnapshot = make(map[string]any)
	v.Error = nil
	v.noNext = false
}

// AmountOf returns the number of items a generator can produce.
// Returns -1 if the variable is not found.
func (v *Vars) AmountOf(name string) int {
	gen, exists := v.variables[name]
	if !exists {
		return -1
	}
	return gen.Amount()
}

func (v *Vars) LatestOf(name string) any {
	gen, exists := v.variables[name]
	if !exists {
		return nil
	}
	return gen.Latest()
}
