package queue

import (
	"fmt"
	"sync/atomic"

	"github.com/nats-io/nats.go"

	"github.com/cisco-open/sprt/go-generator/sdk/app"
	"github.com/cisco-open/sprt/go-generator/sdk/queue"
	"github.com/cisco-open/sprt/go-generator/sdk/rpc"
	"github.com/cisco-open/sprt/go-generator/specs"
)

type QueueClient struct {
	*nats.Conn

	app        app.App
	cfg        specs.QueueSpecs
	msgCounter atomic.Uint64

	subs map[string]*nats.Subscription

	m *rpc.RPCMethodsMap
}

func NewQueueClient(app app.App, cfg specs.QueueSpecs) (*QueueClient, error) {
	nc, err := nats.Connect(cfg.Nats.URL, setupOptions(app, cfg)...)
	if err != nil {
		return nil, err
	}

	return &QueueClient{
		Conn: nc,
		app:  app,
		cfg:  cfg,
		subs: make(map[string]*nats.Subscription),
		m:    rpc.MethodsMap(app.Logger()),
	}, nil
}

func setupOptions(l app.App, cfg specs.QueueSpecs) []nats.Option {
	totalWait := cfg.Nats.TotalWait
	maxReconnects := int(totalWait / cfg.Nats.ReconnectWait)

	opts := []nats.Option{
		nats.Name(string(queue.QueueClientNameGenerator) + "/" + l.ID()),
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
		nats.ClosedHandler(func(nc *nats.Conn) {
			l.Logger().Info().Err(nc.LastError()).Msg("Closed connection to NATS service")
		}),
		nats.ConnectHandler(func(nc *nats.Conn) {
			l.Logger().Debug().Str("url", nc.ConnectedUrl()).Msg("Connected to NATS service")
		}),
	}

	return opts
}

func (q *QueueClient) SetupReconnectHandler() {
	q.SetReconnectHandler(func(nc *nats.Conn) {
		q.app.Logger().Info().Str("url", nc.ConnectedUrl()).Msg("Reconnected to NATS service")

		if err := q.SubscribeForControlMessages(); err != nil {
			q.app.Logger().Error().Err(err).Msg("Failed to subscribe for control messages after reconnect")
		}

		if err := q.ListenForGenerateJobs(); err != nil {
			q.app.Logger().Error().Err(err).Msg("Failed to start listening for generate jobs after reconnect")
		}

		if err := q.PublishNewGeneratorNotification(q.app.ID()); err != nil {
			q.app.Logger().Error().Err(err).Msg("Failed to publish new generator notification after reconnect")
		}
	})
}

func (q *QueueClient) nextMsgID() string {
	return fmt.Sprintf("%s-%d", q.app.ID(), q.msgCounter.Add(1))
}
