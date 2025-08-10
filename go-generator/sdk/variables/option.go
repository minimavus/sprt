package variables

type (
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
)
