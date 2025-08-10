package variables

type (
	ParametersBlock struct {
		Title      string      `json:"title"`
		Parameters ParamsSlice `json:"parameters"`
		PropName   string      `json:"prop_name"`
	}

	Params []ParametersBlock

	ParamsSlice []Parameter

	Parameter interface {
		GetType() parameterType
		GetName() string
		SetUpdateOnChange(updateOnChange []string) Parameter
		SetAdvanced(advanced bool) Parameter
		WithAdditionalRules(rules ...rule) Parameter
		Watch(watch ...*Watch) Parameter
		ToJSONSchema() (any, error)
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
