package handlers

import (
	"errors"
	"net/http"

	"github.com/labstack/echo/v4"

	"github.com/cisco-open/sprt/frontend-svc/internal/auth"
	"github.com/cisco-open/sprt/frontend-svc/internal/sessions"
	"github.com/cisco-open/sprt/frontend-svc/internal/utils"

	"github.com/cisco-open/sprt/go-generator/sdk/db"
	"github.com/cisco-open/sprt/go-generator/sdk/db/models"
	"github.com/cisco-open/sprt/go-generator/sdk/json"
)

func (m *controller) GetSessionsPerServerBulked(c echo.Context) error {
	u, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	bulked, err := db.Exec(m.App).GetSessionsPerServerBulked(ctx, utils.OwnerPack(u.ForUser))
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	return c.JSON(http.StatusOK, bulked)
}

func (m *controller) GetSessionsPerBulk(proto models.Protos) func(c echo.Context) error {
	return func(c echo.Context) error {
		u, ctx, err := auth.GetUserDataAndContext(c)
		if err != nil {
			return err
		}

		req := new(struct {
			Bulk   string `param:"bulk" validate:"required"`
			Server string `param:"server" validate:"required"`
		})
		if err = m.bindAndValidate(c, req); err != nil {
			return err
		}

		pagination := getPagination(c)
		sort := getSort(c, &db.Sort{SortBy: models.SessionColumns.Changed, SortDirection: db.OrderByDesc})
		filter := getFilter(c)

		response := make(map[string]any)
		var total int64

		switch proto {
		case models.ProtosRadius:
			sessions, err := db.Exec(m.App).WithPagination(pagination.DBPagination()).WithSort(&sort).WithFilter(filter).
				GetRadiusSessions(ctx, req.Server, utils.OwnerPack(u.ForUser), db.GetSessionsOptions{Bulk: req.Bulk})
			if err != nil {
				return echo.ErrInternalServerError.WithInternal(err)
			}

			response["sessions"] = sessions
			total, err = db.Exec(m.App).GetTotalRadiusSessionsInBulk(ctx, req.Server, utils.OwnerPack(u.ForUser), req.Bulk)
			if err != nil {
				return echo.ErrInternalServerError.WithInternal(err)
			}
		case models.ProtosTacacs:
			sessions, err := db.Exec(m.App).WithPagination(pagination.DBPagination()).WithSort(&sort).WithFilter(filter).
				GetTacacsSessions(ctx, req.Server, utils.OwnerPack(u.ForUser), db.GetSessionsOptions{Bulk: req.Bulk})
			if err != nil {
				return echo.ErrInternalServerError.WithInternal(err)
			}

			response["sessions"] = sessions
			total, err = db.Exec(m.App).GetTotalTacacsSessionsInBulk(ctx, req.Server, utils.OwnerPack(u.ForUser), req.Bulk)
			if err != nil {
				return echo.ErrInternalServerError.WithInternal(err)
			}
		default:
			return echo.ErrBadRequest.WithInternal(errors.New("unsupported protocol"))
		}

		response["_pagination"] = pagination.MapWithTotal(total)
		response["_sort"] = sort
		return c.JSON(http.StatusOK, response)
	}

}

func (m *controller) GetRadiusSessionDetails(c echo.Context) error {
	u, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	req := new(struct {
		Server    string `param:"server" validate:"required"`
		SessionID int64  `param:"id" validate:"required"`
	})
	if err = m.bindAndValidate(c, req); err != nil {
		return err
	}

	session, err := db.Exec(m.App).GetRadiusSessionDetails(ctx, req.Server, utils.OwnerPack(u.ForUser), req.SessionID)
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	flows := sessions.SplitRadiusToFlowTypes(session)
	result := struct {
		*db.SessionWithFlow
		Flows []*sessions.SessionFlow `json:"flows"`
	}{
		SessionWithFlow: session,
		Flows:           flows,
	}

	return c.JSON(http.StatusOK, result)
}

func (m *controller) GetRadiusSessionsGuestData(c echo.Context) error {
	u, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	req := new(struct {
		Server            string  `param:"server" validate:"required"`
		Bulk              string  `param:"bulk" validate:"required"`
		SessionsSpecifier string  `query:"sessions" validate:"omitempty,required_without=Sessions,oneof=all"`
		Sessions          []int64 `query:"sessions[]" validate:"omitempty,required_without=SessionsSpecifier,dive,required"`
	})
	if err = m.bindAndValidate(c, req); err != nil {
		return err
	}

	m.App.Logger().Debug().
		Str("server", req.Server).Str("user", u.ForUser).Str("requestor", u.UserID).
		Str("sessions_specifier", req.SessionsSpecifier).Ints64("sessions", req.Sessions).
		Interface("req", req).Msg("Getting radius sessions guest data")

	sess, err := db.Exec(m.App).GetRadiusSessions(ctx, req.Server, utils.OwnerPack(u.ForUser), db.GetSessionsOptions{IDs: req.Sessions, Bulk: req.Bulk})
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	if len(sess) == 0 {
		return echo.ErrNotFound
	}

	type (
		flowData struct {
			ID        int64  `json:"id"`
			Login     string `json:"login"`
			Password  string `json:"password"`
			UserAgent string `json:"user_agent"`
		}

		errData struct {
			ID  int64  `json:"id"`
			Err string `json:"err"`
		}
	)
	creds := make([]flowData, 0)
	errors := make([]errData, 0)
	for _, s := range sess {
		if len(s.Attributes) == 0 {
			continue
		}

		attr := new(sessions.RadiusSessionAttributes)
		//FIXME: GUEST_FLOW might be just a string "no-flow", not an object
		err = json.Unmarshal([]byte(s.Attributes), attr)
		if err != nil {
			errors = append(errors, errData{ID: s.ID, Err: err.Error()})
			continue
		}

		gf := attr.GetSnapshot().GetGuestFlow()
		if gf == nil {
			continue
		}

		fd := flowData{ID: s.ID}
		if sessCreds := gf.GetCredentials(); sessCreds != nil {
			if len(*sessCreds) != 2 {
				errors = append(errors, errData{ID: s.ID, Err: "invalid credentials"})
			} else {
				fd.Login = (*sessCreds)[0]
				fd.Password = (*sessCreds)[1]
			}
		}
		if ua := gf.GetUserAgent(); ua != nil {
			fd.UserAgent = *ua
		}
		creds = append(creds, fd)
	}

	result := map[string]any{
		"creds": creds,
	}
	if len(errors) > 0 {
		result["errors"] = errors
	}

	return c.JSON(http.StatusOK, result)
}

func (m *controller) GetRadiusServersBulks(c echo.Context) error {
	u, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	servers, err := db.Exec(m.App).GetSessionsPerServerBulkedPerProto(ctx, utils.OwnerPack(u.ForUser), models.ProtosRadius)
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	return c.JSON(http.StatusOK, servers)
}

func (m *controller) GetTacacsSessionDetails(c echo.Context) error {
	u, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	req := new(struct {
		Server    string `param:"server" validate:"required"`
		SessionID int64  `param:"id" validate:"required"`
	})
	if err = m.bindAndValidate(c, req); err != nil {
		return err
	}

	session, err := db.Exec(m.App).GetTacacsSessionDetails(ctx, req.Server, utils.OwnerPack(u.ForUser), req.SessionID)
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	flows := sessions.SplitTacacsToFlowTypes(session)
	result := struct {
		*db.TacacsSessionWithFlow
		Flows []*sessions.TacacsSessionFlow `json:"flows"`
	}{
		TacacsSessionWithFlow: session,
		Flows:                 flows,
	}

	return c.JSON(http.StatusOK, result)
}

type sessionsUpdateRequest struct {
	Action   string  `param:"action" validate:"required,oneof=drop interim"`
	Server   string  `param:"server" validate:"required"`
	Bulk     string  `param:"bulk" json:"bulk" validate:"omitempty,required_without=Sessions"`
	Sessions []int64 `json:"sessions" validate:"omitempty,required_without=Bulk,min=1,dive,gt=0"`
}

func (m *controller) UpdateRadiusSessions(c echo.Context) error {
	_, _, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	req := new(sessionsUpdateRequest)
	if err = m.bindAndValidate(c, req); err != nil {
		return err
	}

	// FIXME:
	return echo.ErrNotImplemented

	// if err := db.Exec(m.App).DropRadiusSessions(ctx, u.ForUser, req.Server, req.Bulk); err != nil {
	// 	return echo.ErrInternalServerError.WithInternal(err)
	// }

	// return c.NoContent(http.StatusNoContent)
}

func (m *controller) DeleteRadiusSessions(c echo.Context) error {
	_, _, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	req := new(struct {
		Server string  `param:"server" validate:"required"`
		Bulk   string  `param:"bulk" validate:"omitempty"`
		Select string  `query:"select" validate:"required,oneof=all dropped-failed older-than-5d ids"`
		IDs    []int64 `query:"ids[]" validate:"omitempty,required_if=Select ids,gt=0,dive,gt=0"`
	})
	if err = m.bindAndValidate(c, req); err != nil {
		return err
	}

	// FIXME:
	return echo.ErrNotImplemented

	// if err := db.Exec(m.App).DropRadiusSessions(ctx, u.ForUser, req.Server, req.Bulk); err != nil {
	// 	return echo.ErrInternalServerError.WithInternal(err)
	// }

	// return c.NoContent(http.StatusNoContent)
}

func (m *controller) UpdateTacacsSessions(c echo.Context) error {
	_, _, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	req := new(sessionsUpdateRequest)
	if err = m.bindAndValidate(c, req); err != nil {
		return err
	}

	// FIXME:
	return echo.ErrNotImplemented

	// if err := db.Exec(m.App).DropTacacsSessions(ctx, u.ForUser, req.Server, req.Bulk); err != nil {
	// 	return echo.ErrInternalServerError.WithInternal(err)
	// }

	// return c.NoContent(http.StatusNoContent)
}

func (m *controller) GetSessionSummary(c echo.Context) error {
	u, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	req := new(struct {
		ID    int64  `param:"id" validate:"required"`
		Proto string `query:"proto" validate:"required,oneof=radius tacacs"`
	})
	if err = m.bindAndValidate(c, req); err != nil {
		return err
	}

	m.App.Logger().Debug().Int64("session_id", req.ID).Str("user", u.ForUser).Str("proto", req.Proto).
		Msg("Getting session summary")

	summary, err := db.Exec(m.App).GetSessionSummary(ctx, req.ID, utils.OwnerPack(u.ForUser), models.Protos(req.Proto))
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	if summary == nil {
		return echo.ErrNotFound
	}

	return c.JSON(http.StatusOK, summary)
}
