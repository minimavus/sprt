package variables

import (
	"github.com/cisco-open/sprt/frontend-svc/internal/dictionaries"
	"github.com/google/uuid"
)

type (
	parameterType string

	rule string

	rules []rule

	UseAction string

	act struct {
		A UseAction `json:"action"`
		T string    `json:"target"`
		V any       `json:"value,omitempty"`
	}

	when struct {
		Value any   `json:"value"`
		Acts  []act `json:"acts"`
		N     bool  `json:"not"`
	}

	whens []when

	watch struct {
		Field string `json:"field"`
		W     whens  `json:"when"`
	}

	base struct {
		Type           parameterType `json:"type"`
		Name           string        `json:"name"`
		Advanced       bool          `json:"advanced"`
		UpdateOnChange []string      `json:"update_on_change,omitempty"`
		Rules          rules         `json:"rules,omitempty"`
		W              []*watch      `json:"watch,omitempty"`
	}

	Option[T any] struct {
		Value T      `json:"value"`
		Label string `json:"label"`
	}

	OptionWithName[T any] struct {
		Value T      `json:"value"`
		Label string `json:"label"`
		Name  string `json:"name"`
	}

	OptionsGroup[T any] struct {
		Name    string              `json:"name"`
		Label   string              `json:"label"`
		Options []OptionWithName[T] `json:"options"`
	}

	infoParameter struct {
		base
		Value   string `json:"value"`
		SubType string `json:"sub_type,omitempty"`
	}

	inputSideButton struct {
		Title string `json:"title"`
		Icon  string `json:"icon"`
		Type  string `json:"type"`
		Name  string `json:"name,omitempty"`
		V     any    `json:"values,omitempty"`
	}

	basicValueInputParameter[T string | int] struct {
		base
		Value       T                 `json:"value"`
		Label       string            `json:"label"`
		Description string            `json:"description,omitempty"`
		Readonly    bool              `json:"readonly,omitempty"`
		Hint        string            `json:"hint,omitempty"`
		B           []inputSideButton `json:"buttons,omitempty"`
	}

	checkboxParameter struct {
		base
		Value bool   `json:"value"`
		Label string `json:"label"`
	}

	checkboxesParameter[T any] struct {
		base
		Value   []T                 `json:"value,omitempty"`
		Options []OptionWithName[T] `json:"options"`
		Label   string              `json:"label"`
	}

	hiddenParameter struct {
		base
		Value string `json:"value"`
	}

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

	radioParameter struct {
		base
		Label   string           `json:"label"`
		Options []Option[string] `json:"options"`
		Value   string           `json:"value"`
	}

	columnsParameter struct {
		base
		Value [][]Parameter `json:"value"`
	}

	listParameter struct {
		base
		Value         string `json:"value"`
		Label         string `json:"label"`
		Hint          string `json:"hint"`
		AllowFromFile bool   `json:"allow_from_file"`
		Validate      bool   `json:"validate"`
	}

	SelectFromDictionary string

	dictionaryParameter struct {
		base
		Value           any                           `json:"value"`
		DictionaryTypes []dictionaries.DictionaryType `json:"dictionary_types"`
		Label           string                        `json:"label,omitempty"`
		Select          SelectFromDictionary          `json:"select,omitempty"`
		AllowRepeats    bool                          `json:"allow_repeats,omitempty"`
	}

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

	fieldSet struct {
		base
		Fields []Parameter `json:"fields"`
		Label  string      `json:"label"`
	}

	Parameter interface {
		GetType() parameterType
		GetName() string
		SetUpdateOnChange(updateOnChange []string) Parameter
		SetAdvanced(advanced bool) Parameter
		WithAdditionalRules(rules ...rule) Parameter
		Watch(watch ...*watch) Parameter
		ToJsonSchema() (any, error)
	}

	VariantsParameter interface {
		Parameter
		WithVariants(...Variant) VariantsParameter
		WithInline(inline bool) VariantsParameter
		WithValue(value string) VariantsParameter
	}

	LoadableSelectParameter interface {
		Parameter
		SetMulti(multi bool) LoadableSelectParameter
	}

	SelectParameter interface {
		Parameter
	}

	TextInputParameter interface {
		Parameter
		SetDescription(description string) TextInputParameter
		SetReadonly(readonly bool) TextInputParameter
		SetHint(hint string) TextInputParameter
		WithButtons(buttons ...inputSideButton) TextInputParameter
	}

	ListParameter interface {
		Parameter
		SetHint(hint string) ListParameter
		SetAllowFromFile(allowFromFile bool) ListParameter
		SetValidate(validate bool) ListParameter
	}

	CheckboxesParameter[T any] interface {
		Parameter
		WithOption(name, label string, value T) CheckboxesParameter[T]
		WithValues(values []T) CheckboxesParameter[T]
	}

	ColumnsParameter interface {
		Parameter
		WithColumn(column ...Parameter) ColumnsParameter
	}

	InfoParameter interface {
		Parameter
		WithSubType(subType string) InfoParameter
	}

	Divider interface {
		Parameter
		WithLabel(label string) Divider
	}

	FieldSetParameter interface {
		Parameter
		WithFields(fields ...Parameter) FieldSetParameter
	}

	DictionaryParameter interface {
		Parameter
		PreselectAllOfType(t dictionaries.DictionaryType) DictionaryParameter
		PreselectByName(name string) DictionaryParameter
		WithLabel(label string) DictionaryParameter
		WithSelect(SelectFromDictionary) DictionaryParameter
		WithAllowRepeats(allowRepeats bool) DictionaryParameter
	}
)

const (
	UseActionSetValue   UseAction = "set_value"
	UseActionHideValues UseAction = "hide_values"
	UseActionShowValues UseAction = "show_values"
	UseActionHide       UseAction = "hide"
	UseActionShow       UseAction = "show"
	UseActionDisable    UseAction = "disable"
	UseActionEnable     UseAction = "enable"

	paramText           parameterType = "text"
	paramTextInput      parameterType = "text_input"
	paramNumberInput    parameterType = "number_input"
	paramCheckbox       parameterType = "checkbox"
	paramHidden         parameterType = "hidden"
	paramSelect         parameterType = "select"
	paramLoadableSelect parameterType = "loadable_select"
	paramRadio          parameterType = "radio"
	paramColumns        parameterType = "columns"
	paramVariants       parameterType = "variants"
	paramDictionary     parameterType = "dictionary"
	paramCheckboxes     parameterType = "checkboxes"
	paramList           parameterType = "list"
	paramDivider        parameterType = "divider"
	paramFieldSet       parameterType = "field_set"
	paramCollapseSet    parameterType = "collapse_set"

	DictionarySelectSequential SelectFromDictionary = "sequential"
	DictionarySelectRandom     SelectFromDictionary = "random"

	dictionaryPrefixAllByType = "allByType:"
	dictionaryPrefixByName    = "byName:"
)

func (W *whens) When(value any, acts ...act) *whens {
	*W = append(*W, when{Value: value, Acts: acts})
	return W
}

func (W *whens) WhenNot(value any, acts ...act) *whens {
	*W = append(*W, when{Value: value, Acts: acts, N: true})
	return W
}

func NewWatch(field string) *watch {
	return &watch{Field: field, W: make(whens, 0)}
}

func (w *watch) When(value any, acts ...act) *watch {
	w.W.When(value, acts...)
	return w
}

func (w *watch) WhenNot(value any, acts ...act) *watch {
	w.W.WhenNot(value, acts...)
	return w
}

func (b *base) GetType() parameterType {
	return b.Type
}

func (b *base) GetName() string {
	return b.Name
}

func NewInfoParameter(name string, value string) InfoParameter {
	return &infoParameter{
		base: base{
			Type: paramText,
			Name: name,
		},
		Value: value,
	}
}

func (b *infoParameter) WithSubType(subType string) InfoParameter {
	b.SubType = subType
	return b
}

func (b *infoParameter) SetUpdateOnChange(updateOnChange []string) Parameter {
	b.base.UpdateOnChange = updateOnChange
	return b
}

func (b *infoParameter) SetAdvanced(advanced bool) Parameter {
	b.base.Advanced = advanced
	return b
}

func (b *infoParameter) WithAdditionalRules(rules ...rule) Parameter {
	b.base.Rules = append(b.base.Rules, rules...)
	return b
}

func (b *infoParameter) Watch(watch ...*watch) Parameter {
	b.base.W = watch
	return b
}

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

func (b *basicValueInputParameter[T]) WithButtons(buttons ...inputSideButton) TextInputParameter {
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

func (b *basicValueInputParameter[T]) Watch(watch ...*watch) Parameter {
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

func NewCheckboxParameter(name string, value bool, label string) Parameter {
	return &checkboxParameter{
		base: base{
			Type: paramCheckbox,
			Name: name,
		},
		Value: value,
		Label: label,
	}
}

func (b *checkboxParameter) SetUpdateOnChange(updateOnChange []string) Parameter {
	b.base.UpdateOnChange = updateOnChange
	return b
}

func (b *checkboxParameter) SetAdvanced(advanced bool) Parameter {
	b.base.Advanced = advanced
	return b
}

func (b *checkboxParameter) WithAdditionalRules(rules ...rule) Parameter {
	b.base.Rules = append(b.base.Rules, rules...)
	return b
}

func (b *checkboxParameter) Watch(watch ...*watch) Parameter {
	b.base.W = watch
	return b
}

func NewHiddenParameter(name string, value string) Parameter {
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

func (b *hiddenParameter) WithAdditionalRules(rules ...rule) Parameter {
	b.base.Rules = append(b.base.Rules, rules...)
	return b
}

func (b *hiddenParameter) Watch(watch ...*watch) Parameter {
	b.base.W = watch
	return b
}

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

func (b *selectParameter[T]) Watch(watch ...*watch) Parameter {
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

func (b *loadableSelectParameter) Watch(watch ...*watch) Parameter {
	b.base.W = watch
	return b
}

func NewRadioParameter(name, label string, options []Option[string], value string) Parameter {
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

func (b *radioParameter) WithAdditionalRules(rules ...rule) Parameter {
	b.base.Rules = append(b.base.Rules, rules...)
	return b
}

func (b *radioParameter) Watch(watch ...*watch) Parameter {
	b.base.W = watch
	return b
}

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

func (b *columnsParameter) Watch(watch ...*watch) Parameter {
	b.base.W = watch
	return b
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

func (b *variantsParameter) Watch(watch ...*watch) Parameter {
	b.base.W = watch
	return b
}

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
	b.Value = dictionaryPrefixAllByType + t
	return b
}

func (b *dictionaryParameter) PreselectByName(name string) DictionaryParameter {
	b.Value = dictionaryPrefixByName + name
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

func (b *dictionaryParameter) WithAdditionalRules(rules ...rule) Parameter {
	b.base.Rules = append(b.base.Rules, rules...)
	return b
}

func (b *dictionaryParameter) Watch(watch ...*watch) Parameter {
	b.base.W = watch
	return b
}

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

func (b *checkboxesParameter[T]) WithAdditionalRules(rules ...rule) Parameter {
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

func (b *checkboxesParameter[T]) Watch(watch ...*watch) Parameter {
	b.base.W = watch
	return b
}

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

func (b *listParameter) WithAdditionalRules(rules ...rule) Parameter {
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

func (b *listParameter) Watch(watch ...*watch) Parameter {
	b.base.W = watch
	return b
}

///

type ParamsSlice []Parameter

func (p ParamsSlice) With(params ...Parameter) ParamsSlice {
	return append(p, params...)
}

type Variant interface {
	WithField(...Parameter) Variant
	WithDescription(string) Variant
	WithShort(string) Variant
	WithShowIfChecked(bool) Variant
	WithAdditionalRules(...rule) Variant
}

func NewVariant(name string) Variant {
	return variant{
		Name:   name,
		Fields: make([]Parameter, 0),
	}
}

func (v variant) WithField(field ...Parameter) Variant {
	v.Fields = append(v.Fields, field...)
	return v
}

func (v variant) WithDescription(description string) Variant {
	v.Description = description
	return v
}

func (v variant) WithShort(short string) Variant {
	v.Short = short
	return v
}

func (v variant) WithShowIfChecked(showIfChecked bool) Variant {
	v.ShowIfChecked = showIfChecked
	return v
}

func (v variant) WithAdditionalRules(rules ...rule) Variant {
	v.Rules = append(v.Rules, rules...)
	return v
}

func NewDivider() Divider {
	u, err := uuid.NewV7()
	if err != nil {
		panic(err)
	}

	return &infoParameter{
		base: base{
			Type: paramDivider,
			Name: "divider-" + u.String(),
		},
		SubType: "divider",
	}
}

func (b *infoParameter) WithLabel(label string) Divider {
	b.Value = label
	return b
}

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

func (b *fieldSet) WithAdditionalRules(rules ...rule) Parameter {
	b.base.Rules = append(b.base.Rules, rules...)
	return b
}

func (b *fieldSet) WithFields(fields ...Parameter) FieldSetParameter {
	b.Fields = fields
	return b
}

func (b *fieldSet) Watch(watch ...*watch) Parameter {
	b.base.W = watch
	return b
}

func NewDropDownSideButton(title, icon, name string, values any) inputSideButton {
	return inputSideButton{
		Title: title,
		Icon:  icon,
		Type:  "dropdown",
		Name:  name,
		V:     values,
	}
}
