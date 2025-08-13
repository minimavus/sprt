package specs

import "fmt"

type FieldError struct {
	err  error
	path string
	left string
}

func (e *FieldError) Error() string {
	return fmt.Sprintf("%s: %s, left: %s", e.err, e.path, e.left)
}

func (e *FieldError) Unwrap() error {
	return e.err
}

func newFieldError(err error, path, left string) *FieldError {
	return &FieldError{err, path, left}
}
