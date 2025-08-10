package variables

type (
	radioParameter struct {
		base
		Label   string           `json:"label"`
		Options []Option[string] `json:"options"`
		Value   string           `json:"value"`
	}
)

func NewRadioParameter(name, label string, options []Option[string], value string) Parameter {
	return &radioParameter{
		base: base{
			Type: paramRadio,
			Name: name,
		},
		Label:   label,
		Options: options,
		Value:   value,
	}
}

func (b *radioParameter) SetUpdateOnChange(updateOnChange []string) Parameter {
	b.base.UpdateOnChange = updateOnChange
	return b
}

func (b *radioParameter) SetAdvanced(advanced bool) Parameter {
	b.base.Advanced = advanced
	return b
}

func (b *radioParameter) WithAdditionalRules(rules ...rule) Parameter {
	b.base.Rules = append(b.base.Rules, rules...)
	return b
}

func (b *radioParameter) Watch(watch ...*Watch) Parameter {
	b.base.W = watch
	return b
}
