package auth

import (
	"context"
	"errors"

	"github.com/labstack/echo/v4"
)

type contextKey string

var (
	ErrUnknownContextType      = errors.New("unknown context type")
	ErrIncorrectValueInContext = errors.New("incorrect value in context")
	ErrNoValueInContext        = errors.New("no value in context")
)

const QueryUserKey = "query_user"

func getQueryUser(c echo.Context) string {
	return c.Get(QueryUserKey).(string)
}

func ensureKey[K string | contextKey](origKey K) contextKey {
	var key contextKey

	switch origKey := any(origKey).(type) {
	case string:
		key = contextKey(origKey)
	case contextKey:
		key = origKey
	}

	return key
}

func ContextWithCustomValue[K string | contextKey](c any, origKey K, value any) context.Context {
	key := ensureKey(origKey)

	switch c := c.(type) {
	case echo.Context:
		return context.WithValue(c.Request().Context(), key, value)
	case context.Context:
		return context.WithValue(c, key, value)
	default:
		panic(ErrUnknownContextType)
	}
}

func GetFromContext[K string | contextKey, T any](c context.Context, origKey K, _ T) (T, error) {
	key := ensureKey(origKey)
	var null T

	if v := c.Value(key); v != nil {
		if v, ok := v.(T); ok {
			return v, nil
		}
		return null, ErrIncorrectValueInContext
	}

	return null, ErrNoValueInContext
}

const ctxUserIdKey contextKey = contextKey("user_id")

func ContextWithUser(c any, user string) context.Context {
	return ContextWithCustomValue(c, ctxUserIdKey, user)
}

func GetUserFromContext(ctx context.Context, preferred string) (string, error) {
	if preferred != "" {
		return preferred, nil
	}
	return GetFromContext(ctx, ctxUserIdKey, string(""))
}
