package config

import (
	"github.com/rs/zerolog"

	"github.com/cisco-open/sprt/go-generator/sdk/app"
	"github.com/cisco-open/sprt/go-generator/sdk/logger"
)

var _ app.Logger = (*AppConfig)(nil)

func (app *AppConfig) buildLogger() *AppConfig {

	app.l = logger.BuildLoggerForService(app, "frontend")
	return app
}

func (app *AppConfig) Logger() *zerolog.Logger {
	return app.l
}
