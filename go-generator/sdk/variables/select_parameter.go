package variables

type (
	selectParameter[T string | []string] struct {
		base
		Options []Option[string] `json:"options"`
		Value   T                `json:"value"`
		Multi   bool             `json:"multi"`
		Label   string           `json:"label"`
	}

	loadableSelectParameter struct {
		base
		Load  any    `json:"load"`
		Multi bool   `json:"multi"`
		Label string `json:"label"`
	}

	LoadableSelectParameter interface {
		Parameter
		SetMulti(multi bool) LoadableSelectParameter
	}

	SelectParameter interface {
		Parameter
	}
)

func NewSingleSelectParameter(name, label string, options []Option[string], value string) SelectParameter {
	return &selectParameter[string]{
		base: base{
			Type: paramSelect,
			Name: name,
		},
		Options: options,
		Value:   value,
		Label:   label,
		Multi:   false,
	}
}

func NewMultiSelectParameter(name, label string, options []Option[string], value []string) SelectParameter {
	return &selectParameter[[]string]{
		base: base{
			Type: paramSelect,
			Name: name,
		},
		Options: options,
		Value:   value,
		Label:   label,
		Multi:   true,
	}
}

func (b *selectParameter[T]) SetUpdateOnChange(updateOnChange []string) Parameter {
	b.base.UpdateOnChange = updateOnChange
	return b
}

func (b *selectParameter[T]) SetAdvanced(advanced bool) Parameter {
	b.base.Advanced = advanced
	return b
}

func (b *selectParameter[T]) WithAdditionalRules(rules ...rule) Parameter {
	b.base.Rules = append(b.base.Rules, rules...)
	return b
}

func (b *selectParameter[T]) Watch(watch ...*Watch) Parameter {
	b.base.W = watch
	return b
}

func NewLoadableSelectParameter(name, label string, load *LoadParams) LoadableSelectParameter {
	return &loadableSelectParameter{
		base: base{
			Type: paramLoadableSelect,
			Name: name,
		},
		Load:  load,
		Label: label,
	}
}

func (b *loadableSelectParameter) SetUpdateOnChange(updateOnChange []string) Parameter {
	b.base.UpdateOnChange = updateOnChange
	return b
}

func (b *loadableSelectParameter) SetAdvanced(advanced bool) Parameter {
	b.base.Advanced = advanced
	return b
}

func (b *loadableSelectParameter) WithAdditionalRules(rules ...rule) Parameter {
	b.base.Rules = append(b.base.Rules, rules...)
	return b
}

func (b *loadableSelectParameter) SetMulti(multi bool) LoadableSelectParameter {
	b.Multi = multi
	return b
}

func (b *loadableSelectParameter) Watch(watch ...*Watch) Parameter {
	b.base.W = watch
	return b
}
