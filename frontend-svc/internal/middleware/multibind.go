package middleware

import (
	"fmt"

	"github.com/cisco-open/sprt/frontend-svc/internal/utils"
	"github.com/labstack/echo/v4"
)

func MultiBind() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			req := c.Request()
			if req.Body != nil {
				reusable, err := utils.NewReusableReader(req.Body)
				if err != nil {
					return fmt.Errorf("failed to create reusable reader: %w", err)
				}
				req.Body = reusable
			}

			return next(c)
		}
	}
}
