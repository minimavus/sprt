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

func (app *AppConfig) StartListeningOnQueues() error {
	app.Logger().Debug().Msg("Listening for generate jobs")
	if err := app.queue.SubscribeForNewGeneratorNotification(); err != nil {
		return err
	}

	app.queue.SetupReconnectHandler()

	return nil
}
