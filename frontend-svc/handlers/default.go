package handlers

import (
	"net/http"

	"github.com/labstack/echo/v4"

	"github.com/cisco-open/sprt/frontend-svc/internal/auth"
	"github.com/cisco-open/sprt/frontend-svc/shared"
)

func Default(c echo.Context) error {
	return rest.defaultRoute(c)
}

// Default is a default catch-all handler
func (m *controller) defaultRoute(c echo.Context) error {
	session, _, err := auth.GetUserDataAndContext(c)

	if err != nil {
		m.App.Logger().Warn().Err(err).Msg("Redirecting user to login")
		return c.Redirect(http.StatusTemporaryRedirect, "/login")
	}

	return c.Render(http.StatusOK, "index", shared.RenderData{
		Session: shared.SessionData{UserData: session.UserData},
	})
}
