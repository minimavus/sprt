package handlers

import (
	"database/sql"
	"errors"
	"net/http"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"github.com/volatiletech/null/v8"

	"github.com/cisco-open/sprt/frontend-svc/internal/auth"

	"github.com/cisco-open/sprt/go-generator/sdk/db"
	"github.com/cisco-open/sprt/go-generator/sdk/db/models"
	"github.com/cisco-open/sprt/go-generator/sdk/json"
)

// GetServersSettings returns all servers settings of the user
// @Summary Get servers settings
// @Description Get servers settings
// @Tags settings
// @Accept json
// @Produce json
// @Param should_group query bool false "Should group by group"
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /settings/servers [get]
func (m *controller) GetServersSettings(c echo.Context) error {
	u, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	req := new(struct {
		Group bool `query:"should_group" validate:"omitempty"`
	})
	if err = m.bindAndValidate(c, req); err != nil {
		return err
	}

	svs, err := db.Exec(m.App).GetServersSettingsOfUser(ctx, u.ForUser)
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	if !req.Group {
		return c.JSON(http.StatusOK, map[string]any{
			"servers": svs,
		})
	}

	svsMap := make(map[string][]db.ServerWithAttributes)
	for _, v := range svs {
		g := v.Group.String
		svsMap[g] = append(svsMap[g], v)
	}

	return c.JSON(http.StatusOK, map[string]any{
		"servers": svsMap,
	})
}

// GetServerSettings returns a server settings of the user
// @Summary Get server settings
// @Description Get server settings
// @Tags settings
// @Accept json
// @Produce json
// @Param id path string true "Server ID"
// @Success 200 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /settings/servers/{id} [get]
func (m *controller) GetServerSettings(c echo.Context) error {
	u, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	req := new(struct {
		ID string `param:"id" validate:"required,uuid"`
	})
	if err = m.bindAndValidate(c, req); err != nil {
		return err
	}

	svr, err := db.Exec(m.App).GetServerSettingsOfUser(ctx, u.ForUser, req.ID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return echo.ErrNotFound
		}
		return echo.ErrInternalServerError.WithInternal(err)
	}

	return c.JSON(http.StatusOK, svr)
}

// DeleteServerSettings deletes a server settings of the user
// @Summary Delete server settings
// @Description Delete server settings
// @Tags settings
// @Accept json
// @Produce json
// @Param id path string true "Server ID"
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /settings/servers/{id} [delete]
func (m *controller) DeleteServerSettings(c echo.Context) error {
	u, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	req := new(struct {
		ID string `param:"id" validate:"required,uuid"`
	})
	if err = m.bindAndValidate(c, req); err != nil {
		return err
	}

	d, err := db.Exec(m.App).DeleteServerSettingsOfUser(ctx, u.ForUser, req.ID)
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	return c.JSON(http.StatusOK, map[string]any{
		"deleted": d,
	})
}

type ServerRequestBody struct {
	// ID         string              `json:"id" validate:"omitempty"`
	// Owner      string              `json:"owner" validate:"omitempty"`
	Address    string              `json:"address" validate:"required"`
	AuthPort   *int                `json:"auth_port,omitempty" validate:"omitempty,number,lte=65535,gt=0"`
	AcctPort   *int                `json:"acct_port,omitempty" validate:"omitempty,number,lte=65535,gt=0"`
	Coa        *bool               `json:"coa,omitempty" validate:"omitempty"`
	Attributes db.ServerAttributes `json:"attributes,omitempty" validate:"omitempty"`
	Group      *string             `json:"group,omitempty" validate:"omitempty"`
}

func (b ServerRequestBody) MapTo(s *models.Server) error {
	s.Address = b.Address
	s.AuthPort = null.IntFromPtr(b.AuthPort)
	s.AcctPort = null.IntFromPtr(b.AcctPort)
	s.Coa = null.BoolFromPtr(b.Coa)
	bt, err := json.Marshal(b.Attributes)
	if err != nil {
		return err
	}
	s.Attributes = null.JSONFrom(bt)
	s.Group = null.StringFromPtr(b.Group)
	return nil
}

// UpdateServerSettings updates a server settings of the user
// @Summary Update server settings
// @Description Update server settings
// @Tags settings
// @Accept json
// @Produce json
// @Param id path string true "Server ID"
// @Param server body ServerRequestBody true "Server"
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /settings/servers/{id} [put]
func (m *controller) UpdateServerSettings(c echo.Context) error {
	u, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	req := new(struct {
		ID   string            `param:"id" validate:"required,uuid"`
		Body ServerRequestBody `json:"server" validate:"required"`
	})
	if err = m.bindAndValidate(c, req); err != nil {
		return err
	}

	var s models.Server
	s.Owner = u.ForUser
	s.ID = req.ID
	if err = req.Body.MapTo(&s); err != nil {
		return echo.ErrBadRequest.WithInternal(err)
	}

	_, err = db.Exec(m.App).UpdateServerSettingsOfUser(ctx, s)
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	return c.JSON(http.StatusOK, map[string]any{"id": s.ID})
}

// CreateServerSettings creates a server settings of the user
// @Summary Create server settings
// @Description Create server settings
// @Tags settings
// @Accept json
// @Produce json
// @Param server body ServerRequestBody true "Server"
// @Success 201 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /settings/servers [post]
func (m *controller) CreateServerSettings(c echo.Context) error {
	u, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	req := new(struct {
		Body ServerRequestBody `json:"server" validate:"required"`
	})
	if err = m.bindAndValidate(c, req); err != nil {
		return err
	}

	var s models.Server
	s.Owner = u.ForUser
	newID, err := uuid.NewV7()
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}
	s.ID = newID.String()
	if err = req.Body.MapTo(&s); err != nil {
		return echo.ErrBadRequest.WithInternal(err)
	}

	if err = db.Exec(m.App).CreateServerSettingsOfUser(ctx, s); err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	return c.JSON(http.StatusCreated, map[string]any{"id": s.ID})
}
