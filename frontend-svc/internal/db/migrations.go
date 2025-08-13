package db

import (
	"context"
	"fmt"

	"github.com/rs/zerolog"
	migrate "github.com/rubenv/sql-migrate"

	"github.com/cisco-open/sprt/frontend-svc/shared"
	"github.com/cisco-open/sprt/go-generator/specs"
)

func Migrate(_ context.Context, app shared.LogDB, cfg specs.DBSpecs) error {
	migrations := &migrate.FileMigrationSource{
		Dir: cfg.MigrationsDirectory,
	}

	app.Logger().Debug().Str("migrations_directory", cfg.MigrationsDirectory).Msg("Looking for migrations")

	if app.Logger().GetLevel() == zerolog.DebugLevel {
		ms, err := migrations.FindMigrations()
		if err != nil {
			return fmt.Errorf("find migrations: %w", err)
		}

		for _, m := range ms {
			app.Logger().Debug().Str("migration", m.Id).Msg("Found migration")
		}
	}

	n, err := migrate.Exec(app.DB(), "postgres", migrations, migrate.Up)
	if err != nil {
		return fmt.Errorf("migrate: %w", err)
	}

	app.Logger().Info().Int("migrations", n).Msg("Migrations applied")

	return nil
}
