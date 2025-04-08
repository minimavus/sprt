package config

import (
	"github.com/cisco-open/sprt/frontend-svc/internal/pxgrid"
)

func (app *AppConfig) initPxGridClient() *AppConfig {
	if app.Specs.Services.PXGrider.URL == "" {
		app.l.Warn().Msg("pxGrid client is not configured")
		return app
	}

	app.l.Info().Str("url", app.Specs.Services.PXGrider.URL).Msg("Initializing pxGrid client")
	c := pxgrid.NewPXGridClient(app.Specs.Services.PXGrider, app.l)
	app.px = c

	if err := c.Connect(); err != nil {
		app.l.Warn().Err(err).Msg("Failed to connect to pxGrid")
	}

	return app
}

func (app *AppConfig) HasPxGridClient() bool {
	return app.px != nil
}

func (app *AppConfig) PX() *pxgrid.PXGridClient {
	return app.px
}
