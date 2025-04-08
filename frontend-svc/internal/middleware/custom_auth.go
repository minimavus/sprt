package middleware

import (
	"errors"
	"net/http"
	"slices"

	"github.com/cisco-open/sprt/frontend-svc/internal/auth"
	"github.com/labstack/echo/v4"
	em "github.com/labstack/echo/v4/middleware"
)

var ()

type CustomAuthConfig struct {
	Skipper em.Skipper
}

func CustomAuth(cfg CustomAuthConfig) echo.MiddlewareFunc {
	return repo.customAuth(cfg)
}

func (m *repository) customAuth(config CustomAuthConfig) echo.MiddlewareFunc {
	m.authPaths = []string{"/login"}

	if config.Skipper == nil {
		config.Skipper = m.DefaultAuthSkipper
	}

	provider := authProviders.Get(m.App.Specs.Auth.Provider)

	err := provider.Init(&config)
	if err != nil {
		return func(echo.HandlerFunc) echo.HandlerFunc {
			return func(echo.Context) error {
				return echo.NewHTTPError(http.StatusInternalServerError, "Failed to initialize auth provider").WithInternal(err)
			}
		}
	}

	if cb := provider.CallbackPath(); cb != "" {
		m.authPaths = append(m.authPaths, cb)
	}

	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			if config.Skipper(c) {
				return next(c)
			}

			authenticatedContext, err := provider.Validate(c)
			if err != nil {
				if errors.Is(err, auth.ErrNoSession) {
					if !ServeJSON(c) {
						return c.Redirect(http.StatusTemporaryRedirect, "/login")
					}

					return echo.ErrUnauthorized
				}

				if _, ok := err.(*echo.HTTPError); ok {
					return err
				}

				return echo.NewHTTPError(http.StatusUnauthorized).SetInternal(err)
			}

			if authenticatedContext != nil {
				// TODO: ensure user in DB
				return next(authenticatedContext)
			}

			return echo.ErrUnauthorized
		}
	}
}

func CurrentAuthProvider() AuthProvider {
	return repo.currentAuthProvider()
}

func (m *repository) currentAuthProvider() AuthProvider {
	return authProviders.Get(m.App.Specs.Auth.Provider)
}

func (m *repository) DefaultAuthSkipper(c echo.Context) bool {
	if _, ok := c.(*auth.AuthContext); ok {
		return true
	}
	return m.IsAuthPathSpecific(c)
}

func (m *repository) IsAuthPathSpecific(c echo.Context, specific ...string) bool {
	if len(specific) > 0 {
		newPaths := make([]string, len(m.authPaths)+len(specific))
		copy(newPaths, m.authPaths)
		copy(newPaths[len(m.authPaths):], specific)
		return slices.Contains(newPaths, c.Path())
	}
	return slices.Contains(m.authPaths, c.Path())
}
