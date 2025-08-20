package queue

import (
	"context"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/cisco-open/sprt/go-generator/sdk/json"
	"github.com/cisco-open/sprt/go-generator/sdk/queue"
	"github.com/cisco-open/sprt/go-generator/sdk/rpc"
	"github.com/nats-io/nats.go"
	"github.com/sourcegraph/jsonrpc2"
)

type (
	connection struct {
		Name string `json:"name"`
		CID  int    `json:"cid"`
	}

	connz struct {
		Connections []connection `json:"connections"`
	}
)

func (q *QueueClient) GetGenerators(ctx context.Context) ([]string, error) {
	cl := http.Client{
		Timeout: 10 * time.Second,
	}
	defer cl.CloseIdleConnections()

	url, err := q.getMngURL("/connz")
	if err != nil {
		return nil, err
	}

	// TODO: add support for auth
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}

	resp, err := cl.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var c connz
	if err := json.NewDecoder(resp.Body).Decode(&c); err != nil {
		return nil, err
	}

	var generators []string

	for _, v := range c.Connections {
		if id, ok := strings.CutPrefix(v.Name, string(queue.QueueClientNameGenerator)+"/"); ok {
			generators = append(generators, id)
		}
	}

	return generators, nil
}

func (q *QueueClient) SubscribeForNewGeneratorNotification() error {
	q.app.Logger().Debug().Msg("Subscribing for new generator notification")

	_, err := q.nc.Subscribe(q.notificationControlQueue(), q.onNewGeneratorNotification)
	if err != nil {
		return err
	}

	q.m.On(q.notificationControlQueue(), rpc.RPCMethodNewGeneratorNotification, q.RegisterNewGenerator, &rpc.RPCNewGeneratorNotificationParams{})

	return nil
}

func (q *QueueClient) onNewGeneratorNotification(msg *nats.Msg) {
	q.app.Logger().Debug().Str("subject", msg.Subject).Msg("Received new generator notification")

	_, err := q.m.Handle(q.app.Ctx(), q.notificationControlQueue(), msg.Data)
	if err != nil {
		q.app.Logger().Error().Err(err).Msg("Failed to handle new generator notification")
	}
}

func (q *QueueClient) RegisterNewGenerator(_ context.Context, _ *jsonrpc2.Request, data any) (*jsonrpc2.Response, error) {
	params, ok := data.(*rpc.RPCNewGeneratorNotificationParams)
	if !ok {
		return nil, fmt.Errorf("expected *rpc.RPCNewGeneratorNotificationParams, got %T", data)
	}

	q.app.Logger().Debug().Str("generator_id", params.GeneratorID).Msg("TODO: Registering new generator")

	return nil, nil
}

func (q *QueueClient) getMngURL(path string) (string, error) {
	u, err := url.Parse(q.cfg.Nats.ManagementURL)
	if err != nil {
		return "", err
	}
	u.Path = path
	return u.String(), nil
}

func (q *QueueClient) getGeneratorQueue(generatorID string) string {
	return fmt.Sprintf("%s.%s", q.cfg.ControlQueue, generatorID)
}
