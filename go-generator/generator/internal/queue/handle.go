package queue

import (
	"github.com/cisco-open/sprt/go-generator/sdk/rpc"
	"github.com/nats-io/nats.go"
	"github.com/sourcegraph/jsonrpc2"
)

func (q *QueueClient) handleAndPublish(msg *nats.Msg, resp *jsonrpc2.Response, err *jsonrpc2.Error) error {
	if resp == nil && err == nil {
		q.app.Logger().Debug().Msg("Received empty response and error, skipping publish")
		return nil
	}

	var responseBytes []byte

	if err != nil {
		rb, err := rpc.BuildResponseFromError(err).Bytes()
		if err != nil {
			q.app.Logger().Error().Err(err).Msg("Failed to marshal response error")
		}
		responseBytes = rb
	} else {
		rb, err := rpc.BuildFromResponse(resp).Bytes()
		if err != nil {
			q.app.Logger().Error().Err(err).Msg("Failed to marshal response result")
		}
		responseBytes = rb
	}

	return q.Publish(msg.Reply, responseBytes)
}
