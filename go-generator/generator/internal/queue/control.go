package queue

import (
	j "encoding/json"
	"fmt"

	"github.com/cisco-open/sprt/go-generator/sdk/json"
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

		r := jsonrpc2.Response{
			ID:     req.ID,
			Error:  utils.PtrOf(jsonrpc2.Error{Code: jsonrpc2.CodeMethodNotFound, Message: err.Error()}),
			Result: nil,
		}

		responseBytes, err = json.Marshal(r)
		if err != nil {
			q.app.Logger().Error().Err(err).Msg("Failed to marshal response")
			return
		}
	}

	q.Publish(msg.Reply, responseBytes)
}

func (q *QueueClient) GetRunningJobs(reqID jsonrpc2.ID) ([]byte, error) {
	q.app.Logger().Debug().Msg("Getting running jobs")

	jobs := make([]rpc.RPCJob, 0)
	// TODO: implement getting running jobs

	resp := rpc.RPCGetRunningJobsResponseParams{
		Jobs: jobs,
	}

	respBytes, err := json.Marshal(resp)
	if err != nil {
		return nil, err
	}

	response := jsonrpc2.Response{
		ID:     reqID,
		Result: utils.PtrOf(j.RawMessage(respBytes)),
	}

	responseBytes, err := json.Marshal(response)
	if err != nil {
		return nil, err
	}

	return responseBytes, nil
}

func (q *QueueClient) myControlQueue() string {
	return q.cfg.ControlQueue + "." + q.app.ID()
}
