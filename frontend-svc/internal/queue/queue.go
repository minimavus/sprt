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

const (
	queueClientName = "SPRT Frontend Service"
)

func NewQueueClient(app shared.LogDB, cfg specs.QueueSpecs) (*QueueClient, error) {
	nc, err := nats.Connect(cfg.Nats.URL, setupOptions(app, cfg)...)
	if err != nil {
		return nil, err
	}

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
	q.app.Logger().Debug().Str("job", string(j)).Msg("Publishing generate job")
	return q.nc.Publish(q.cfg.GenerateQueue, j)
}

func setupOptions(l shared.Logger, cfg specs.QueueSpecs) []nats.Option {
	totalWait := cfg.Nats.TotalWait
	maxReconnects := int(totalWait / cfg.Nats.ReconnectWait)

	opts := []nats.Option{
		nats.Name(queueClientName),
		nats.MaxReconnects(maxReconnects),
		nats.ReconnectWait(cfg.Nats.ReconnectWait),
		nats.Timeout(cfg.Nats.Timeout),
		nats.ConnectHandler(func(nc *nats.Conn) {
			l.Logger().Info().
				Str("url", nc.ConnectedUrl()).
				Str("server_name", nc.ConnectedServerName()).
				Str("server_version", nc.ConnectedServerVersion()).
				Bool("tls", nc.TLSRequired()).
				Msg("Connected to NATS service")
		}),
		nats.DisconnectErrHandler(func(_ *nats.Conn, err error) {
			l.Logger().Warn().Dur("total_wait", totalWait).Err(err).Msg("Disconnected from NATS service")
		}),
		nats.ReconnectHandler(func(nc *nats.Conn) {
			l.Logger().Info().Str("url", nc.ConnectedUrl()).Msg("Reconnected to NATS service")
		}),
		nats.ClosedHandler(func(nc *nats.Conn) {
			l.Logger().Info().Err(nc.LastError()).Msg("Closed connection to NATS service")
		}),
	}

	return opts
}
