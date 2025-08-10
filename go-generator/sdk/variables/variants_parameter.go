package variables

type (
	variant struct {
		Description   string      `json:"desc"`
		Name          string      `json:"name"`
		Short         string      `json:"short"`
		ShowIfChecked bool        `json:"show_if_checked"`
		Fields        []Parameter `json:"fields"`
		Rules         rules       `json:"rules,omitempty"`
	}

	variantsParameter struct {
		base
		Variants []Variant `json:"variants"`
		Title    string    `json:"title"`
		Inline   bool      `json:"inline,omitempty"`
		Value    string    `json:"value,omitempty"`
	}

	Variant interface {
		WithField(...Parameter) Variant
		WithDescription(string) Variant
		WithShort(string) Variant
		WithShowIfChecked(bool) Variant
		WithAdditionalRules(...rule) Variant
	}

	VariantsParameter interface {
		Parameter
		WithVariants(...Variant) VariantsParameter
		WithInline(inline bool) VariantsParameter
		WithValue(value string) VariantsParameter
	}
)

func NewVariant(name string) Variant {
	return &variant{
		Name:   name,
		Fields: make([]Parameter, 0),
	}
}

func (v *variant) WithField(field ...Parameter) Variant {
	v.Fields = append(v.Fields, field...)
	return v
}

func (v *variant) WithDescription(description string) Variant {
	v.Description = description
	return v
}

func (v *variant) WithShort(short string) Variant {
	v.Short = short
	return v
}

func (v *variant) WithShowIfChecked(showIfChecked bool) Variant {
	v.ShowIfChecked = showIfChecked
	return v
}

func (v *variant) WithAdditionalRules(rules ...rule) Variant {
	v.Rules = append(v.Rules, rules...)
	return v
}

func NewVariantsParameter(name string, title string) VariantsParameter {
	return &variantsParameter{
		base: base{
			Type: paramVariants,
			Name: name,
		},
		Title: title,
	}
}

func (b *variantsParameter) WithVariants(variant ...Variant) VariantsParameter {
	for _, v := range variant {
		b.Variants = append(b.Variants, v)
	}
	return b
}

func (b *variantsParameter) WithInline(inline bool) VariantsParameter {
	b.Inline = inline
	return b
}

func (b *variantsParameter) WithValue(value string) VariantsParameter {
	b.Value = value
	return b
}

func (b *variantsParameter) SetUpdateOnChange(updateOnChange []string) Parameter {
	b.base.UpdateOnChange = updateOnChange
	return b
}

func (b *variantsParameter) SetAdvanced(advanced bool) Parameter {
	b.base.Advanced = advanced
	return b
}

func (b *variantsParameter) WithAdditionalRules(rules ...rule) Parameter {
	b.base.Rules = append(b.base.Rules, rules...)
	return b
}

func (b *variantsParameter) Watch(watch ...*Watch) Parameter {
	b.base.W = watch
	return b
}
