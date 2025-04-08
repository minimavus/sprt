package middleware

import (
	"context"
	"strings"

	"github.com/cisco-open/sprt/frontend-svc/internal/auth"
	"github.com/cisco-open/sprt/frontend-svc/internal/db"
	"github.com/labstack/echo/v4"
)

var (
	ErrBadToken = echo.ErrUnauthorized
)

func ApiAuth() func(next echo.HandlerFunc) echo.HandlerFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return repo.apiAuth(next)
	}
}

// apiAuth checks requests and sets auth level and auth data on the context
func (m *repository) apiAuth(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		if cook, err := c.Cookie(m.App.Specs.Session.CookieName); err == nil && cook.Valid() == nil {
			// there's valid session cookie - just proceed
			return next(c)
		}

		authHeader := c.Request().Header.Get(echo.HeaderAuthorization)
		if len(authHeader) > 7 && strings.ToLower(authHeader[:6]) == "bearer" {
			token := authHeader[7:]
			tokenOwner, err := m.verifyBearerToken(c.Request().Context(), token)
			if err != nil {
				return err
			}

			authData := auth.AuthData{}
			authData.AuthType = auth.AuthTypeToken
			authData.Normalized = auth.NormalizedAuthData{User: tokenOwner}
			authData.RawData = &auth.UserData{UserID: tokenOwner, Email: tokenOwner}

			cc := &auth.AuthContext{Context: c, Data: authData}
			return next(cc)
		}

		return next(c)
	}
}

// GetAuthDataFromContext gets ApiAuth from Echo context
func GetAuthDataFromContext(c echo.Context) auth.AuthData {
	cc, ok := c.(*auth.AuthContext)
	if !ok {
		return auth.AuthData{}
	}
	return cc.GetAuthData()
}

// verifyBearerToken gets bearer token and tries to verify who owns it
func (m *repository) verifyBearerToken(ctx context.Context, token string) (string, error) {
	u, err := db.Exec(m.App).GetUserByAPIToken(ctx, token)
	if err != nil {
		return "", echo.ErrInternalServerError.WithInternal(err)
	}
	if u == "" {
		return "", ErrBadToken
	}

	return u, nil
}
