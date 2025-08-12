package variables

import (
	"fmt"

	"github.com/cisco-open/sprt/go-generator/sdk/variables"
)

type (
	VariableDefinition struct {
		Parameters variables.Params `json:"parameters"`
		Schema     any              `json:"schema,omitempty"`
	}
)

func GetVariableDefinition(variable string) (VariableDefinition, error) {
	switch variable {
	case "COA", "coa":
		return COA, nil
	case "Guest", "guest":
		return Guest, nil
	default:
		return VariableDefinition{}, fmt.Errorf("unknown variable '%s'", variable)
	}
}
