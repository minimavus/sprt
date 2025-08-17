package queue

import (
	"github.com/cisco-open/sprt/go-generator/sdk/json"
	"github.com/cisco-open/sprt/go-generator/sdk/rpc"
	"github.com/nats-io/nats.go"
	"github.com/sourcegraph/jsonrpc2"
)

func (q *QueueClient) ListenForGenerateJobs() error {
	sub, err := q.Subscribe(q.cfg.GenerateQueue, q.onGenerateJob)
	if err != nil {
		return err
	}

	q.subs[q.cfg.GenerateQueue] = sub

	return nil
}

func (q *QueueClient) onGenerateJob(msg *nats.Msg) {
	q.app.Logger().Debug().Str("subject", msg.Subject).Msg("Received generate job")

	var req jsonrpc2.Request
	if err := json.Unmarshal(msg.Data, &req); err != nil {
		q.app.Logger().Error().Err(err).Msg("Failed to unmarshal generate job")
		return
	}

	if req.Method != string(rpc.RPCMethodGenerate) {
		q.app.Logger().Error().Str("method", req.Method).Msg("Invalid method for generate job")
		return
	}

	if req.Params == nil {
		q.app.Logger().Error().Msg("Generate job params is nil")
		return
	}

	var params rpc.RPCGenerateParams
	if err := json.Unmarshal(*req.Params, &params); err != nil {
		q.app.Logger().Error().Err(err).Msg("Failed to unmarshal generate job params")
		return
	}

	q.app.Logger().Debug().Str("user", params.User).Msg("Processing generate job")
}
