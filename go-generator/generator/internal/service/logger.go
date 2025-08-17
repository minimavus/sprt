package service

import (
	"os"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	"github.com/rs/zerolog/pkgerrors"

	"github.com/cisco-open/sprt/go-generator/sdk/app"
)

var _ (app.Logger) = (*Service)(nil)

func (s *Service) buildLogger() *Service {
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
		l = zerolog.New(zerolog.ConsoleWriter{Out: os.Stderr}).
			With().Timestamp().Caller().
			Logger().Level(zerolog.DebugLevel)
		l.Debug().Msg("Starting app with DEBUGs enabled")

		log.Logger = zerolog.New(zerolog.ConsoleWriter{Out: os.Stderr}).
			With().Timestamp().Caller().
			Logger().Level(zerolog.DebugLevel)
	}

	l = l.With().Str("service", "generator").Logger()

	s.l = &l
	return s
}

func (s *Service) Logger() *zerolog.Logger {
	return s.l
}
