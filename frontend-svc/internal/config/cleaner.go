package config

import (
	"fmt"

	"github.com/cisco-open/sprt/frontend-svc/internal/cleaner"
)

func (app *AppConfig) mustInitCleaner() *AppConfig {
	c, err := cleaner.NewCleaner(app, app.Specs.Cleaner)
	if err != nil {
		panic(fmt.Errorf("init cleaner: %w", err))
	}
	app.cleaner = c
	return app
}

func (app *AppConfig) CleanerStatus() cleaner.CleanerStatus {
	return app.cleaner.Status()
}
