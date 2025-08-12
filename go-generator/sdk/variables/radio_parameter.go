package variables

import "github.com/kaptinlin/jsonschema"

type (
	radioParameter struct {
		base
		Label   string           `json:"label"`
		Options []Option[string] `json:"options"`
		Value   string           `json:"value"`
	}

	RadioParameter interface {
		Parameter
	}
)

func NewRadioParameter(name, label string, options []Option[string], value string) RadioParameter {
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

func (b *radioParameter) WithAdditionalRules(rules ...Rule) Parameter {
	b.base.Rules = append(b.base.Rules, rules...)
	return b
}

func (b *radioParameter) Watch(watch ...*Watch) Parameter {
	b.base.W = watch
	return b
}

func (b *radioParameter) IfThenElseSchema(condition jsonschema.ConditionalSchema) Parameter {
	b.base.ifThenElse = condition
	return b
}
