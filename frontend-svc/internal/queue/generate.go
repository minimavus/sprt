package queue

import (
	"context"
	j "encoding/json"

	"github.com/cisco-open/sprt/frontend-svc/internal/auth"
	"github.com/cisco-open/sprt/go-generator/sdk/rpc"
)

func (q *QueueClient) PublishGenerateJob(ctx context.Context, job j.RawMessage, u *auth.ExtendedUserData) (string, error) {
	q.app.Logger().Debug().Str("job", string(job)).Msg("Publishing generate job")

	p := rpc.RPCGenerateParams{
		Job:  job,
		User: u.ForUser,
	}

	reqBytes, err := rpc.Request(rpc.RPCMethodGenerate).ID(q.nextMsgID()).Params(p).Bytes()
	if err != nil {
		return "", err
	}

	resp, err := q.nc.RequestWithContext(ctx, q.cfg.GenerateQueue, reqBytes)
	if err != nil {
		return "", err
	}

	jrpcResp, err := rpc.DecodeJSONRPCResponse(resp.Data)
	if err != nil {
		return "", err
	}

	jobResponse, err := rpc.GetJSONRPCResult[rpc.RPCGenerateResponseParams](jrpcResp, q.app.Logger())
	if err != nil {
		q.app.Logger().Error().Err(err).Str("generator", jobResponse.GeneratorID).Msg("Failed to publish generate job")
		return "", err
	}

	return jobResponse.JobID, nil
}
