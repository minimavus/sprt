package handlers

import (
	"net/http"

	"github.com/labstack/echo/v4"

	"github.com/cisco-open/sprt/frontend-svc/internal/auth"
	"github.com/cisco-open/sprt/go-generator/sdk/registry"
)

func (m *controller) GetLoadedPlugins(c echo.Context) error {
	u, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	m.App.Logger().Debug().Str("user", u.UserID).Ctx(ctx).Msg("GetLoadedPlugins called")

	plugs := registry.Registered()

	var plugins []map[string]any
	for _, p := range plugs {
		plugins = append(plugins, map[string]any{
			"name":     p.Name(),
			"schema":   p.JSONSchema(),
			"provides": p.Provides(),
		})
	}

	return c.JSON(http.StatusOK, map[string]any{
		"plugins": plugins,
		"total":   len(plugs),
	})
}

func (m *controller) UpdatePlugin(c echo.Context) error {
	u, _, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	m.App.Logger().Debug().Str("user", u.UserID).Msg("UpdatePlugin called")

	req := new(struct {
		Name string `param:"name" validate:"required"`
	})
	if err := m.bindAndValidate(c, req); err != nil {
		m.App.Logger().Error().Str("user", u.UserID).Err(err).Msg("Failed to bind and validate request")
		return echo.ErrBadRequest.WithInternal(err)
	}

	// TODO: implement the logic to update the plugin based on the provided name.
	// This is a placeholder.

	return c.NoContent(http.StatusOK)
}
