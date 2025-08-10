package variables

type (
	InputSideButton struct {
		Title string `json:"title"`
		Icon  string `json:"icon"`
		Type  string `json:"type"`
		Name  string `json:"name,omitempty"`
		V     any    `json:"values,omitempty"`
	}
)

func NewDropDownSideButton(title, icon, name string, values any) InputSideButton {
	return InputSideButton{
		Title: title,
		Icon:  icon,
		Type:  "dropdown",
		Name:  name,
		V:     values,
	}
}
