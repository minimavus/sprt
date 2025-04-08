package handlers

import (
	"net/http"

	"github.com/labstack/echo/v4"
)

func (m *controller) getAvailableSources(c echo.Context) error {
	srcs, err := m.App.AvailableSources()
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	return c.JSON(http.StatusOK, srcs)
}
