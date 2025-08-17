package handlers

import (
	"net/http"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"

	"github.com/cisco-open/sprt/frontend-svc/internal/auth"
	"github.com/cisco-open/sprt/go-generator/sdk/db"
)

// GetAPISettings returns all API settings of the user
// @Summary Get API settings
// @Description Get API settings
// @Tags settings
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /settings/api [get]
func (m *controller) GetAPISettings(c echo.Context) error {
	u, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	sts, err := db.Exec(m.App).GetAPISettingsOfUser(ctx, u.ForUser)
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	return c.JSON(http.StatusOK, map[string]any{
		"settings": sts,
	})
}

// GetAPISettingsToken returns the API token of the user
// @Summary Get API settings token
// @Description Get API settings token
// @Tags settings
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /settings/api/token [get]
func (m *controller) GetAPISettingsToken(c echo.Context) error {
	u, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	sts, err := db.Exec(m.App).GetAPISettingsOfUser(ctx, u.ForUser)
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	return c.JSON(http.StatusOK, map[string]any{
		"token": sts.Token,
	})
}

// EnableAPISettings enables the API settings of the user
// @Summary Enable API settings
// @Description Enable API settings
// @Tags settings
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /settings/api/enable [post]
func (m *controller) EnableAPISettings(c echo.Context) error {
	u, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	sts, err := db.Exec(m.App).GetAPISettingsOfUser(ctx, u.ForUser)
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}
	if sts.Token != "" {
		return c.JSON(http.StatusOK, map[string]any{"affected": 0})
	}

	newID, err := uuid.NewRandom()
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	rows, err := db.Exec(m.App).SetAPISettingsOfUser(ctx, u.ForUser, map[string]string{
		"token": newID.String(),
	})
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	return c.JSON(http.StatusOK, map[string]any{"affected": rows})
}

// DisableAPISettings disables the API settings of the user
// @Summary Disable API settings
// @Description Disable API settings
// @Tags settings
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /settings/api/disable [post]
func (m *controller) DisableAPISettings(c echo.Context) error {
	u, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	sts, err := db.Exec(m.App).GetAPISettingsOfUser(ctx, u.ForUser)
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}
	if sts.Token == "" {
		return c.JSON(http.StatusOK, map[string]any{"affected": 0})
	}

	rows, err := db.Exec(m.App).SetAPISettingsOfUser(ctx, u.ForUser, map[string]string{
		"token": "",
	})
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	return c.JSON(http.StatusOK, map[string]any{"affected": rows})
}

// RegenAPISettingsToken regenerates the API token of the user
// @Summary Regenerate API settings token
// @Description Regenerate API settings token
// @Tags settings
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /settings/api/token/regen [post]
func (m *controller) RegenAPISettingsToken(c echo.Context) error {
	u, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	newID, err := uuid.NewRandom()
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	rows, err := db.Exec(m.App).SetAPISettingsOfUser(ctx, u.ForUser, map[string]string{
		"token": newID.String(),
	})
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	return c.JSON(http.StatusOK, map[string]any{"affected": rows})
}
