package db

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/rs/zerolog"
	migrate "github.com/rubenv/sql-migrate"

	"github.com/cisco-open/sprt/go-generator/specs"
)

func Migrate(_ context.Context, db *sql.DB, cfg specs.DBSpecs, logger *zerolog.Logger) error {
	migrations := &migrate.FileMigrationSource{
		Dir: cfg.MigrationsDirectory,
	}

	logger.Debug().Str("migrations_directory", cfg.MigrationsDirectory).Msg("Looking for migrations")

	if logger.GetLevel() == zerolog.DebugLevel {
		ms, err := migrations.FindMigrations()
		if err != nil {
			return fmt.Errorf("find migrations: %w", err)
		}

		for _, m := range ms {
			logger.Debug().Str("migration", m.Id).Msg("Found migration")
		}
	}

	n, err := migrate.Exec(db, "postgres", migrations, migrate.Up)
	if err != nil {
		return fmt.Errorf("migrate: %w", err)
	}

	logger.Info().Int("migrations", n).Msg("Migrations applied")

	return nil
}
