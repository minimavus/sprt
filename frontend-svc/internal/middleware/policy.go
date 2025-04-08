package middleware

import (
	"github.com/labstack/echo/v4"

	"github.com/cisco-open/sprt/frontend-svc/internal/auth"
	"github.com/cisco-open/sprt/frontend-svc/internal/policy"
)

func ValidatePermission(permission string, mods ...policy.PolicyMod) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			u, _, err := auth.GetUserDataAndContext(c)
			if err != nil {
				return err
			}

			err = policy.IsPermitted(c, u, append(mods, policy.PolicePermission(permission))...)
			if err != nil {
				return err
			}

			return next(c)
		}
	}
}
