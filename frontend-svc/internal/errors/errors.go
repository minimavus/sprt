package errors

import (
	"fmt"
	"net/http"
)

type HTTPError struct {
	Code          int                    `json:"-"`
	CustomMembers map[string]interface{} `json:"-"` // Custom fields to be added to the response
	Internal      error                  `json:"-"` // Stores the error returned by an external dependency
	Message       string                 `json:"-"`
}

// NewHTTPError creates a new HTTPError instance.
func NewHTTPError(code int, message ...interface{}) *HTTPError {
	he := &HTTPError{Code: code, CustomMembers: map[string]interface{}{}, Message: http.StatusText(code)}
	if len(message) > 0 {
		he.Message = fmt.Sprint(message...)
	}
	return he
}

func (he *HTTPError) SetCustomMember(key string, value interface{}) *HTTPError {
	he.CustomMembers[key] = value
	return he
}

// Error makes it compatible with `error` interface.
func (he *HTTPError) Error() string {
	if he.Internal == nil {
		return fmt.Sprintf("code=%d, message=%v", he.Code, he.Message)
	}
	return fmt.Sprintf("code=%d, message=%v, internal=%v", he.Code, he.Message, he.Internal)
}

// SetInternal sets error to HTTPError.Internal
func (he *HTTPError) SetInternal(err error) *HTTPError {
	he.Internal = err
	return he
}

// Unwrap satisfies the Go 1.13 error wrapper interface.
func (he *HTTPError) Unwrap() error {
	return he.Internal
}

func (he *HTTPError) WithInternal(err error) *HTTPError {
	newError := *he
	newError.Internal = err
	return &newError
}
