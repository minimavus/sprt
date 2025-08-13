package config

import (
	"fmt"

	"github.com/cisco-open/sprt/frontend-svc/internal/queue"
)

func (app *AppConfig) mustInitQueue() *AppConfig {
	g, err := queue.NewQueueClient(app, app.Specs.Queue)
	if err != nil {
		panic(fmt.Errorf("init generator: %w", err))
	}

	app.queue = g
	return app
}

func (app *AppConfig) Queue() *queue.QueueClient {
	return app.queue
}
