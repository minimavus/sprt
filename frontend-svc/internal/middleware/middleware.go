package middleware

import (
	"time"

	"github.com/cisco-open/sprt/frontend-svc/internal/config"
	"github.com/labstack/echo-contrib/pprof"
	"github.com/labstack/echo-contrib/session"
	"github.com/labstack/echo/v4"
	em "github.com/labstack/echo/v4/middleware"
	"github.com/oklog/ulid/v2"
)

var repo *repository

type repository struct {
	App *config.AppConfig

	authPaths []string
}

func NewMiddlewares(a *config.AppConfig) {
	repo = &repository{
		App: a,
	}

	authProviders = &authProvidersMap{
		duoAuthProvider:    NewDuoProvider(a),
		singleAuthProvider: NewSingleProvider(a),
	}
}

func InitDefaultMiddlewares(e *echo.Echo) {
	repo.initDefaultMiddlewares(e)
}

// InitDefaultMiddlewares adds default middlewares to Echo server
func (repo *repository) initDefaultMiddlewares(e *echo.Echo) {
	e.Use(em.Recover())
	e.Use(em.GzipWithConfig(em.GzipConfig{Skipper: nil, Level: 6}))
	e.Use(em.RequestIDWithConfig(em.RequestIDConfig{
		Generator: func() string {
			return ulid.Make().String()
		},
	}))
	e.Use(em.RemoveTrailingSlash())
	e.Use(LegacyLogsChunk())
	e.Use(em.RequestLoggerWithConfig(em.RequestLoggerConfig{
		LogURI:       true,
		LogStatus:    true,
		LogLatency:   true,
		LogMethod:    true,
		LogRemoteIP:  true,
		LogUserAgent: true,
		LogRequestID: true,
		LogRoutePath: true,
		LogValuesFunc: func(c echo.Context, v em.RequestLoggerValues) error {
			repo.App.Logger().Info().
				Str("uri", v.URI).
				Str("method", v.Method).
				Int("status", v.Status).
				Str("ip", v.RemoteIP).
				Str("agent", v.UserAgent).
				Str("request_id", v.RequestID).
				Str("path", v.RoutePath).
				Int64("dur_ms", int64(v.Latency/time.Millisecond)).
				Send()

			return nil
		},
	}))
	e.Use(session.Middleware(repo.App.SessionStore))
	e.Use(Serve())
	e.Use(MultiBind())

	e.Use(ApiAuth())
	if repo.App.Specs.Auth.Enabled {
		e.Use(CustomAuth(CustomAuthConfig{}))
	}
	e.Use(QueryUser("user"))

	if !repo.App.InProduction() || (repo.App.InProduction() && repo.App.Specs.Server.WithPprof) {
		repo.App.Logger().Info().Msg("Adding pprof middleware, available at /debug/pprof/")
		pprof.Register(e)
	}
}
