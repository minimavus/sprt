package handlers

import (
	"net/http"

	"github.com/cisco-open/sprt/frontend-svc/internal/auth"
	"github.com/cisco-open/sprt/go-generator/sdk/db"
	"github.com/labstack/echo/v4"
)

func (m *controller) GetUserGenerateDefaults(c echo.Context) error {
	u, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	settings, err := db.Exec(m.App).GetUserDefaultSettings(ctx, u.ForUser)
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	return c.JSON(http.StatusOK, settings)
}

func (m *controller) UpdateUserGenerateDefaults(c echo.Context) error {
	u, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	var settings db.UserDefaultSettings
	if err = m.bindAndValidate(c, &settings); err != nil {
		return err
	}

	m.App.Logger().Debug().Interface("settings", settings).Str("requestor", u.UserID).Str("user", u.ForUser).
		Msg("Saving user default settings")

	affected, err := db.Exec(m.App).SetUserDefaultSettings(ctx, u.ForUser, settings)
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	return c.JSON(http.StatusOK, map[string]int64{"affected": affected})
}
