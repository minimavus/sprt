package variables

type (
	basicValueInputParameter[T string | int] struct {
		base
		Value       T                 `json:"value"`
		Label       string            `json:"label"`
		Description string            `json:"description,omitempty"`
		Readonly    bool              `json:"readonly,omitempty"`
		Hint        string            `json:"hint,omitempty"`
		B           []InputSideButton `json:"buttons,omitempty"`
	}

	TextInputParameter interface {
		Parameter
		SetDescription(description string) TextInputParameter
		SetReadonly(readonly bool) TextInputParameter
		SetHint(hint string) TextInputParameter
		WithButtons(buttons ...InputSideButton) TextInputParameter
	}
)

func NewTextInputParameter(name, label, value string) TextInputParameter {
	return &basicValueInputParameter[string]{
		base: base{
			Type: paramTextInput,
			Name: name,
		},
		Value: value,
		Label: label,
	}
}

func (b *basicValueInputParameter[T]) SetHint(hint string) TextInputParameter {
	b.Hint = hint
	return b
}

func (b *basicValueInputParameter[T]) SetDescription(description string) TextInputParameter {
	b.Description = description
	return b
}

func (b *basicValueInputParameter[T]) SetReadonly(readonly bool) TextInputParameter {
	b.Readonly = readonly
	return b
}

func (b *basicValueInputParameter[T]) WithButtons(buttons ...InputSideButton) TextInputParameter {
	b.B = append(b.B, buttons...)
	return b
}

func (b *basicValueInputParameter[T]) SetUpdateOnChange(updateOnChange []string) Parameter {
	b.base.UpdateOnChange = updateOnChange
	return b
}

func (b *basicValueInputParameter[T]) SetAdvanced(advanced bool) Parameter {
	b.base.Advanced = advanced
	return b
}

func (b *basicValueInputParameter[T]) WithAdditionalRules(rules ...rule) Parameter {
	b.base.Rules = append(b.base.Rules, rules...)
	return b
}

func (b *basicValueInputParameter[T]) Watch(watch ...*Watch) Parameter {
	b.base.W = watch
	return b
}

func NewNumberInputParameter(name, label string, value int) TextInputParameter {
	return &basicValueInputParameter[int]{
		base: base{
			Type: paramNumberInput,
			Name: name,
		},
		Value: value,
		Label: label,
	}
}
