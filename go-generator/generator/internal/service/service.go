package service

import (
	"context"
	"database/sql"
	"flag"
	"os"
	"time"

	"github.com/cisco-open/sprt/go-generator/generator/internal/queue"
	"github.com/cisco-open/sprt/go-generator/sdk/app"
	"github.com/cisco-open/sprt/go-generator/specs"
	"github.com/joho/godotenv"
	"github.com/rs/zerolog"
)

type (
	Service struct {
		Specs specs.Specs

		id      string
		mainCtx context.Context
		l       *zerolog.Logger
		db      *sql.DB
		n       *specs.SpecNotify
		q       *queue.QueueClient
	}
)

func Build(ctx context.Context) *Service {
	loadEnv()

	cfgFile := flag.String("config", "", "specifies config file to use")
	flag.Parse()

	s := &Service{mainCtx: ctx, id: app.GetNewServiceID()}

	s.mustInitSpecNotifier().
		mustLoadSpecs(cfgFile).
		buildLogger().
		mustInitDB().
		mustInitQueue()

	if err := s.syncWithDb(ctx); err != nil {
		panic(err)
	}

	return s
}

func (s *Service) InProduction() bool {
	return s.Specs.Env == "production"
}

func (s *Service) ID() string {
	return s.id
}

func (s *Service) Close() {
	timeoutCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()

	s.q.Close()

	for {
		select {
		case <-timeoutCtx.Done():
			return
		case <-ticker.C:
			s.l.Debug().Msg("Waiting for queue to close")
			if s.q.IsClosed() {
				return
			}
		}
	}
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
