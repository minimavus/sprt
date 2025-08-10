package variables

type (
	infoParameter struct {
		base
		Value   string `json:"value"`
		SubType string `json:"sub_type,omitempty"`
	}

	InfoParameter interface {
		Parameter
		WithSubType(subType string) InfoParameter
	}
)

func NewInfoParameter(name string, value string) InfoParameter {
	return &infoParameter{
		base: base{
			Type: paramText,
			Name: name,
		},
		Value: value,
	}
}

func (b *infoParameter) WithSubType(subType string) InfoParameter {
	b.SubType = subType
	return b
}

func (b *infoParameter) SetUpdateOnChange(updateOnChange []string) Parameter {
	b.base.UpdateOnChange = updateOnChange
	return b
}

func (b *infoParameter) SetAdvanced(advanced bool) Parameter {
	b.base.Advanced = advanced
	return b
}

func (b *infoParameter) WithAdditionalRules(rules ...rule) Parameter {
	b.base.Rules = append(b.base.Rules, rules...)
	return b
}

func (b *infoParameter) Watch(watch ...*Watch) Parameter {
	b.base.W = watch
	return b
}
