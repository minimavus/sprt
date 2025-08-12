package variables

type (
	fieldSet struct {
		base
		Fields []Parameter `json:"fields"`
		Label  string      `json:"label"`
	}

	FieldSetParameter interface {
		Parameter
		WithFields(fields ...Parameter) FieldSetParameter
	}
)

func NewFieldSetParameter(name, label string) FieldSetParameter {
	return &fieldSet{
		base: base{
			Type: paramFieldSet,
			Name: name,
		},
		Label: label,
	}
}

func NewCollapseSetParameter(name, label string) FieldSetParameter {
	return &fieldSet{
		base: base{
			Type: paramCollapseSet,
			Name: name,
		},
		Label: label,
	}
}

func (b *fieldSet) SetUpdateOnChange(updateOnChange []string) Parameter {
	b.base.UpdateOnChange = updateOnChange
	return b
}

func (b *fieldSet) SetAdvanced(advanced bool) Parameter {
	b.base.Advanced = advanced
	return b
}

func (b *fieldSet) WithAdditionalRules(rules ...Rule) Parameter {
	b.base.Rules = append(b.base.Rules, rules...)
	return b
}

func (b *fieldSet) WithFields(fields ...Parameter) FieldSetParameter {
	b.Fields = fields
	return b
}

func (b *fieldSet) Watch(watch ...*Watch) Parameter {
	b.base.W = watch
	return b
}
