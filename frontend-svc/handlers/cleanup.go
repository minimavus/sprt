package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/labstack/echo/v4"

	"github.com/cisco-open/sprt/frontend-svc/internal/auth"
	"github.com/cisco-open/sprt/frontend-svc/internal/db"
	"github.com/cisco-open/sprt/frontend-svc/models"
)

type (
	StatusLevel     string
	StatusValueType string

	StatusResponse struct {
		Level StatusLevel     `json:"level"`
		Type  StatusValueType `json:"type,omitempty"`
		Value any             `json:"value,omitempty"`
	}
)

const (
	StatusLevelSuccess StatusLevel = "success"
	StatusLevelInfo    StatusLevel = "info"
	StatusLevelWarn    StatusLevel = "warning"
	StatusLevelDanger  StatusLevel = "danger"

	StatusValueTypeIcon StatusValueType = "icon"
	StatusValueTypeText StatusValueType = "text"
)

func (m *controller) GetOrphanedFlows(c echo.Context) error {
	_, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	req := new(struct {
		Full bool `query:"full" validate:"omitempty"`
	})

	if err = m.bindAndValidate(c, req); err != nil {
		return err
	}

	orph, err := db.Exec(m.App).GetOrphanFlows(ctx)
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	result := map[string]any{
		"total": len(orph),
	}
	if req.Full {
		result["flows"] = orph
	}

	return c.JSON(http.StatusOK, result)
}

func (m *controller) GetOrphanedFlowsStatus(c echo.Context) error {
	_, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	orph, err := db.Exec(m.App).GetOrphanFlows(ctx)
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	res := StatusResponse{
		Level: StatusLevelSuccess,
		Type:  StatusValueTypeIcon,
	}
	if len(orph) > 0 {
		res.Level = StatusLevelWarn
	}

	return c.JSON(http.StatusOK, res)
}

func (m *controller) DeleteOrphanedFlows(c echo.Context) error {
	_, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	orph, err := db.Exec(m.App).GetOrphanFlows(ctx)
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	if len(orph) == 0 {
		return c.JSON(http.StatusOK, map[string]any{"total": 0})
	}

	removed, err := db.Exec(m.App).DeleteFlows(ctx, orph...)

	return c.JSON(http.StatusOK, map[string]any{"total": removed})
}

func (m *controller) GetOrphanedCLIs(c echo.Context) error {
	_, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	req := new(struct {
		Full bool `query:"full" validate:"omitempty"`
	})

	if err = m.bindAndValidate(c, req); err != nil {
		return err
	}

	orph, err := db.Exec(m.App).GetOrphanedCLIs(ctx)
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	result := map[string]any{
		"total": len(orph),
	}
	if req.Full {
		result["clis"] = orph
	}

	return c.JSON(http.StatusOK, result)
}

func (m *controller) GetOrphanedCLIsStatus(c echo.Context) error {
	_, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	orph, err := db.Exec(m.App).GetOrphanedCLIs(ctx)
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	res := StatusResponse{
		Level: StatusLevelSuccess,
		Type:  StatusValueTypeIcon,
	}
	if len(orph) > 0 {
		res.Level = StatusLevelWarn
	}

	return c.JSON(http.StatusOK, res)
}

func (m *controller) DeleteOrphanedCLIs(c echo.Context) error {
	_, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	orph, err := db.Exec(m.App).GetOrphanedCLIs(ctx)
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	if len(orph) == 0 {
		return c.JSON(http.StatusOK, map[string]any{"total": 0})
	}

	removed, err := db.Exec(m.App).DeleteCLIs(ctx, orph...)

	return c.JSON(http.StatusOK, map[string]any{"total": removed})
}

func (m *controller) GetOldSessions(c echo.Context) error {
	_, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	than30, err := db.Exec(m.App).GetOldSessionsPerOwner(ctx, time.Hour*24*30)
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}
	than10, err := db.Exec(m.App).GetOldSessionsPerOwner(ctx, time.Hour*24*10)
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}
	than5, err := db.Exec(m.App).GetOldSessionsPerOwner(ctx, time.Hour*24*5)
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	response := map[models.Protos]any{
		models.ProtosRadius: map[string]any{
			"30": than30[models.ProtosRadius],
			"10": than10[models.ProtosRadius],
			"5":  than5[models.ProtosRadius],
		},
		models.ProtosTacacs: map[string]any{
			"30": than30[models.ProtosTacacs],
			"10": than10[models.ProtosTacacs],
			"5":  than5[models.ProtosTacacs],
		},
	}

	return c.JSON(http.StatusOK, response)
}

func (m *controller) GetOldSessionsStatus(c echo.Context) (err error) {
	var ctx context.Context
	_, ctx, err = auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	res := &StatusResponse{
		Level: StatusLevelSuccess,
		Type:  StatusValueTypeIcon,
	}
	defer func() {
		if err != nil {
			return
		}
		err = c.JSON(http.StatusOK, res)
	}()

	mapping := map[time.Duration]StatusLevel{
		time.Hour * 24 * 30: StatusLevelDanger,
		time.Hour * 24 * 10: StatusLevelWarn,
		time.Hour * 24 * 5:  StatusLevelInfo,
	}
	for dur, lvl := range mapping {
		var sess map[models.Protos][]db.ProtoSessionPerOwner
		sess, err = db.Exec(m.App).GetOldSessionsPerOwner(ctx, dur)
		if err != nil {
			return echo.ErrInternalServerError.WithInternal(err)
		}
		if len(sess[models.ProtosRadius]) > 0 || len(sess[models.ProtosTacacs]) > 0 {
			res.Level = lvl
			return
		}
	}

	return
}

func (m *controller) DeleteOldSessions(c echo.Context) error {
	_, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	req := new(struct {
		OlderThanDays int           `query:"older_than_days" validate:"required,gt=0"`
		Proto         models.Protos `query:"proto" validate:"omitempty,oneof=radius tacacs"`
	})
	if err = m.bindAndValidate(c, req); err != nil {
		return err
	}
	if err = req.Proto.IsValid(); err != nil {
		return echo.ErrBadRequest.WithInternal(err)
	}

	removed, err := db.Exec(m.App).DeleteOldSessions(ctx, req.Proto, time.Duration(req.OlderThanDays)*24*time.Hour)
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	return c.JSON(http.StatusOK, map[string]any{"total": removed})
}

func (m *controller) GetCleaner(c echo.Context) error {
	return c.JSON(http.StatusOK, m.App.CleanerStatus())
}

// PutCleaner updates config of scheduled cleanup job
func (m *controller) PutCleaner(c echo.Context) error {
	_, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	req := new(struct {
		Enabled   bool          `json:"enabled"`
		Cron      string        `json:"cron" validate:"omitempty"`
		OlderThan time.Duration `json:"older_than" validate:"omitempty"`
	})
	if err = m.bindAndValidate(c, req); err != nil {
		return err
	}

	err = m.App.SetSpec(ctx, "cleaner.enabled", req.Enabled)
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	err = m.App.SetSpec(ctx, "cleaner.cron", req.Cron)
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	err = m.App.SetSpec(ctx, "cleaner.older_than", req.OlderThan)
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	return c.NoContent(http.StatusNoContent)
}

func (m *controller) GetRunningProcesses(c echo.Context) error {
	return echo.ErrNotImplemented
}

func (m *controller) GetRunningProcessesStatus(c echo.Context) error {
	return echo.ErrNotImplemented
}

func (m *controller) StopRunningProcess(c echo.Context) error {
	return echo.ErrNotImplemented
}

func (m *controller) GetScheduledJobs(c echo.Context) error {
	return echo.ErrNotImplemented
}

func (m *controller) GetScheduledJobsStatus(c echo.Context) error {
	return echo.ErrNotImplemented
}

func (m *controller) DeleteScheduledJob(c echo.Context) error {
	return echo.ErrNotImplemented
}
