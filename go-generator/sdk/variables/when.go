package variables

type (
	when struct {
		Value any   `json:"value"`
		Acts  []act `json:"acts"`
		N     bool  `json:"not"`
	}

	whens []when
)

func (W *whens) When(value any, acts ...act) *whens {
	*W = append(*W, when{Value: value, Acts: acts})
	return W
}

func (W *whens) WhenNot(value any, acts ...act) *whens {
	*W = append(*W, when{Value: value, Acts: acts, N: true})
	return W
}
