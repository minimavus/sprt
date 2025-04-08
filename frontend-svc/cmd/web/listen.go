package main

import (
	"errors"

	"github.com/cisco-open/sprt/frontend-svc/internal/config"
	"github.com/labstack/echo/v4"
	"github.com/pexip/go-openssl"
)

// listenHTTPS starts HTTPS (TLS) server
func listenHTTPS(app *config.AppConfig, e *echo.Echo, listen string) error {
	if app.Specs.Server.Certificate == "" {
		panic(errors.New("certificate file not provided for TLS"))
	}

	if app.Specs.Server.PrivateKey == "" {
		panic(errors.New("private key file not provided for TLS"))
	}

	app.Logger().Debug().Msgf("Starting HTTPS server on %s", listen)
	// return e.StartTLS(listen, app.Specs.Server.Certificate, app.Specs.Server.PrivateKey)
	return openssl.ListenAndServeTLS(listen, app.Specs.Server.Certificate, app.Specs.Server.PrivateKey, e)
}

// listenHTTP starts HTTP (insecure) server
func listenHTTP(app *config.AppConfig, e *echo.Echo, listen string) error {
	app.Logger().Debug().Msgf("Starting HTTP server on %s", listen)
	return e.Start(listen)
}
