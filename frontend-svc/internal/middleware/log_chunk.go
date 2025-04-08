package middleware

import (
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

var logChunkKey = "serve"

func LegacyLogsChunk() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			u, err := uuid.NewV7()
			if err != nil {
				return err
			}
			c.Set(logChunkKey, u.String())

			return next(c)
		}
	}
}

func GetLegacyLogChunk(c echo.Context) string {
	v := c.Get(logChunkKey)
	s, ok := v.(string)
	if !ok {
		return ""
	}

	return s
}
