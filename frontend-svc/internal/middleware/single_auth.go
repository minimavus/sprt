package middleware

import (
	"crypto/subtle"
	"encoding/base64"
	"errors"
	"fmt"
	"net/http"
	"strings"

	"github.com/gorilla/sessions"
	"github.com/labstack/echo-contrib/session"
	"github.com/labstack/echo/v4"

	"github.com/cisco-open/sprt/frontend-svc/internal/auth"
	"github.com/cisco-open/sprt/frontend-svc/internal/config"
	"github.com/cisco-open/sprt/frontend-svc/internal/utils"
)

const singleAuthProvider = "single"

type SingleProvider struct {
	app *config.AppConfig
}

func NewSingleProvider(app *config.AppConfig) *SingleProvider {
	return &SingleProvider{
		app: app,
	}
}

func (s *SingleProvider) Init(*CustomAuthConfig) error {
	return nil
}

func (s *SingleProvider) Validate(c echo.Context) (*auth.AuthContext, error) {
	cc, err := s.tryBasicAuth(c)
	if err != nil {
		return nil, err
	}
	if cc != nil {
		return cc, nil
	}

	return s.getSingleAuthSession(c)
}

func (s *SingleProvider) Logout(c echo.Context) error {
	userSession, err := session.Get(s.app.Specs.Session.CookieName, c)
	if err != nil {
		return err
	}

	userSession.Options.MaxAge = -1
	return userSession.Save(c.Request(), c.Response())
}

func (s *SingleProvider) Login(c echo.Context) error {
	if c.Request().Method != http.MethodPost {
		return echo.ErrBadRequest
	}

	req := new(struct {
		Password string `json:"password" validate:"required,min=1"`
	})

	if err := c.Bind(req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error()).SetInternal(err)
	}
	if err := c.Validate(req); err != nil {
		return err
	}

	if subtle.ConstantTimeCompare([]byte(req.Password), []byte(s.app.Specs.Auth.SingleConfig.Password)) != 1 {
		return echo.ErrForbidden
	}

	userSession, err := session.Get(s.app.Specs.Session.CookieName, c)
	if err != nil {
		return err
	}

	userSession.Values["user_data"] = utils.PtrOf(s.composeUserData(true))

	if err := userSession.Save(c.Request(), c.Response()); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, fmt.Errorf("failed to update session: %w", err).Error())
	}

	return c.Redirect(http.StatusTemporaryRedirect, "/")
}

func (s *SingleProvider) Callback(echo.Context) (auth.UserData, error) {
	return auth.UserData{}, errors.New("callback not supported")
}

func (s *SingleProvider) CallbackPath() string {
	return ""
}

func (s *SingleProvider) tryBasicAuth(c echo.Context) (*auth.AuthContext, error) {
	authHeader := c.Request().Header.Get(echo.HeaderAuthorization)
	if len(authHeader) > 6 && strings.ToLower(authHeader[:5]) == "basic" {
		basicAuth := authHeader[6:]
		shouldMatch := []byte(s.app.Specs.Auth.SingleConfig.UID + ":" + s.app.Specs.Auth.SingleConfig.Password)
		encoded := make([]byte, base64.StdEncoding.EncodedLen(len(shouldMatch)))
		base64.StdEncoding.Encode(encoded, shouldMatch)
		if subtle.ConstantTimeCompare([]byte(basicAuth), encoded) != 1 {
			return nil, echo.ErrUnauthorized
		}

		value := s.composeUserData(true)
		return &auth.AuthContext{Context: c, Data: auth.AuthData{
			AuthType:   auth.AuthTypeUser,
			RawData:    &value,
			Normalized: auth.NormalizedAuthData{User: value.Email},
		}}, nil
	}

	return nil, nil
}

func (s *SingleProvider) getSingleAuthSession(c echo.Context) (*auth.AuthContext, error) {
	userSession, err := session.Get(s.app.Specs.Session.CookieName, c)
	if err != nil {
		return nil, err
	}

	value, ok := userSession.Values["user_data"].(auth.UserData)
	if userSession.IsNew || !ok || value.Email == "" {
		value = s.composeUserData(true)
		userSession.Values["user_data"] = &value
		userSession.Save(c.Request(), c.Response())

		return &auth.AuthContext{Context: c, Data: auth.AuthData{
			AuthType:   auth.AuthTypeUser,
			RawData:    &value,
			Normalized: auth.NormalizedAuthData{User: value.Email},
		}}, nil
	}

	return &auth.AuthContext{Context: c, Data: auth.AuthData{
		AuthType:   auth.AuthTypeUser,
		RawData:    &value,
		Normalized: auth.NormalizedAuthData{User: value.Email},
	}}, nil
}

func (s *SingleProvider) Session(userSession *sessions.Session, r *http.Request, w http.ResponseWriter) (auth.UserData, error) {
	value, ok := userSession.Values["user_data"].(auth.UserData)
	if userSession.IsNew || !ok || value.Email == "" {
		value = s.composeUserData(true)
		if w != nil {
			userSession.Values["user_data"] = &value
			userSession.Save(r, w)
		}
	}

	return value, nil
}

func (s *SingleProvider) ProviderPrefix() string {
	return singleAuthProvider
}

func (s *SingleProvider) composeUserData(isAdmin bool) auth.UserData {
	u := auth.UserData{
		AccessLevel: 4,
		Email:       s.app.Specs.Auth.SingleConfig.UID,
		Name:        s.app.Specs.Auth.SingleConfig.GivenName,
		FirstName:   s.app.Specs.Auth.SingleConfig.GivenName,
		LastName:    "",
		UserID:      s.app.Specs.Auth.SingleConfig.UID,
	}

	if isAdmin {
		u.Roles = append(u.Roles, auth.AdminRole)
	}

	return u
}
