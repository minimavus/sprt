package config

import (
	"os"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	"github.com/rs/zerolog/pkgerrors"

	"github.com/cisco-open/sprt/go-generator/sdk/app"
)

var _ app.Logger = (*AppConfig)(nil)

func (app *AppConfig) buildLogger() *AppConfig {
	// preparing logger
	zerolog.TimeFieldFormat = zerolog.TimeFormatUnix
	zerolog.ErrorStackMarshaler = pkgerrors.MarshalStack
	zerolog.ErrorFieldName = "err"

	var l zerolog.Logger
	if app.InProduction() {
		// pure JSON
		l = zerolog.New(os.Stderr).
			With().Timestamp().
			Logger().Level(zerolog.InfoLevel)

		zerolog.SetGlobalLevel(zerolog.InfoLevel)
	} else {
		// with colored output
		l = zerolog.New(zerolog.ConsoleWriter{Out: os.Stderr}).
			With().Timestamp().Caller().
			Logger().Level(zerolog.DebugLevel)
		l.Debug().Msg("Starting app with DEBUGs enabled")

		log.Logger = zerolog.New(zerolog.ConsoleWriter{Out: os.Stderr}).
			With().Timestamp().Caller().
			Logger().Level(zerolog.DebugLevel)
	}

	l = l.With().Str("service", "frontend").Logger()

	app.l = &l
	return app
}

func (app *AppConfig) Logger() *zerolog.Logger {
	return app.l
}
