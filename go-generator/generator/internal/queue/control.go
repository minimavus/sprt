package queue

import (
	"fmt"

	"github.com/cisco-open/sprt/go-generator/sdk/json"
	"github.com/cisco-open/sprt/go-generator/sdk/rpc"
	"github.com/nats-io/nats.go"
	"github.com/sourcegraph/jsonrpc2"
)

func (q *QueueClient) SubscribeForControlMessages() error {
	sub, err := q.Subscribe(q.myControlQueue(), q.onControlMessage)
	if err != nil {
		return err
	}

	q.subs[q.myControlQueue()] = sub

	return nil
}

func (q *QueueClient) onControlMessage(msg *nats.Msg) {
	q.app.Logger().Debug().Str("subject", msg.Subject).Msg("Received control message")

	var req jsonrpc2.Request
	if err := json.Unmarshal(msg.Data, &req); err != nil {
		q.app.Logger().Error().Err(err).Msg("Failed to unmarshal control message")
		return
	}

	var responseBytes []byte
	var err error

	switch req.Method {
	case string(rpc.RPCMethodGetRunningJobs):
		responseBytes, err = q.GetRunningJobs(req.ID)
	default:
		err = fmt.Errorf("invalid method for control message: %s", req.Method)
		q.app.Logger().Error().Str("method", req.Method).Msg("Invalid method for control message")

		responseBytes, err = rpc.NewResponse(req.ID).Error(jsonrpc2.CodeMethodNotFound, err).Bytes()
		if err != nil {
			q.app.Logger().Error().Err(err).Msg("Failed to marshal response")
		}
		responseBytes = nil
	}

	q.Publish(msg.Reply, responseBytes)
}

func (q *QueueClient) GetRunningJobs(reqID jsonrpc2.ID) ([]byte, error) {
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

	return rpc.NewResponse(reqID).Result(resp).Bytes()
}

func (q *QueueClient) myControlQueue() string {
	return q.cfg.ControlQueue + "." + q.app.ID()
}
