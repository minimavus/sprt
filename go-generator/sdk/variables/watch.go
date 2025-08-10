package variables

type (
	Watch struct {
		Field string `json:"field"`
		W     whens  `json:"when"`
	}
)

func NewWatch(field string) *Watch {
	return &Watch{Field: field, W: make(whens, 0)}
}

func (w *Watch) When(value any, acts ...act) *Watch {
	w.W.When(value, acts...)
	return w
}

func (w *Watch) WhenNot(value any, acts ...act) *Watch {
	w.W.WhenNot(value, acts...)
	return w
}
