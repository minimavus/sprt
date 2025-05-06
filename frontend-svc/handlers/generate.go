package handlers

import (
	"net/http"

	"github.com/labstack/echo/v4"

	"github.com/cisco-open/sprt/frontend-svc/internal/auth"
	"github.com/cisco-open/sprt/frontend-svc/internal/policy"
	"github.com/cisco-open/sprt/frontend-svc/internal/user"
	"github.com/cisco-open/sprt/frontend-svc/internal/variables"
)

func (m *controller) GetProtoSpecificParams(c echo.Context) error {
	req := new(struct {
		Proto string `param:"proto" validate:"required"`
	})
	if err := m.bindAndValidate(c, req); err != nil {
		return err
	}

	definition, err := variables.GetProtoDefinition(req.Proto)
	if err != nil {
		return c.JSON(http.StatusOK, map[string]any{})
	}

	return c.JSON(http.StatusOK, definition)
}

func (m *controller) GetVariableDefinition(c echo.Context) error {
	req := new(struct {
		Variable string `param:"variable" validate:"required"`
	})
	if err := m.bindAndValidate(c, req); err != nil {
		return err
	}

	definition, err := variables.GetVariableDefinition(req.Variable)
	if err != nil {
		return echo.ErrNotFound.WithInternal(err)
	}

	return c.JSON(http.StatusOK, definition)
}

func (m *controller) GetAvailableIPSources(c echo.Context) error {
	req := new(struct {
		IncludeAll bool `query:"include_all"`
	})
	if err := m.bindAndValidate(c, req); err != nil {
		return err
	}

	u, _, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}
	if !policy.UserCan(u, "ipsources.read.all") {
		return echo.ErrForbidden
	}

	sources, err := m.App.Generator().GetAvailableIPSources(req.IncludeAll)
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	return c.JSON(http.StatusOK, sources)
}

func (m *controller) GetRadiusDictionaries(c echo.Context) error {
	dictionaries, err := m.App.Generator().ListDictionaries()
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	return c.JSON(http.StatusOK, dictionaries)
}

func (m *controller) GetRadiusDictionary(c echo.Context) error {
	u, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	req := new(struct {
		Name string `param:"name" validate:"required"`
	})
	if err = m.bindAndValidate(c, req); err != nil {
		return err
	}

	if u.ForUser != u.UserID && !policy.UserCan(u, "dictionaries.read.others") {
		return echo.ErrForbidden
	}

	m.App.Logger().Debug().
		Str("uid", u.ForUser).Str("name", req.Name).Msg("Get dictionary")

	dict, friendly, err := m.App.Generator().GetDictionary(ctx, req.Name, u.ForUser)
	if err != nil {
		m.App.Logger().Error().
			Err(err).Str("name", req.Name).Str("uid", u.ForUser).
			Msg("Failed to get dictionary")
		return echo.ErrInternalServerError.WithInternal(err)
	}

	response := map[string]any{
		"name": req.Name,
		"data": dict,
	}
	if friendly != "" {
		response["friendly_name"] = friendly
	}

	return c.JSON(http.StatusOK, response)
}

func (m *controller) GetProtoDefaults(c echo.Context) error {
	u, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	req := new(struct {
		Proto string `param:"proto" validate:"required"`
	})
	if err = m.bindAndValidate(c, req); err != nil {
		return err
	}

	res, err := user.GetUserProtoDefaults(ctx, m.App, *u, req.Proto)
	if err != nil {
		m.App.Logger().Error().
			Err(err).Str("proto", req.Proto).Str("uid", u.ForUser).
			Msg("Failed to get proto defaults")
		return echo.ErrInternalServerError.WithInternal(err)
	}

	return c.JSON(http.StatusOK, res)
}

func (m *controller) GetSupportedTLSCipherSuites(c echo.Context) error {
	req := new(struct {
		Version string `query:"version" validate:"omitempty,oneof=TLSv1 TLSv1_1 TLSv1_2 TLSv1_3"`
	})
	if err := m.bindAndValidate(c, req); err != nil {
		return err

	}

	ciphers, err := m.App.Generator().GetTLSCipherSuites(req.Version)
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	return c.JSON(http.StatusOK, ciphers)
}
