package validator

import (
	"context"
	"net/http"

	validate "github.com/go-playground/validator/v10"
	"github.com/labstack/echo/v4"
)

type CustomValidator struct {
	validator *validate.Validate
}

var _ echo.Validator = (*CustomValidator)(nil)

var v *validate.Validate

func (cv *CustomValidator) Validate(i any) error {
	if err := cv.validator.Struct(i); err != nil {
		// Optionally, you could return the error to give each route more control over the status code
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	return nil
}

func (cv *CustomValidator) ValidateMapCtx(ctx context.Context, data map[string]any, rules map[string]any) map[string]any {
	return cv.validator.ValidateMapCtx(ctx, data, rules)
}

func NewValidator() echo.Validator {
	if v != nil {
		return &CustomValidator{validator: v}
	}

	v = validate.New()

	return &CustomValidator{validator: v}
}
