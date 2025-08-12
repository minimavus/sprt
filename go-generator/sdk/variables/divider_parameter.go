package variables

import (
	"github.com/google/uuid"
)

type (
	dividerParameter struct {
		infoParameter
	}

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

	return &dividerParameter{
		infoParameter: infoParameter{
			base: base{
				Type: paramDivider,
				Name: "divider-" + u.String(),
			},
			SubType: "divider",
		},
	}
}

func (b *dividerParameter) WithLabel(label string) Divider {
	b.Value = label
	return b
}
