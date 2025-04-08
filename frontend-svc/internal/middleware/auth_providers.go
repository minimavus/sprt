package middleware

import (
	"errors"
	"net/http"

	"github.com/gorilla/sessions"
	"github.com/labstack/echo/v4"

	"github.com/cisco-open/sprt/frontend-svc/internal/auth"
)

type (
	AuthProvider interface {
		Init(*CustomAuthConfig) error
		Validate(echo.Context) (*auth.AuthContext, error)
		Login(echo.Context) error
		Callback(echo.Context) (auth.UserData, error)
		CallbackPath() string
		Logout(echo.Context) error
		Session(userSession *sessions.Session, r *http.Request, w http.ResponseWriter) (auth.UserData, error)
		ProviderPrefix() string
	}

	authProvidersMap map[string]AuthProvider
)

var (
	ErrNoProvider = errors.New("Auth provider not present")

	authProviders *authProvidersMap
)

func (a *authProvidersMap) Get(provider string) AuthProvider {
	if a == nil {
		panic(ErrNoProvider)
	}

	p, ok := (*a)[provider]
	if !ok {
		panic(ErrNoProvider)
	}

	return p
}
