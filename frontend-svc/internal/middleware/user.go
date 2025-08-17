package middleware

import (
	"database/sql"
	"errors"
	"net/http"

	"github.com/cisco-open/sprt/frontend-svc/internal/auth"
	"github.com/cisco-open/sprt/go-generator/sdk/db"
	"github.com/cisco-open/sprt/go-generator/sdk/db/models"
	"github.com/labstack/echo/v4"
)

// EnsureUser is a middleware that ensures there is user's record in db. If not - creates empty one.
func EnsureUser(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		session, ctx, err := auth.GetUserDataAndContext(c)
		if err != nil {
			return err
		}

		if session.UserID == "" {
			return next(c)
		}

		_, err = models.FindUser(ctx, repo.App.DB(), session.UserID)
		if err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				repo.App.Logger().Debug().Str("user_id", session.UserID).Msg("User not found, creating a new one")
				err = db.Exec(repo.App).CreateRecordForUser(ctx, session.UserID)
				if err != nil {
					repo.App.Logger().Error().Stack().Err(err).Msg("Failed to create user record")
					return echo.NewHTTPError(http.StatusInternalServerError, "Failed to create user record").WithInternal(err)
				}
			} else {
				return echo.NewHTTPError(http.StatusInternalServerError, "Couldn't find user").WithInternal(err)
			}
		}

		return next(c)
	}
}
