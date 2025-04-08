package handlers

import (
	"database/sql"
	"errors"
	"net/http"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"github.com/volatiletech/null/v8"
	"github.com/volatiletech/sqlboiler/v4/boil"

	"github.com/cisco-open/sprt/frontend-svc/internal/auth"
	"github.com/cisco-open/sprt/frontend-svc/internal/db"
	"github.com/cisco-open/sprt/frontend-svc/internal/dictionaries"
	"github.com/cisco-open/sprt/frontend-svc/internal/policy"
	"github.com/cisco-open/sprt/frontend-svc/models"
)

type (
	NameTitle struct {
		Name  string `json:"name"`
		Title string `json:"title"`
	}

	DictionaryMeta struct {
		Name  string `json:"name" validate:"required"`
		Owner string `json:"owner" validate:"required"`
		Type  string `json:"type" validate:"required"`
	}

	DictionaryMetaWithGlobal struct {
		DictionaryMeta
		IsGlobal bool `json:"is_global"`
	}
)

func (m *controller) GetDictionaryTypes(c echo.Context) error {
	return c.JSON(http.StatusOK, dictionaries.GetValidTypes())
}

func (m *controller) GetDictionariesOfType(c echo.Context) error {
	u, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	req := new(struct {
		Type          string `query:"type" validate:"required"`
		IncludeGlobal bool   `query:"include_global" validate:"omitempty"`
	})
	if err = m.bindAndValidate(c, req); err != nil {
		return err
	}

	if req.IncludeGlobal && !policy.UserCan(u, "dictionaries.read.global") {
		return echo.ErrForbidden
	}

	d, err := db.Exec(m.App).GetDictionariesOfType(ctx, u.ForUser, req.Type, req.IncludeGlobal)
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	type responseElement struct {
		ID string `json:"id"`
		DictionaryMetaWithGlobal
	}
	response := make([]responseElement, 0)

	for _, dd := range d {
		e := responseElement{}
		e.ID = dd.ID
		e.Name = dd.Name
		e.Owner = dd.Owner
		e.Type = dd.Type
		e.IsGlobal = dd.Owner == db.GlobalDictionariesOwner
		response = append(response, e)
	}

	return c.JSON(http.StatusOK, response)
}

func (m *controller) DeleteDictionariesOfType(c echo.Context) error {
	u, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	req := new(struct {
		Type          string `query:"type" validate:"required"`
		IncludeGlobal bool   `query:"include_global" validate:"omitempty"`
	})
	if err = m.bindAndValidate(c, req); err != nil {
		return err
	}

	if req.IncludeGlobal && !policy.UserCan(u, "dictionaries.delete.global") {
		return echo.ErrForbidden
	}

	d, err := db.Exec(m.App).DeleteDictionariesOfType(ctx, u.ForUser, req.Type, req.IncludeGlobal)

	return c.JSON(http.StatusOK, map[string]any{
		"deleted": d,
	})
}

func (m *controller) GetDictionaryById(c echo.Context) error {
	u, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	req := new(struct {
		ID     string `param:"id" validate:"required"`
		ByName bool   `query:"by_name"`
	})
	if err = m.bindAndValidate(c, req); err != nil {
		return err
	}

	if u.ForUser != u.UserID && !policy.UserCan(u, "dictionaries.read.others") {
		return echo.ErrForbidden
	}

	var d *models.Dictionary
	if req.ByName {
		d, err = db.Exec(m.App).GetDictionaryByName(ctx, req.ID, u.ForUser)
	} else {
		d, err = db.Exec(m.App).GetDictionaryByID(ctx, req.ID, u.ForUser)
	}
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}
	if d == nil {
		return echo.ErrNotFound
	}

	if d.Owner == db.GlobalDictionariesOwner && !policy.UserCan(u, "dictionaries.read.global") {
		return echo.ErrForbidden
	}

	res := struct {
		ID string `json:"id"`
		DictionaryMetaWithGlobal
		Content null.String `json:"content"`
	}{}

	res.ID = d.ID
	res.Name = d.Name
	res.Owner = d.Owner
	res.Type = d.Type
	res.IsGlobal = d.Owner == db.GlobalDictionariesOwner
	res.Content = d.Content

	return c.JSON(http.StatusOK, res)
}

func (m *controller) DeleteDictionaryById(c echo.Context) error {
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

	if u.ForUser == db.GlobalDictionariesOwner && !policy.UserCan(u, "dictionaries.delete.global") {
		return echo.ErrForbidden
	}
	if u.ForUser != u.UserID && !policy.UserCan(u, "dictionaries.delete.others") {
		return echo.ErrForbidden
	}

	deleted, err := db.Exec(m.App).DeleteDictionaryByID(ctx, req.ID, u.ForUser)
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}
	if !deleted {
		return echo.ErrNotFound
	}

	return c.NoContent(http.StatusNoContent)
}

func (m *controller) UpdateDictionary(c echo.Context) error {
	req := new(struct {
		ID string `param:"id" validate:"required,uuid"`
		DictionaryMeta
		Content string `json:"content" validate:"required"`
	})
	if err := m.bindAndValidate(c, req); err != nil {
		return err
	}

	u, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	if req.Owner == db.GlobalDictionariesOwner && !policy.UserCan(u, "dictionaries.update.global") {
		return echo.ErrForbidden
	}
	if req.Owner != u.UserID && !policy.UserCan(u, "dictionaries.update.others") {
		return echo.ErrForbidden
	}

	if err = dictionaries.IsValid(dictionaries.ValidationRequest{
		Type:    req.Type,
		Content: req.Content,
	}); err != nil {
		return echo.ErrBadRequest.WithInternal(err)
	}

	d, err := models.FindDictionary(ctx, m.App.DB(), req.ID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return echo.ErrNotFound
		}
		return echo.ErrInternalServerError.WithInternal(err)
	}

	d.Content.SetValid(req.Content)
	d.Name = req.Name
	d.Owner = req.Owner
	d.Type = req.Type

	_, err = d.Update(ctx, m.App.DB(), boil.Blacklist(models.DictionaryColumns.ID))
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	return c.JSON(http.StatusOK, map[string]string{
		"id": req.ID,
	})
}

func (m *controller) CreateDictionary(c echo.Context) error {
	req := new(struct {
		DictionaryMeta
		Content string `json:"content" validate:"required"`
	})
	if err := m.bindAndValidate(c, req); err != nil {
		return err
	}

	u, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	if req.Owner == db.GlobalDictionariesOwner && !policy.UserCan(u, "dictionaries.create.global") {
		return echo.ErrForbidden
	}
	if req.Owner != u.UserID && !policy.UserCan(u, "dictionaries.create.others") {
		return echo.ErrForbidden
	}

	if err = dictionaries.IsValid(dictionaries.ValidationRequest{
		Type:    req.Type,
		Content: req.Content,
	}); err != nil {
		return echo.ErrBadRequest.WithInternal(err)
	}

	uu, err := uuid.NewV7()
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	d := models.Dictionary{
		ID:    uu.String(),
		Name:  req.Name,
		Owner: req.Owner,
		Type:  req.Type,
	}
	d.Content.SetValid(req.Content)

	err = d.Insert(ctx, m.App.DB(), boil.Infer())
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	return c.JSON(http.StatusOK, map[string]string{
		"id": d.ID,
	})
}
