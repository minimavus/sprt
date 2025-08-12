package variables

import "github.com/kaptinlin/jsonschema"

type (
	listParameter struct {
		base
		Value         string `json:"value"`
		Label         string `json:"label"`
		Hint          string `json:"hint"`
		AllowFromFile bool   `json:"allow_from_file"`
		Validate      bool   `json:"validate"`
	}

	ListParameter interface {
		Parameter
		SetHint(hint string) ListParameter
		SetAllowFromFile(allowFromFile bool) ListParameter
		SetValidate(validate bool) ListParameter
	}
)

func NewListParameter(name, label, value string) ListParameter {
	return &listParameter{
		base: base{
			Type: paramList,
			Name: name,
		},
		Value: value,
		Label: label,
	}
}

func (b *listParameter) SetUpdateOnChange(updateOnChange []string) Parameter {
	b.base.UpdateOnChange = updateOnChange
	return b
}

func (b *listParameter) SetAdvanced(advanced bool) Parameter {
	b.base.Advanced = advanced
	return b
}

func (b *listParameter) WithAdditionalRules(rules ...Rule) Parameter {
	b.base.Rules = append(b.base.Rules, rules...)
	return b
}

func (b *listParameter) SetHint(hint string) ListParameter {
	b.Hint = hint
	return b
}

func (b *listParameter) SetAllowFromFile(allowFromFile bool) ListParameter {
	b.AllowFromFile = allowFromFile
	return b
}

func (b *listParameter) SetValidate(validate bool) ListParameter {
	b.Validate = validate
	return b
}

func (b *listParameter) Watch(watch ...*Watch) Parameter {
	b.base.W = watch
	return b
}

func (b *listParameter) IfThenElseSchema(condition jsonschema.ConditionalSchema) Parameter {
	b.base.ifThenElse = condition
	return b
}
