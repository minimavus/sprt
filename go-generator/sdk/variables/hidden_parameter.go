package variables

import "github.com/kaptinlin/jsonschema"

type (
	hiddenParameter struct {
		base
		Value string `json:"value"`
	}

	HiddenParameter interface {
		Parameter
	}
)

func NewHiddenParameter(name string, value string) HiddenParameter {
	return &hiddenParameter{
		base: base{
			Type: paramHidden,
			Name: name,
		},
		Value: value,
	}
}

func (b *hiddenParameter) SetUpdateOnChange(updateOnChange []string) Parameter {
	b.base.UpdateOnChange = updateOnChange
	return b
}

func (b *hiddenParameter) SetAdvanced(advanced bool) Parameter {
	b.base.Advanced = advanced
	return b
}

func (b *hiddenParameter) WithAdditionalRules(rules ...Rule) Parameter {
	b.base.Rules = append(b.base.Rules, rules...)
	return b
}

func (b *hiddenParameter) Watch(watch ...*Watch) Parameter {
	b.base.W = watch
	return b
}

func (b *hiddenParameter) IfThenElseSchema(condition jsonschema.ConditionalSchema) Parameter {
	b.base.ifThenElse = condition
	return b
}
