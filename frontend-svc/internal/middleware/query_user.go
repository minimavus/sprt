package middleware

import (
	"github.com/labstack/echo/v4"
	"github.com/rs/zerolog/log"

	"github.com/cisco-open/sprt/frontend-svc/internal/auth"
)

func tryQueryParam(c echo.Context, param string, defaultValue string) string {
	if param == "" {
		return defaultValue
	}

	qu := c.QueryParam(param)
	if qu == "" {
		return defaultValue
	}

	return qu
}

func QueryUser(queryParam string) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			u, err := auth.GetBasicUserData(c)
			if err != nil {
				log.Error().Err(err).Msg("failed to get user data and context")
				c.Set(auth.QueryUserKey, "")
				return next(c)
			}

			c.Set(auth.QueryUserKey, tryQueryParam(c, queryParam, u.UserID))

			return next(c)
		}
	}
}
