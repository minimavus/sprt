package main

import (
	"context"
	"encoding/gob"
	"net"
	"net/http"

	"github.com/labstack/echo/v4"

	"github.com/cisco-open/sprt/frontend-svc/frontend"
	"github.com/cisco-open/sprt/frontend-svc/handlers"
	"github.com/cisco-open/sprt/frontend-svc/internal/auth"
	"github.com/cisco-open/sprt/frontend-svc/internal/config"
	"github.com/cisco-open/sprt/frontend-svc/internal/json_serializer"
	"github.com/cisco-open/sprt/frontend-svc/internal/middleware"
	"github.com/cisco-open/sprt/frontend-svc/internal/validator"

	_ "github.com/cisco-open/sprt/go-generator/generator/plugins_gen"
)

func main() {
	e, app := prepareApp()

	// Setup the API Group
	api := e.Group("/api")

	// Basic APi endpoint
	api.GET("/message", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{"message": "Hello, from the golang World!"})
	})

	listen := net.JoinHostPort("", app.Specs.Server.Port)

	var err error
	if app.Specs.Server.TLS {
		err = listenHTTPS(app, e, listen)
	} else {
		err = listenHTTP(app, e, listen)
	}

	if err != nil {
		app.Logger().Fatal().Stack().Err(err).Send()
	}
}

func prepareApp() (*echo.Echo, *config.AppConfig) {
	gob.Register(auth.UserData{})

	app := config.LoadConfig(context.Background())

	handlers.NewHandlers(app)
	middleware.NewMiddlewares(app)

	e := createServer(app)
	handlers.RegisterRoutes(app, e)
	frontend.Register(app, e)

	return e, app
}

func createServer(app *config.AppConfig) *echo.Echo {
	e := echo.New()

	middleware.InitDefaultMiddlewares(e)

	// e.File("/favicon.ico", path.Join(app.Specs.Server.Static, "icons/favicon-128.png"))
	// e.File("/favicon-32.png", path.Join(app.Specs.Server.Static, "icons/favicon-32.png"))
	// e.File("/favicon-128.png", path.Join(app.Specs.Server.Static, "icons/favicon-128.png"))
	// e.File("/favicon-192.png", path.Join(app.Specs.Server.Static, "icons/favicon-192.png"))
	// e.File("/favicon-228.png", path.Join(app.Specs.Server.Static, "icons/favicon-228.png"))

	if tm := app.Specs.Server.ReadTimeout; tm != 0 {
		app.Logger().Debug().Msgf("Applying read timeout of %s", tm.String())
		e.Server.ReadTimeout = tm
	}

	e.HideBanner = app.InProduction()
	e.JSONSerializer = &json_serializer.GoJSONSerializer{}
	e.Validator = validator.NewValidator()
	e.HTTPErrorHandler = middleware.NewErrorHandler(app)

	return e
}
