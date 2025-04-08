package config

import (
	"context"
	"database/sql"
	"flag"
	"os"

	"github.com/cisco-open/sprt/frontend-svc/internal/cleaner"
	"github.com/cisco-open/sprt/frontend-svc/internal/generator"
	"github.com/cisco-open/sprt/frontend-svc/internal/pxgrid"
	"github.com/gorilla/sessions"
	"github.com/joho/godotenv"
	"github.com/rs/zerolog"
)

type AppConfig struct {
	SessionStore sessions.Store
	Specs        Specs

	cleaner   cleaner.Cleaner
	generator generator.Generator
	l         *zerolog.Logger
	db        *sql.DB
	n         *notifier
	px        *pxgrid.PXGridClient
}

func LoadConfig(ctx context.Context) *AppConfig {
	loadEnv()

	cfgFile := flag.String("config", "", "specifies config file to use")
	flag.Parse()

	a := &AppConfig{}

	a.mustInitSpecNotifier().
		mustLoadSpecs(cfgFile).
		buildLogger().
		mustInitDB().
		mustInitSessionStore().
		mustInitCleaner().
		initPxGridClient().
		mustInitGenerator()

	if err := a.syncWithDb(ctx); err != nil {
		panic(err)
	}

	return a
}

func (app *AppConfig) InProduction() bool {
	return app.Specs.Env == "production"
}

// loadEnv loads .env files (if any)
func loadEnv() {
	env := os.Getenv("ENV")
	if env == "" {
		env = "production"
	}

	godotenv.Load(".env." + env + ".local")
	if env != "test" {
		godotenv.Load(".env.local")
	}
	godotenv.Load(".env." + env)
	godotenv.Load() // The Original .env
}
