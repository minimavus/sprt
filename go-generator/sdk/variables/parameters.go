package variables

import (
	j "encoding/json"

	"github.com/cisco-open/sprt/go-generator/sdk/json"
	"github.com/kaptinlin/jsonschema"
)

type (
	ParametersBlock struct {
		IfThenElse *jsonschema.ConditionalSchema

		Title      string      `json:"title"`
		Parameters ParamsSlice `json:"parameters"`
		PropName   string      `json:"prop_name"`
	}

	params struct {
		b []ParametersBlock
	}

	Params interface {
		ToJSONSchema() []j.RawMessage
		Len() int
		At(i int) ParametersBlock
	}

	ParamsSlice []Parameter

	Parameter interface {
		GetType() parameterType
		GetName() string
		SetUpdateOnChange(updateOnChange []string) Parameter
		SetAdvanced(advanced bool) Parameter
		WithAdditionalRules(rules ...Rule) Parameter
		Watch(watch ...*Watch) Parameter
		ToJSONSchema() (any, error)
		IfThenElseSchema(jsonschema.ConditionalSchema) Parameter
	}
)

const (
	paramText           parameterType = "text"
	paramTextInput      parameterType = "text_input"
	paramNumberInput    parameterType = "number_input"
	paramCheckbox       parameterType = "checkbox"
	paramHidden         parameterType = "hidden"
	paramSelect         parameterType = "select"
	paramLoadableSelect parameterType = "loadable_select"
	paramRadio          parameterType = "radio"
	paramColumns        parameterType = "columns"
	paramVariants       parameterType = "variants"
	paramDictionary     parameterType = "dictionary"
	paramCheckboxes     parameterType = "checkboxes"
	paramList           parameterType = "list"
	paramDivider        parameterType = "divider"
	paramFieldSet       parameterType = "field_set"
	paramCollapseSet    parameterType = "collapse_set"
)

func (p ParamsSlice) With(params ...Parameter) ParamsSlice {
	return append(p, params...)
}

func BuildParams(blocks ...ParametersBlock) Params {
	return &params{
		b: blocks,
	}
}

func (p *params) Len() int {
	return len(p.b)
}

func (p *params) At(i int) ParametersBlock {
	return p.b[i]
}

func (p *params) MarshalJSON() ([]byte, error) {
	return json.Marshal(p.b)
}
