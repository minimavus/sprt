package variables

import "github.com/kaptinlin/jsonschema"

type (
	checkboxesParameter[T any] struct {
		base
		Value   []T                 `json:"value,omitempty"`
		Options []OptionWithName[T] `json:"options"`
		Label   string              `json:"label"`
	}

	CheckboxesParameter[T any] interface {
		Parameter
		WithOption(name, label string, value T) CheckboxesParameter[T]
		WithValues(values []T) CheckboxesParameter[T]
	}
)

func NewCheckboxesParameter[T any](name string, label string, options ...OptionWithName[T]) CheckboxesParameter[T] {
	return &checkboxesParameter[T]{
		base: base{
			Type: paramCheckboxes,
			Name: name,
		},
		Options: options,
		Label:   label,
	}
}

func (b *checkboxesParameter[T]) SetUpdateOnChange(updateOnChange []string) Parameter {
	b.base.UpdateOnChange = updateOnChange
	return b
}

func (b *checkboxesParameter[T]) SetAdvanced(advanced bool) Parameter {
	b.base.Advanced = advanced
	return b
}

func (b *checkboxesParameter[T]) WithAdditionalRules(rules ...Rule) Parameter {
	b.base.Rules = append(b.base.Rules, rules...)
	return b
}

func (b *checkboxesParameter[T]) WithOption(name, label string, value T) CheckboxesParameter[T] {
	b.Options = append(b.Options, OptionWithName[T]{Value: value, Label: label, Name: name})
	return b
}

func (b *checkboxesParameter[T]) WithValues(values []T) CheckboxesParameter[T] {
	b.Value = values
	return b
}

func (b *checkboxesParameter[T]) Watch(watch ...*Watch) Parameter {
	b.base.W = watch
	return b
}

func (b *checkboxesParameter[T]) IfThenElseSchema(condition jsonschema.ConditionalSchema) Parameter {
	b.base.ifThenElse = condition
	return b
}
