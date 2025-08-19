package queue

import (
	"context"
	"fmt"

	"github.com/cisco-open/sprt/go-generator/sdk/iputils"
	"github.com/cisco-open/sprt/go-generator/sdk/rpc"
	"github.com/cisco-open/sprt/go-generator/sdk/utils"
	"github.com/nats-io/nats.go"
	"github.com/sourcegraph/jsonrpc2"
)

func (q *QueueClient) SubscribeForControlMessages() error {
	sub, err := q.Subscribe(q.myControlQueue(), q.onControlMessage)
	if err != nil {
		return err
	}

	q.subs[q.myControlQueue()] = sub

	q.m.On(q.myControlQueue(), rpc.RPCMethodGetRunningJobs, q.GetRunningJobs, nil)
	q.m.On(q.myControlQueue(), rpc.RPCMethodStopJob, q.StopJob, &rpc.RPCStopJobParams{})
	q.m.On(q.myControlQueue(), rpc.RPCMethodGetIPSources, q.GetIPSources, nil)

	return nil
}

func (q *QueueClient) onControlMessage(msg *nats.Msg) {
	q.app.Logger().Debug().Str("subject", msg.Subject).Msg("Received control message")

	resp, err := q.m.Handle(q.app.Ctx(), q.myControlQueue(), msg.Data)
	if err := q.handleAndPublish(msg, resp, err); err != nil {
		q.app.Logger().Error().Err(err).Msg("Failed to handle and publish control message")
	}
}

func (q *QueueClient) GetRunningJobs(_ context.Context, req *jsonrpc2.Request, _ any) (*jsonrpc2.Response, error) {
	q.app.Logger().Debug().Msg("Getting running jobs")

	jobs := make([]rpc.RPCJob, 0)
	// TODO: implement getting running jobs

	jobs = append(jobs, rpc.RPCJob{
		ID:          "job1",
		Status:      "running",
		GeneratorID: q.app.ID(),
		Progress:    0.56,
		User:        "user1",
	})

	resp := rpc.RPCGetRunningJobsResponseParams{
		Jobs: jobs,
	}

	return utils.PtrOf(rpc.Response(req.ID).Result(resp).Build()), nil
}

func (q *QueueClient) StopJob(_ context.Context, req *jsonrpc2.Request, data any) (*jsonrpc2.Response, error) {
	params, ok := data.(*rpc.RPCStopJobParams)
	if !ok {
		return nil, fmt.Errorf("expected *rpc.RPCStopJobParams, got %T", data)
	}

	q.app.Logger().Debug().Str("job_id", params.JobID).Str("user", params.User).Msg("TODO: Stopping job")

	resp := rpc.RPCStopJobResponseParams{
		Success: true,
	}

	return utils.PtrOf(rpc.Response(req.ID).Result(resp).Build()), nil
}

func (q *QueueClient) GetIPSources(_ context.Context, req *jsonrpc2.Request, _ any) (*jsonrpc2.Response, error) {
	q.app.Logger().Debug().Msg("Getting IP sources")

	src, err := iputils.GetAvailableIPSources(q.app.Logger())
	if err != nil {
		return nil, err
	}

	resp := rpc.RPCGetIPSourcesResponseParams{
		Sources: src,
	}

	return utils.PtrOf(rpc.Response(req.ID).Result(resp).Build()), nil
}

func (q *QueueClient) myControlQueue() string {
	return q.cfg.ControlQueue + "." + q.app.ID()
}
