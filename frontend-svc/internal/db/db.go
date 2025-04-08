package db

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	_ "github.com/lib/pq"
	"github.com/rs/zerolog/log"
)

func NewSQL(ctx context.Context, cfg Specs) (*sql.DB, error) {
	db, err := sql.Open("postgres", cfg.GetDSN())
	if err != nil {
		return nil, fmt.Errorf("create db conn: %w", err)
	}

	if err = PingConnection(ctx, &cfg, func(pingCtx context.Context) error {
		return db.PingContext(pingCtx)
	}); err != nil {
		return nil, fmt.Errorf("create db conn: %w", err)
	}

	return db, nil
}

func PingConnection(ctx context.Context, cfg *Specs, pinger func(ctx context.Context) error) error {
	ticker := time.NewTicker(cfg.ConnTimeout)
	defer ticker.Stop()

	var err error
	for i := 0; i < cfg.ConnRetry; i++ {
		switch err = pinger(ctx); err {
		case nil:
			return nil
		case context.Canceled, context.DeadlineExceeded:
			return fmt.Errorf("ping database connection: %w", err)
		default:
			log.Error().Err(err).Msg("failed to ping database connection")
		}
		select {
		case <-ctx.Done():
			return fmt.Errorf("ping database connection: %w", ctx.Err())
		case <-ticker.C:
		}
	}
	return fmt.Errorf("ping database connection: %w", err)
}
