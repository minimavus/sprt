package queue

import (
	"fmt"
	"sync/atomic"

	"github.com/nats-io/nats.go"
	"github.com/sourcegraph/jsonrpc2"

	"github.com/cisco-open/sprt/go-generator/sdk/app"
	"github.com/cisco-open/sprt/go-generator/sdk/queue"
	"github.com/cisco-open/sprt/go-generator/sdk/rpc"
	"github.com/cisco-open/sprt/go-generator/specs"
)

type QueueClient struct {
	app app.App
	nc  *nats.Conn
	cfg specs.QueueSpecs

	msgCounter atomic.Uint64

	m *rpc.RPCMethodsMap
}

func NewQueueClient(app app.App, cfg specs.QueueSpecs) (*QueueClient, error) {
	nc, err := nats.Connect(cfg.Nats.URL, setupOptions(app, cfg)...)
	if err != nil {
		return nil, err
	}

	return &QueueClient{
		app: app,
		nc:  nc,
		cfg: cfg,
		m:   rpc.MethodsMap(app.Logger()),
	}, nil
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

func setupOptions(l app.Logger, cfg specs.QueueSpecs) []nats.Option {
	totalWait := cfg.Nats.TotalWait
	maxReconnects := int(totalWait / cfg.Nats.ReconnectWait)

	opts := []nats.Option{
		nats.Name(string(queue.QueueClientNameFrontend)),
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
	}

	return opts
}

func (q *QueueClient) SetupReconnectHandler() {
	q.nc.SetReconnectHandler(func(nc *nats.Conn) {
		q.app.Logger().Info().Str("url", nc.ConnectedUrl()).Msg("Reconnected to NATS service")

		if err := q.SubscribeForNewGeneratorNotification(); err != nil {
			q.app.Logger().Error().Err(err).Msg("Failed to subscribe for new generator notification after reconnect")
		}
	})
}

func (q *QueueClient) nextMsgID() jsonrpc2.ID {
	return jsonrpc2.ID{
		Str: fmt.Sprintf("%s-%d", q.app.ID(), q.msgCounter.Add(1)),
	}
}
func (q *QueueClient) notificationControlQueue() string {
	return queue.NotificationSubQueue(q.cfg.ControlQueue)
}
