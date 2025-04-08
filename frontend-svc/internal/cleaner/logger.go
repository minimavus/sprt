package cleaner

import (
	"github.com/go-co-op/gocron/v2"
	"github.com/rs/zerolog"
)

type cronLogger struct{ *zerolog.Logger }

var _ gocron.Logger = (*cronLogger)(nil)

func (l *cronLogger) Debug(msg string, args ...any) {
	l.Logger.Debug().Msgf(msg, args...)
}

func (l *cronLogger) Error(msg string, args ...any) {
	l.Logger.Error().Msgf(msg, args...)
}

func (l *cronLogger) Info(msg string, args ...any) {
	l.Logger.Info().Msgf(msg, args...)
}

func (l *cronLogger) Warn(msg string, args ...any) {
	l.Logger.Warn().Msgf(msg, args...)
}
