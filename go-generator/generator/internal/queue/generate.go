package queue

import (
	"context"
	"fmt"

	"github.com/cisco-open/sprt/go-generator/sdk/iputils"
	"github.com/cisco-open/sprt/go-generator/sdk/rpc"
	"github.com/cisco-open/sprt/go-generator/sdk/utils"
	"github.com/google/uuid"
	"github.com/nats-io/nats.go"
	"github.com/sourcegraph/jsonrpc2"
)

func (q *QueueClient) ListenForGenerateJobs() error {
	sub, err := q.Subscribe(q.cfg.GenerateQueue, q.onGenerateJob)
	if err != nil {
		return err
	}

	q.subs[q.cfg.GenerateQueue] = sub

	q.m.On(q.cfg.GenerateQueue, rpc.RPCMethodGenerate, q.GenerateJob, &rpc.RPCGenerateParams{})

	return nil
}

func (q *QueueClient) onGenerateJob(msg *nats.Msg) {
	q.app.Logger().Debug().Str("subject", msg.Subject).Msg("Received generate job")

	resp, err := q.m.Handle(q.app.Ctx(), q.cfg.GenerateQueue, msg.Data)
	if err := q.handleAndPublish(msg, resp, err); err != nil {
		q.app.Logger().Error().Err(err).Msg("Failed to handle and publish generate job response")
	}
}

func (q *QueueClient) GenerateJob(_ context.Context, req *jsonrpc2.Request, data any) (*jsonrpc2.Response, error) {
	params, ok := data.(*rpc.RPCGenerateParams)
	if !ok {
		return nil, fmt.Errorf("expected *rpc.RPCGenerateParams, got %T", data)
	}

	q.app.Logger().Debug().Str("user", params.User).Interface("source", params.Source).Msg("Processing generate job request")

	isMyIP, err := q.isMyIP(params.Source)
	if err != nil {
		q.app.Logger().Error().Err(err).Msg("Failed to check if IP is mine")
		return nil, err
	}

	if !isMyIP {
		q.app.Logger().Debug().Str("user", params.User).Msg("Generate job request is not for me")
		return nil, nil
	}

	q.app.Logger().Debug().Interface("source", params.Source).Str("user", params.User).Msg("Generate job request is for me")
	jobID, err := uuid.NewV7()
	if err != nil {
		return nil, err
	}

	if req.Notif {
		q.app.Logger().Debug().Str("user", params.User).Msg("Generate job request is notification")
		return nil, nil
	}

	response := rpc.RPCGenerateResponseParams{
		JobID:       jobID.String(),
		GeneratorID: q.app.ID(),
	}

	return utils.PtrOf(rpc.Response(req.ID).Result(response).Build()), nil
}

func (q *QueueClient) isMyIP(provided iputils.Source) (bool, error) {
	sources, err := iputils.GetAvailableIPSources(q.app.Logger())
	if err != nil {
		return false, err
	}

	for _, source := range sources {
		if provided.Address == source.Address {
			if provided.Interface == "" || provided.Interface == source.Interface {
				return true, nil
			}
		}
	}

	return false, nil
}
