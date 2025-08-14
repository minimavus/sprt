package service

import (
	"context"
	"database/sql"
	"flag"
	"os"

	"github.com/cisco-open/sprt/go-generator/specs"
	"github.com/joho/godotenv"
	"github.com/rs/zerolog"
)

type (
	Service struct {
		Specs specs.Specs

		l  *zerolog.Logger
		db *sql.DB
	}
)

func Build(ctx context.Context) *Service {
	loadEnv()

	cfgFile := flag.String("config", "", "specifies config file to use")
	flag.Parse()

	s := &Service{}

	s.mustLoadSpecs(cfgFile).
		buildLogger()

	return s
}

func (s *Service) InProduction() bool {
	return s.Specs.Env == "production"
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
