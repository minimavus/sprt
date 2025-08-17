package queue

import (
	"context"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/cisco-open/sprt/go-generator/sdk/conc"
	"github.com/cisco-open/sprt/go-generator/sdk/json"
	"github.com/cisco-open/sprt/go-generator/sdk/queue"
	"github.com/cisco-open/sprt/go-generator/sdk/rpc"
	"github.com/sourcegraph/jsonrpc2"
)

type connection struct {
	Name string `json:"name"`
	CID  int    `json:"cid"`
}

type connz struct {
	Connections []connection `json:"connections"`
}

func (q *QueueClient) GetGenerators(ctx context.Context) ([]string, error) {
	cl := http.Client{
		Timeout: 10 * time.Second,
	}
	defer cl.CloseIdleConnections()

	url, err := q.getMngURL("/connz")
	if err != nil {
		return nil, err
	}

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

func (q *QueueClient) GetRunningJobsOfGenerator(ctx context.Context, generatorID string) ([]rpc.RPCJob, error) {
	q.app.Logger().Debug().Str("generator", generatorID).Msg("Getting running jobs of generator")

	req := jsonrpc2.Request{
		Method: string(rpc.RPCMethodGetRunningJobs),
		ID:     q.nextMsgID(),
	}

	reqBytes, err := json.Marshal(req)
	if err != nil {
		return nil, err
	}

	resp, err := q.nc.RequestWithContext(ctx, q.getGeneratorQueue(generatorID), reqBytes)
	if err != nil {
		return nil, err
	}

	q.app.Logger().Debug().Str("generator", generatorID).Msg("Got running jobs of generator")

	var jrpcResp jsonrpc2.Response
	if err := json.Unmarshal(resp.Data, &jrpcResp); err != nil {
		return nil, err
	}

	if jrpcResp.Error != nil {
		q.app.Logger().Error().
			Str("error", jrpcResp.Error.Message).
			Int64("code", jrpcResp.Error.Code).
			Interface("data", jrpcResp.Error.Data).
			Msg("Failed to get running jobs of generator")
		return nil, fmt.Errorf("failed to get running jobs of generator: %s", jrpcResp.Error.Message)
	}

	if jrpcResp.Result == nil {
		q.app.Logger().Error().Str("generator", generatorID).Msg("Got empty response from generator")
		return nil, fmt.Errorf("got empty response from generator")
	}

	var jobsResponse rpc.RPCGetRunningJobsResponseParams
	if err := json.Unmarshal(*jrpcResp.Result, &jobsResponse); err != nil {
		return nil, err
	}

	return jobsResponse.Jobs, nil
}

func (q *QueueClient) GetRunningJobs(ctx context.Context) ([]rpc.RPCJob, error) {
	generators, err := q.GetGenerators(ctx)
	if err != nil {
		return nil, err
	}

	q.app.Logger().Debug().Strs("generators", generators).Msg("Found generators")

	pool := conc.NewResultPoolWithMaxGoroutines[[]rpc.RPCJob](ctx, len(generators))

	for _, generatorID := range generators {
		pool.Go(func(ctx context.Context) ([]rpc.RPCJob, error) {
			return q.GetRunningJobsOfGenerator(ctx, generatorID)
		})
	}

	t, err := pool.Wait()
	if err != nil {
		return nil, err
	}

	var jobs []rpc.RPCJob
	for _, v := range t {
		if v == nil {
			continue
		}
		jobs = append(jobs, v...)
	}

	return jobs, nil
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
