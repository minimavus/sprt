package variables

import "github.com/google/uuid"

type (
	Divider interface {
		Parameter
		WithLabel(label string) Divider
	}
)

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
