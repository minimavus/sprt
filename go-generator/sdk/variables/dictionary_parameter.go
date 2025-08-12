package variables

import "github.com/cisco-open/sprt/go-generator/sdk/variables/dictionaries"

type (
	dictionaryParameter struct {
		base
		Value           any                           `json:"value"`
		DictionaryTypes []dictionaries.DictionaryType `json:"dictionary_types"`
		Label           string                        `json:"label,omitempty"`
		Select          SelectFromDictionary          `json:"select,omitempty"`
		AllowRepeats    bool                          `json:"allow_repeats,omitempty"`
	}

	SelectFromDictionary string

	DictionaryParameter interface {
		Parameter
		PreselectAllOfType(t dictionaries.DictionaryType) DictionaryParameter
		PreselectByName(name string) DictionaryParameter
		WithLabel(label string) DictionaryParameter
		WithSelect(SelectFromDictionary) DictionaryParameter
		WithRandomSelect() DictionaryParameter
		WithSequentialSelect() DictionaryParameter
		WithAllowRepeats(allowRepeats bool) DictionaryParameter
	}
)

const (
	DictionarySelectSequential SelectFromDictionary = "sequential"
	DictionarySelectRandom     SelectFromDictionary = "random"

	DictionaryPrefixAllByType = "allByType:"
	DictionaryPrefixByName    = "byName:"
)

func NewDictionaryParameter(name string, value []string, dictionaryTypes []dictionaries.DictionaryType) DictionaryParameter {
	return &dictionaryParameter{
		base: base{
			Type: paramDictionary,
			Name: name,
		},
		Value:           value,
		DictionaryTypes: dictionaryTypes,
		Select:          DictionarySelectSequential,
	}
}

func (b *dictionaryParameter) PreselectAllOfType(t dictionaries.DictionaryType) DictionaryParameter {
	b.Value = DictionaryPrefixAllByType + t
	return b
}

func (b *dictionaryParameter) PreselectByName(name string) DictionaryParameter {
	b.Value = DictionaryPrefixByName + name
	return b
}

func (b *dictionaryParameter) WithLabel(label string) DictionaryParameter {
	b.Label = label
	return b
}

func (b *dictionaryParameter) WithSelect(selectType SelectFromDictionary) DictionaryParameter {
	b.Select = selectType
	return b
}

func (b *dictionaryParameter) WithRandomSelect() DictionaryParameter {
	return b.WithSelect(DictionarySelectRandom)
}

func (b *dictionaryParameter) WithSequentialSelect() DictionaryParameter {
	return b.WithSelect(DictionarySelectSequential)
}

func (b *dictionaryParameter) WithAllowRepeats(allowRepeats bool) DictionaryParameter {
	b.AllowRepeats = allowRepeats
	return b
}

func (b *dictionaryParameter) SetUpdateOnChange(updateOnChange []string) Parameter {
	b.base.UpdateOnChange = updateOnChange
	return b
}

func (b *dictionaryParameter) SetAdvanced(advanced bool) Parameter {
	b.base.Advanced = advanced
	return b
}

func (b *dictionaryParameter) WithAdditionalRules(rules ...Rule) Parameter {
	b.base.Rules = append(b.base.Rules, rules...)
	return b
}

func (b *dictionaryParameter) Watch(watch ...*Watch) Parameter {
	b.base.W = watch
	return b
}
