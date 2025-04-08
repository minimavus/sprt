package config

import (
	"fmt"

	"github.com/cisco-open/sprt/frontend-svc/internal/generator"
)

func (app *AppConfig) mustInitGenerator() *AppConfig {
	g, err := generator.New(app, app.Specs.Generator)
	if err != nil {
		panic(fmt.Errorf("init generator: %w", err))
	}

	app.generator = g
	return app
}

func (app *AppConfig) Generator() generator.Generator {
	return app.generator
}
