package service

import (
	"github.com/rs/zerolog"

	"github.com/cisco-open/sprt/go-generator/sdk/app"
	"github.com/cisco-open/sprt/go-generator/sdk/logger"
)

var _ (app.Logger) = (*Service)(nil)

func (s *Service) buildLogger() *Service {
	s.l = logger.BuildLoggerForService(s, "generator")
	return s
}

func (s *Service) Logger() *zerolog.Logger {
	return s.l
}
