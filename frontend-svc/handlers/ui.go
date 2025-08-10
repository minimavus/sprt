package handlers

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/volatiletech/sqlboiler/v4/boil"

	"github.com/cisco-open/sprt/frontend-svc/internal/auth"
	"github.com/cisco-open/sprt/frontend-svc/internal/policy"
	"github.com/cisco-open/sprt/frontend-svc/models"
	"github.com/cisco-open/sprt/go-generator/sdk/json"
)

func (m *controller) getMySession(c echo.Context) error {
	session, _, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, session)
}

func (m *controller) getMyAttributes(c echo.Context) error {
	session, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	u, err := models.FindUser(ctx, m.App.DB(), session.UserID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "Couldn't find user").SetInternal(err)
	}

	return c.JSON(http.StatusOK, u.Attributes)
}

func (m *controller) putMyAttributes(c echo.Context) error {
	session, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	jsonMap := make(map[string]interface{})
	if err = json.NewDecoder(c.Request().Body).Decode(&jsonMap); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error()).WithInternal(err)
	}

	u, err := models.FindUser(ctx, m.App.DB(), session.UserID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "Couldn't find user").SetInternal(err)
	}

	err = u.Attributes.Marshal(jsonMap)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError).SetInternal(err)
	}

	_, err = u.Update(ctx, m.App.DB(), boil.Whitelist(models.UserColumns.Attributes))
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "Couldn't store attributes").SetInternal(err)
	}

	return c.NoContent(http.StatusNoContent)
}

func (m *controller) getMyPermission(c echo.Context) error {
	u, _, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	req := new(struct {
		Permission string `query:"permission" validate:"required"`
	})
	if err = m.bindAndValidate(c, req); err != nil {
		return err
	}

	return c.JSON(http.StatusOK, map[string]any{"allowed": policy.UserCan(u, req.Permission)})
}
