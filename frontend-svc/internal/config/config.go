package config

import (
	"context"
	"database/sql"
	"flag"
	"os"

	"github.com/gorilla/sessions"
	"github.com/joho/godotenv"
	"github.com/rs/zerolog"

	"github.com/cisco-open/sprt/frontend-svc/internal/cleaner"
	"github.com/cisco-open/sprt/frontend-svc/internal/generator"
	"github.com/cisco-open/sprt/frontend-svc/internal/pxgrid"
	"github.com/cisco-open/sprt/frontend-svc/internal/queue"
	"github.com/cisco-open/sprt/go-generator/sdk/app"
	"github.com/cisco-open/sprt/go-generator/specs"
)

type AppConfig struct {
	SessionStore sessions.Store
	Specs        specs.Specs

	cleaner   cleaner.Cleaner
	generator generator.Generator
	l         *zerolog.Logger
	db        *sql.DB
	n         *specs.SpecNotify
	px        *pxgrid.PXGridClient
	queue     *queue.QueueClient
	id        string
}

func LoadConfig(ctx context.Context) *AppConfig {
	loadEnv()

	cfgFile := flag.String("config", "", "specifies config file to use")
	flag.Parse()

	a := &AppConfig{id: app.GetNewServiceID()}

	a.mustInitSpecNotifier().
		mustLoadSpecs(cfgFile).
		buildLogger().
		mustInitDB().
		mustInitSessionStore().
		mustInitCleaner().
		initPxGridClient().
		mustInitGenerator().
		mustInitQueue()

	if err := a.syncWithDb(ctx); err != nil {
		panic(err)
	}

	return a
}

func (app *AppConfig) InProduction() bool {
	return app.Specs.Env == "production"
}

func (app *AppConfig) ID() string {
	return app.id
}

func (app *AppConfig) Ctx() context.Context {
	return context.Background()
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
