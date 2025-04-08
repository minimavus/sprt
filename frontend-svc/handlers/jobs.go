package handlers

import (
	"errors"
	"net/http"

	"github.com/labstack/echo/v4"

	"github.com/cisco-open/sprt/frontend-svc/internal/auth"
	"github.com/cisco-open/sprt/frontend-svc/internal/db"
	"github.com/cisco-open/sprt/frontend-svc/internal/jobs"
	"github.com/cisco-open/sprt/frontend-svc/internal/policy"
)

const (
	testIdStr     = "123"
	newTestIdStr  = "100"
	roundIdStr    = "42"
	newRoundIdStr = "43"
)

func (m *controller) GetAllUsersWithJobs(c echo.Context) error {
	_, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	users, err := db.Exec(m.App).GetAllUsersWithJobs(ctx)
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	return c.JSON(http.StatusOK, map[string]any{"users": users})
}

func (m *controller) GetJobsOfUser(c echo.Context) error {
	u, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	req := new(struct {
		Jobs          []string `query:"jobs[]" validate:"omitempty,gte=1,dive"`
		Only          string   `query:"only" validate:"omitempty,oneof=running finished repeatable not_repeatable"`
		ExpandRunning bool     `query:"expand_running"`
		LoadCLI       bool     `query:"load_cli"`
	})
	if err = m.bindAndValidate(c, req); err != nil {
		return err
	}

	sort := getSort(c, &db.Sort{RawSortBy: `jobs.attributes->>'created'`, SortDirection: db.OrderByDesc})
	exec := db.Exec(m.App).WithSort(&sort)

	var js []*db.JobWithCLI
	var options []db.JobsLoadOption
	switch req.Only {
	case "running":
		options = append(options, db.JobsWithOnlyRunning())
	case "finished":
		options = append(options, db.JobsWithOnlyFinished())
	case "repeatable":
		options = append(options, db.JobsWithOnlyRepeatable())
	case "not_repeatable":
		options = append(options, db.JobsWithOnlyNotRepeatable())
	default:
		if len(req.Jobs) > 0 {
			options = append(options, db.JobsWithIDs(req.Jobs...))
		}
	}

	options = append(options, db.JobsWithLoadCLI(req.LoadCLI))
	js, err = exec.GetJobsOfUserWithOptions(ctx, u.ForUser, options...)
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	res := map[string]any{"jobs": js}
	if req.ExpandRunning {
		running := jobs.FindRunning(js)
		res["running"] = running
	}

	return c.JSON(http.StatusOK, res)
}

func (m *controller) GetJobStats(c echo.Context) error {
	u, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	req := new(struct {
		JobID string `param:"id" validate:"required"`
	})
	if err = m.bindAndValidate(c, req); err != nil {
		return err
	}
	m.App.Logger().Debug().Str("job_id", req.JobID).Str("requestor", u.UserID).Str("user", u.ForUser).
		Msg("Getting job stats")

	stats, err := jobs.GetJobStats(m.App, ctx, req.JobID, u.ForUser)
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	return c.JSON(http.StatusOK, stats)
}

// DeleteJob deletes a job by its ID.
func (m *controller) DeleteJob(c echo.Context) error {
	u, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	req := new(struct {
		JobID                      string `param:"id" validate:"required"`
		NoRollbackIfFileNotDeleted bool   `query:"no_rollback_if_file_not_deleted"`
	})
	if err = m.bindAndValidate(c, req); err != nil {
		return err
	}
	m.App.Logger().Debug().Str("job_id", req.JobID).Str("requestor", u.UserID).Str("user", u.ForUser).
		Msg("Deleting job")

	if req.NoRollbackIfFileNotDeleted && !policy.UserCan(u, "jobs.skip_delete_stats") {
		err = errors.New("user is not allowed to skip delete stats file")
		m.App.Logger().Error().Err(err).Str("job_id", req.JobID).Str("requestor", u.UserID).Str("user", u.ForUser).
			Msg("Failed to delete job")
		return echo.ErrForbidden.WithInternal(err)
	}

	err = jobs.DeleteJob(m.App, ctx, req.JobID, u.ForUser, req.NoRollbackIfFileNotDeleted)
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	return c.NoContent(http.StatusNoContent)
}

// RestartJob restarts a job by its ID.
func (m *controller) RestartJob(c echo.Context) error {
	u, _, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	req := new(struct {
		JobID string `param:"id" validate:"required"`
	})
	if err = m.bindAndValidate(c, req); err != nil {
		return err
	}
	m.App.Logger().Debug().Str("job_id", req.JobID).Str("requestor", u.UserID).Str("user", u.ForUser).
		Msg("Restarting job")

	return echo.ErrNotImplemented
}
