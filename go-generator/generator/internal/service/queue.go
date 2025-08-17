package service

import (
	"fmt"

	"github.com/cisco-open/sprt/go-generator/generator/internal/queue"
)

func (s *Service) mustInitQueue() *Service {
	g, err := queue.NewQueueClient(s, s.Specs.Queue)
	if err != nil {
		panic(fmt.Errorf("init generator: %w", err))
	}

	s.q = g
	return s
}

func (s *Service) Queue() *queue.QueueClient {
	return s.q
}

func (s *Service) StartListeningOnQueues() error {
	s.Logger().Debug().Msg("Listening for generate jobs")
	if err := s.q.ListenForGenerateJobs(); err != nil {
		return err
	}

	s.Logger().Debug().Msg("Listening for control messages")
	return s.q.SubscribeForControlMessages()
}
