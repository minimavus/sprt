package logger

import (
	"os"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	"github.com/rs/zerolog/pkgerrors"
)

type (
	InProdGetter interface {
		InProduction() bool
	}
)

func BuildLoggerForService(s InProdGetter, service string) *zerolog.Logger {
	// preparing logger
	zerolog.TimeFieldFormat = zerolog.TimeFormatUnix
	zerolog.ErrorStackMarshaler = pkgerrors.MarshalStack
	zerolog.ErrorFieldName = "err"

	var l zerolog.Logger
	if s.InProduction() {
		// pure JSON
		l = zerolog.New(os.Stderr).
			With().Timestamp().
			Logger().Level(zerolog.InfoLevel)

		zerolog.SetGlobalLevel(zerolog.InfoLevel)
	} else {
		// with colored output
		l = zerolog.New(zerolog.ConsoleWriter{
			Out:           os.Stderr,
			PartsOrder:    []string{"time", "level", "service", "caller", "message"},
			FieldsExclude: []string{"service"},
		}).
			With().Timestamp().Caller().
			Logger().Level(zerolog.DebugLevel)
		l.Debug().Str("service", service).Msg("Starting app with DEBUGs enabled")

		log.Logger = zerolog.New(zerolog.ConsoleWriter{
			Out: os.Stderr,
		}).
			With().Timestamp().Caller().
			Logger().Level(zerolog.DebugLevel)
	}

	l = l.With().Str("service", service).Logger()

	return &l
}
