package queue

import (
	"github.com/nats-io/nats.go"

	"github.com/cisco-open/sprt/frontend-svc/shared"
	"github.com/cisco-open/sprt/go-generator/specs"
)

type QueueClient struct {
	app shared.LogDB
	nc  *nats.Conn
	cfg specs.QueueSpecs
}

func NewQueueClient(app shared.LogDB, cfg specs.QueueSpecs) (*QueueClient, error) {
	nc, err := nats.Connect(cfg.Nats.URL)
	if err != nil {
		return nil, err
	}

	app.Logger().Info().Str("url", cfg.Nats.URL).Msg("Connected to NATS")

	return &QueueClient{app, nc, cfg}, nil
}

func (q *QueueClient) Close() {
	q.nc.Close()
}

func (q *QueueClient) Statistics() nats.Statistics {
	return q.nc.Stats()
}

func (q *QueueClient) Status() string {
	return q.nc.Status().String()
}

func (q *QueueClient) PublishGenerateJob(j []byte) error {
	q.app.Logger().Debug().Interface("job", j).Msg("Publishing generate job")
	return q.nc.Publish(q.cfg.GenerateQueue, j)
}
