package middleware

import (
	"context"
	"fmt"
	"net/http"
	"net/url"
	"slices"

	"github.com/gorilla/sessions"
	"github.com/labstack/echo-contrib/session"
	"github.com/labstack/echo/v4"
	"github.com/markbates/goth"
	"github.com/markbates/goth/gothic"
	"github.com/markbates/goth/providers/openidConnect"
	"github.com/rs/zerolog/log"
	"github.com/samber/lo"

	"github.com/cisco-open/sprt/frontend-svc/internal/auth"
	"github.com/cisco-open/sprt/frontend-svc/internal/config"
)

const (
	duoAuthProvider = "duo"
	duoPrefix       = "cisco"
	discoveryURL    = "https://sso-dbbfec7f.sso.duosecurity.com/oidc/%s/.well-known/openid-configuration"
)

type DuoProvider struct {
	app  *config.AppConfig
	path string
}

func NewDuoProvider(app *config.AppConfig) *DuoProvider {
	u, err := url.Parse(app.Specs.Auth.DuoConfig.Redirect)
	if err != nil {
		panic(err)
	}

	return &DuoProvider{
		app:  app,
		path: u.Path,
	}
}

func (d *DuoProvider) Init(*CustomAuthConfig) error {
	gothic.Store = d.app.SessionStore
	gothic.GetProviderName = func(req *http.Request) (string, error) {
		return "openid-connect", nil
	}

	u, err := url.Parse(d.app.Specs.Auth.DuoConfig.Redirect)
	if err != nil {
		panic(err)
	}

	discovery := fmt.Sprintf(discoveryURL, d.app.Specs.Auth.DuoConfig.Client)
	d.app.Logger().Debug().Str("discovery_url", discovery).Msg("DUO config")

	openidConnect, err := openidConnect.New(
		d.app.Specs.Auth.DuoConfig.Client,
		d.app.Specs.Auth.DuoConfig.Secret,
		u.String(),
		discovery,
		"profile", "email", "openid",
	)
	if err != nil {
		return err
	}

	// Dirty workaround!
	d.app.Logger().Info().Interface("open_id_config", openidConnect.OpenIDConfig).Msg("Discovered OpenID config")

	goth.UseProviders(openidConnect)

	return nil
}

func (d *DuoProvider) Validate(c echo.Context) (*auth.AuthContext, error) {
	return d.getDuoAuthSession(c)
}

func (d *DuoProvider) Logout(c echo.Context) error {
	return d.duoLogout(c.Response(), c.Request())
}

func (d *DuoProvider) Login(c echo.Context) error {
	gothic.BeginAuthHandler(c.Response(), c.Request())
	return nil
}

func (d *DuoProvider) Callback(c echo.Context) (auth.UserData, error) {
	u, err := gothic.CompleteUserAuth(c.Response(), c.Request())
	if err != nil {
		return auth.UserData{}, err
	}

	log.Debug().Interface("user", u).Msg("User data")

	data := auth.UserData{
		AccessLevel: 4,
		Email:       u.Email,
		Name:        u.Name,
		FirstName:   u.FirstName,
		LastName:    u.LastName,
		UserID:      getUID(u),
	}

	if len(d.app.Specs.Auth.DuoConfig.Supers.Emails) > 0 && !data.IsAdmin() {
		if slices.Contains(d.app.Specs.Auth.DuoConfig.Supers.Emails, u.Email) {
			data.Roles = append(data.Roles, auth.AdminRole)
		}
	}
	if len(d.app.Specs.Auth.DuoConfig.Supers.Groups) > 0 && !data.IsAdmin() {
		if m, ok := u.RawData["memberof"]; ok {
			var ms []string
			switch m := m.(type) {
			case []string:
				ms = m
			case []*string:
				ms = lo.Map(m, func(v *string, _ int) string { return *v })
			case *[]string:
				ms = *m
			case [][]byte:
				ms = lo.Map(m, func(v []byte, _ int) string { return string(v) })
			case []*[]byte:
				ms = lo.Map(m, func(v *[]byte, _ int) string { return string(*v) })
			}
			includes := len(lo.Intersect(ms, d.app.Specs.Auth.DuoConfig.Supers.Groups)) > 0
			if includes {
				data.Roles = append(data.Roles, auth.AdminRole)
			}
		}
	}

	return data, nil
}

func (d *DuoProvider) CallbackPath() string {
	return d.path
}

func (d *DuoProvider) getDuoAuthSession(c echo.Context) (*auth.AuthContext, error) {
	userSession, err := session.Get(d.app.Specs.Session.CookieName, c)
	if err != nil {
		return nil, err
	}

	value, err := d.Session(userSession, c.Request(), c.Response())
	if err != nil {
		return nil, err
	}

	return &auth.AuthContext{Context: c, Data: auth.AuthData{
		AuthType:   auth.AuthTypeUser,
		RawData:    &value,
		Normalized: auth.NormalizedAuthData{User: value.Email},
	}}, nil
}

func (d *DuoProvider) Session(userSession *sessions.Session, r *http.Request, w http.ResponseWriter) (auth.UserData, error) {
	if userSession.IsNew {
		if w != nil {
			userSession.Options.MaxAge = -1
			userSession.Save(r, w)
		}
		return auth.UserData{}, auth.ErrNoSession
	}

	value, ok := userSession.Values["user_data"].(auth.UserData)
	if !ok || value.Email == "" {
		if w != nil {
			userSession.Options.MaxAge = -1
			userSession.Save(r, w)
		}
		return auth.UserData{}, auth.ErrNoSession
	}

	value.AccessLevel = 4

	// if user AccessLevel is less than minimum required
	if err := d.verifyMinAccessLevel(r.Context(), &value); err != nil {
		return auth.UserData{}, err
	}

	return value, nil
}

func (d *DuoProvider) ProviderPrefix() string {
	return duoPrefix
}

func (d *DuoProvider) verifyMinAccessLevel(_ context.Context, v *auth.UserData) error {
	if v.AccessLevel < d.app.Specs.Auth.DuoConfig.MinLevel {
		return auth.ErrCiscoAuthRequired
	}

	return nil
}

func (d *DuoProvider) duoLogout(res http.ResponseWriter, req *http.Request) error {
	return gothic.Logout(res, req)
}

func getUID(u goth.User) string {
	if s, ok := u.RawData["uid"].(string); ok {
		return s
	}
	if s, ok := u.RawData["user"].(string); ok {
		return s
	}
	return u.Email
}
