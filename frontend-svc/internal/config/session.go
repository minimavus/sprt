package config

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/sessions"
	"github.com/quasoft/memstore"
	"github.com/rbcervilla/redisstore/v9"
	"github.com/redis/go-redis/v9"
)

// mustInitSessionStore initiates session
func (app *AppConfig) mustInitSessionStore() *AppConfig {
	store, err := app.tryRedisStore()
	if err != nil {
		// use mem store
		app.Logger().Info().Msg("Using in-memory sessions store")
		store, _ = app.tryInMemoryStore()
	}

	app.SessionStore = store
	return app
}

func (app *AppConfig) tryRedisStore() (sessions.Store, error) {
	// preparing session storage
	var client redis.UniversalClient

	if app.Specs.Session.RedisURL != "" {
		app.Logger().Debug().Str("redis_url", app.Specs.Session.RedisURL).Msg("Using Redis")
		opts, err := redis.ParseURL(app.Specs.Session.RedisURL)
		if err != nil {
			app.Logger().Panic().Err(err).Msg("failed to parse Redis URL")
		}
		client = redis.NewClient(opts)
	} else if len(app.Specs.Session.RedisCluster) > 0 {
		app.Logger().Debug().
			Strs("redis_cluster", app.Specs.Session.RedisCluster).Msg("Using Redis Cluster")

		client = redis.NewClusterClient(&redis.ClusterOptions{
			Addrs:    app.Specs.Session.RedisCluster,
			Username: app.Specs.Session.RedisClusterUsername,
			Password: app.Specs.Session.RedisClusterPassword,
		})
	} else {
		app.Logger().Warn().Msg("Redis URL not provided")
		return nil, errors.New("no redis config")
	}

	store, err := redisstore.NewRedisStore(context.Background(), client)
	if err != nil {
		app.Logger().Panic().Err(err).Msg("failed to create Redis store")
	}

	store.KeyPrefix(app.Specs.Session.CookieName)
	// prepare key generator for session
	store.KeyGen(func() (string, error) {
		u, err := uuid.NewV7()
		if err != nil {
			return "", err
		}
		return u.String(), nil
	})
	store.Options(sessions.Options{
		Path:   "/",
		Secure: !app.Specs.Session.InsecureCookies,
		MaxAge: 86400, // a day
	})

	return store, nil
}

func (app *AppConfig) tryInMemoryStore() (sessions.Store, error) {
	store := memstore.NewMemStore(
		[]byte("authkey123"),
		[]byte("enckey12341234567890123456789012"),
	)
	store.Options.Path = "/"
	store.Options.Secure = !app.Specs.Session.InsecureCookies
	store.Options.MaxAge = int(24 * time.Hour.Seconds())

	return store, nil
}
