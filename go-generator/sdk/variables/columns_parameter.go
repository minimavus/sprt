package variables

type (
	columnsParameter struct {
		base
		Value [][]Parameter `json:"value"`
	}

	ColumnsParameter interface {
		Parameter
		WithColumn(column ...Parameter) ColumnsParameter
	}
)

func NewColumnsParameter(name string) ColumnsParameter {
	return &columnsParameter{
		base: base{
			Type: paramColumns,
			Name: name,
		},
		Value: make([][]Parameter, 0),
	}
}

func (b *columnsParameter) WithColumn(column ...Parameter) ColumnsParameter {
	b.Value = append(b.Value, column)
	return b
}

func (b *columnsParameter) SetUpdateOnChange(updateOnChange []string) Parameter {
	b.base.UpdateOnChange = updateOnChange
	return b
}

func (b *columnsParameter) SetAdvanced(advanced bool) Parameter {
	b.base.Advanced = advanced
	return b
}

func (b *columnsParameter) WithAdditionalRules(rules ...rule) Parameter {
	b.base.Rules = append(b.base.Rules, rules...)
	return b
}

func (b *columnsParameter) Watch(watch ...*Watch) Parameter {
	b.base.W = watch
	return b
}
