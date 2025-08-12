package variables

type (
	parameterType string

	Rule string

	rules []Rule

	base struct {
		Type           parameterType `json:"type"`
		Name           string        `json:"name"`
		Advanced       bool          `json:"advanced"`
		UpdateOnChange []string      `json:"update_on_change,omitempty"`
		Rules          rules         `json:"rules,omitempty"`
		W              []*Watch      `json:"watch,omitempty"`
	}
)

func (b *base) GetType() parameterType {
	return b.Type
}

func (b *base) GetName() string {
	return b.Name
}
