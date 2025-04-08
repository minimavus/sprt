package handlers

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/labstack/echo/v4"

	"github.com/cisco-open/sprt/frontend-svc/internal/auth"
	"github.com/cisco-open/sprt/frontend-svc/internal/db"
	"github.com/cisco-open/sprt/frontend-svc/internal/policy"
	"github.com/cisco-open/sprt/frontend-svc/internal/utils"
)

func (m *controller) GetLogOwners(c echo.Context) error {
	_, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	req := new(struct {
		By  string `query:"order_by" validate:"omitempty,oneof=last_update owner"`
		How string `query:"order_how" validate:"omitempty,oneof=asc desc"`
	})

	if err = m.bindAndValidate(c, req); err != nil {
		return err
	}

	if req.By == "" {
		req.By = "last_update"
	}
	if req.How == "" {
		req.How = "desc"
	} else {
		req.How = strings.ToLower(req.How)
	}

	list, err := db.Exec(m.App).GetLogOwners(ctx, req.By, req.How)
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	seen := make(map[string]struct{})
	owners := make([]db.LogOwnersRow, 0)
	for _, l := range list {
		if strings.HasSuffix(l.Owner, "__watcher") || strings.HasSuffix(l.Owner, "__generator") || strings.HasSuffix(l.Owner, "__udp_server") {
			l.Owner = l.Owner[:strings.LastIndex(l.Owner, "__")]
		}
		if _, ok := seen[l.Owner]; ok {
			continue
		}
		seen[l.Owner] = struct{}{}
		owners = append(owners, l)
	}

	return c.JSON(http.StatusOK, map[string]any{"owners": owners})
}

func (m *controller) GetLogOwnerChunks(c echo.Context) error {
	_, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	req := new(struct {
		Owner string `param:"owner" validate:"required"`
	})

	if err = m.bindAndValidate(c, req); err != nil {
		return err
	}

	op := utils.OwnerPack(req.Owner)

	list, err := db.Exec(m.App).GetLogOwnerChunks(ctx, op...)
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	return c.JSON(http.StatusOK, map[string]any{
		"chunks":     list,
		"logs_owner": req.Owner,
		"pack":       op,
	})
}

func (m *controller) GetLogsChunk(c echo.Context) error {
	u, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	req := new(struct {
		Owner   string `param:"owner" validate:"required"`
		Chunk   string `param:"chunk" validate:"required"`
		Preview bool   `query:"preview" validate:"omitempty"`
	})

	if err = m.bindAndValidate(c, req); err != nil {
		return err
	}

	realOwner, err := db.Exec(m.App).GetLogsChunkOwner(ctx, req.Chunk)
	if err != nil || ctx.Err() != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}
	if !strings.HasPrefix(realOwner, req.Owner) {
		m.App.Logger().Warn().
			Str("real_owner", realOwner).Str("request_owner", req.Owner).Str("chunk", req.Chunk).
			Msg("Chunk doesn't belong to the owner")
		return echo.ErrBadRequest.WithInternal(fmt.Errorf("chunk doesn't belong to the owner '%s'", req.Owner))
	}

	if !strings.HasPrefix(realOwner, u.UserID) && !policy.UserCan(u, "logs.read.others") {
		return echo.ErrForbidden
	}

	var limit int
	if req.Preview {
		limit = 2
	}

	list, err := db.Exec(m.App).GetLogsChunk(ctx, realOwner, req.Chunk, limit)
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	return c.JSON(http.StatusOK, map[string]any{
		"logs": list,
	})
}

func (m *controller) DeleteLogs(c echo.Context) error {
	u, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	var owner, chunk string
	if err = echo.PathParamsBinder(c).String("owner", &owner).BindError(); err != nil {
		return echo.ErrBadRequest.WithInternal(err)
	}

	chunk = c.Param("chunk")

	if (chunk == "" || !strings.HasPrefix(owner, u.UserID)) && !policy.UserCan(u, "logs.delete.others") {
		return echo.ErrForbidden
	}

	var deleted int64
	if chunk != "" {
		realOwner, err := db.Exec(m.App).GetLogsChunkOwner(ctx, chunk)
		if err != nil {
			return echo.ErrInternalServerError.WithInternal(err)
		}
		if !strings.HasPrefix(realOwner, owner) {
			m.App.Logger().Warn().
				Str("real_owner", realOwner).Str("request_owner", owner).Str("chunk", chunk).
				Msg("Chunk doesn't belong to the owner")
			return echo.ErrBadRequest.WithInternal(fmt.Errorf("chunk doesn't belong to the owner '%s'", owner))
		}
		err = m.cleanLogFiles(ctx, []string{realOwner}, chunk)
		if err != nil {
			return echo.ErrInternalServerError.WithInternal(err)
		}
		deleted, err = db.Exec(m.App).DeleteLogs(ctx, []string{realOwner}, chunk)
	} else {
		err = m.cleanLogFiles(ctx, utils.OwnerPack(owner))
		if err != nil {
			return echo.ErrInternalServerError.WithInternal(err)
		}
		deleted, err = db.Exec(m.App).DeleteLogs(ctx, utils.OwnerPack(owner))
	}
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	return c.JSON(http.StatusOK, map[string]any{
		"deleted": deleted,
	})
}

func (m *controller) cleanLogFiles(ctx context.Context, owner []string, chunk ...string) error {
	files, err := db.Exec(m.App).GetLogsRelatedFiles(ctx, owner, chunk...)
	if err != nil {
		return fmt.Errorf("clean log files: %w", err)
	}

	for _, f := range files {
		filename := strings.TrimPrefix(f, "file:")
		m.App.Logger().Debug().Str("file", filename).Msg("Removing log file")

		if err := os.Remove(filename); err != nil {
			m.App.Logger().Error().Err(err).Str("file", filename).Msg("Failed to delete log file")
		}
	}

	return nil
}
