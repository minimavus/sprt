package queue

import (
	j "encoding/json"

	"github.com/cisco-open/sprt/frontend-svc/internal/auth"
	"github.com/cisco-open/sprt/go-generator/sdk/json"
	"github.com/cisco-open/sprt/go-generator/sdk/rpc"
	"github.com/cisco-open/sprt/go-generator/sdk/utils"
	"github.com/sourcegraph/jsonrpc2"
)

func (q *QueueClient) PublishGenerateJob(job j.RawMessage, u *auth.ExtendedUserData) error {
	q.app.Logger().Debug().Str("job", string(job)).Msg("Publishing generate job")

	p := rpc.RPCGenerateParams{
		Job:  job,
		User: u.ForUser,
	}

	paramsBytes, err := json.Marshal(p)
	if err != nil {
		return err
	}

	req := jsonrpc2.Request{
		Method: string(rpc.RPCMethodGenerate),
		Params: utils.PtrOf(j.RawMessage(paramsBytes)),
	}

	reqBytes, err := json.Marshal(req)
	if err != nil {
		return err
	}

	return q.nc.Publish(q.cfg.GenerateQueue, reqBytes)
}
