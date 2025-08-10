package variables

type (
	checkboxParameter struct {
		base
		Value bool   `json:"value"`
		Label string `json:"label"`
	}

	CheckboxParameter interface {
		Parameter
	}
)

func NewCheckboxParameter(name string, value bool, label string) CheckboxParameter {
	return &checkboxParameter{
		base: base{
			Type: paramCheckbox,
			Name: name,
		},
		Value: value,
		Label: label,
	}
}

func (b *checkboxParameter) SetUpdateOnChange(updateOnChange []string) Parameter {
	b.base.UpdateOnChange = updateOnChange
	return b
}

func (b *checkboxParameter) SetAdvanced(advanced bool) Parameter {
	b.base.Advanced = advanced
	return b
}

func (b *checkboxParameter) WithAdditionalRules(rules ...rule) Parameter {
	b.base.Rules = append(b.base.Rules, rules...)
	return b
}

func (b *checkboxParameter) Watch(watch ...*Watch) Parameter {
	b.base.W = watch
	return b
}
