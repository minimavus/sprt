package handlers

import (
	"fmt"
	"net/http"
	"slices"
	"time"

	"github.com/labstack/echo-contrib/session"
	"github.com/labstack/echo/v4"

	"github.com/cisco-open/sprt/frontend-svc/internal/auth"
	"github.com/cisco-open/sprt/frontend-svc/internal/middleware"
	"github.com/cisco-open/sprt/frontend-svc/shared"
)

// toString casts to string or returns empty one. Used for lo.Map
func toString(el any, _ int) string {
	v, ok := el.(string)
	if !ok {
		return ""
	}
	return v
}

// isAdmin verifies if user is admin based on user's roles
func (m controller) isAdmin(roles []string) bool {
	m.App.Logger().Debug().Strs("roles", roles).Msg("Groups of user, processing")

	return slices.Contains(roles, auth.AdminRole)
}

func Login(c echo.Context) error {
	return rest.login(c)
}

// Login handles /login route
func (m controller) login(c echo.Context) error {
	return middleware.CurrentAuthProvider().Login(c)
}

func LoginCallback(c echo.Context) error {
	return rest.loginCallback(c)
}

// Callback handles /api/login which is callback for Cisco SSO
func (m controller) loginCallback(c echo.Context) error {
	user, err := middleware.CurrentAuthProvider().Callback(c)
	if err != nil {
		m.App.Logger().Error().Stack().Err(err).Send()
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	session, err := session.Get(m.App.Specs.Session.CookieName, c)
	if err != nil {
		return auth.ErrNoSession
	}

	session.Values["user_data"] = &user

	if err := session.Save(c.Request(), c.Response()); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, fmt.Errorf("Failed to update session: %w", err).Error())
	}

	return c.Redirect(http.StatusTemporaryRedirect, "/")
}

func Logout(c echo.Context) error {
	return rest.logout(c)
}

// Logout handles /logout - logs out user, destroys session
func (m controller) logout(c echo.Context) error {
	if err := middleware.CurrentAuthProvider().Logout(c); err != nil {
		m.App.Logger().Error().Stack().Err(err).Msg("Failed to logout user")
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	var t time.Time

	cookie := new(http.Cookie)
	cookie.Name = m.App.Specs.Session.CookieName
	cookie.Path = "/"
	cookie.MaxAge = -1
	cookie.Secure = !m.App.Specs.Session.InsecureCookies
	cookie.Expires = t.Add(time.Minute)

	c.SetCookie(cookie)

	err := c.Render(http.StatusOK, "logout", shared.RenderData{})

	if err != nil {
		m.App.Logger().Error().Err(err).Msg("Failed to render")
	}

	return err
}
