package queue

import (
	"context"

	"github.com/cisco-open/sprt/go-generator/sdk/rpc"
)

func (q *QueueClient) GetRunningJobsOfGenerator(ctx context.Context, generatorID string) ([]rpc.RPCJob, error) {
	q.app.Logger().Debug().Str("generator", generatorID).Msg("Getting running jobs of generator")

	reqBytes, err := rpc.Request(rpc.RPCMethodGetRunningJobs).ID(q.nextMsgID()).Bytes()
	if err != nil {
		return nil, err
	}

	resp, err := q.nc.RequestWithContext(ctx, q.getGeneratorQueue(generatorID), reqBytes)
	if err != nil {
		return nil, err
	}

	q.app.Logger().Debug().Str("generator", generatorID).Msg("Got running jobs of generator")

	jrpcResp, err := rpc.DecodeJSONRPCResponse(resp.Data)
	if err != nil {
		return nil, err
	}

	jobsResponse, err := rpc.GetJSONRPCResult[rpc.RPCGetRunningJobsResponseParams](jrpcResp, q.app.Logger())
	if err != nil {
		q.app.Logger().Error().Err(err).Str("generator", generatorID).Msg("Failed to get running jobs of generator")
		return nil, err
	}

	return jobsResponse.Jobs, nil
}

func (q *QueueClient) GetRunningJobs(ctx context.Context) ([]rpc.RPCJob, error) {
	jobs, err := forAllGenerators(ctx, q, q.GetRunningJobsOfGenerator)
	if err != nil {
		return nil, err
	}

	return jobs, nil
}

func (q *QueueClient) StopJob(ctx context.Context, generatorID, jobID, user string) (bool, error) {
	q.app.Logger().Debug().
		Str("generator", generatorID).
		Str("job", jobID).
		Str("user", user).
		Msg("Stopping job")

	params := rpc.RPCStopJobParams{
		JobID: jobID,
		User:  user,
	}

	reqBytes, err := rpc.Request(rpc.RPCMethodStopJob).ID(q.nextMsgID()).Params(params).Bytes()
	if err != nil {
		return false, err
	}

	resp, err := q.nc.RequestWithContext(ctx, q.getGeneratorQueue(generatorID), reqBytes)
	if err != nil {
		return false, err
	}

	q.app.Logger().Debug().
		Str("generator", generatorID).
		Str("job", jobID).
		Str("user", user).
		Msg("Stopped job")

	jrpcResp, err := rpc.DecodeJSONRPCResponse(resp.Data)
	if err != nil {
		return false, err
	}

	jobResponse, err := rpc.GetJSONRPCResult[rpc.RPCStopJobResponseParams](jrpcResp, q.app.Logger())
	if err != nil {
		q.app.Logger().Error().Err(err).
			Str("generator", generatorID).
			Str("job", jobID).
			Str("user", user).
			Msg("Failed to get stop job response")
		return false, err
	}

	return jobResponse.Success, nil
}

func (q *QueueClient) GetScheduledJobsOfGenerator(ctx context.Context, generatorID string) ([]rpc.RPCScheduledJob, error) {
	q.app.Logger().Debug().Str("generator", generatorID).Msg("Getting scheduled jobs of generator")

	reqBytes, err := rpc.Request(rpc.RPCMethodGetScheduledJobs).ID(q.nextMsgID()).Bytes()
	if err != nil {
		return nil, err
	}

	resp, err := q.nc.RequestWithContext(ctx, q.getGeneratorQueue(generatorID), reqBytes)
	if err != nil {
		return nil, err
	}

	q.app.Logger().Debug().Str("generator", generatorID).Msg("Got scheduled jobs of generator")

	jrpcResp, err := rpc.DecodeJSONRPCResponse(resp.Data)
	if err != nil {
		return nil, err
	}

	jobsResponse, err := rpc.GetJSONRPCResult[rpc.RPCGetScheduledJobsResponseParams](jrpcResp, q.app.Logger())
	if err != nil {
		q.app.Logger().Error().Err(err).Str("generator", generatorID).Msg("Failed to get scheduled jobs of generator")
		return nil, err
	}

	return jobsResponse.Jobs, nil
}

func (q *QueueClient) GetScheduledJobs(ctx context.Context) ([]rpc.RPCScheduledJob, error) {
	jobs, err := forAllGenerators(ctx, q, q.GetScheduledJobsOfGenerator)
	if err != nil {
		return nil, err
	}

	return jobs, nil
}

func (q *QueueClient) DeleteScheduledJob(ctx context.Context, generatorID, jobID, user string) (bool, error) {
	q.app.Logger().Debug().
		Str("generator", generatorID).
		Str("job", jobID).
		Str("user", user).
		Msg("Deleting scheduled job")

	params := rpc.RPCDeleteScheduledJobParams{
		JobID: jobID,
		User:  user,
	}

	reqBytes, err := rpc.Request(rpc.RPCMethodDeleteScheduledJob).ID(q.nextMsgID()).Params(params).Bytes()
	if err != nil {
		return false, err
	}

	resp, err := q.nc.RequestWithContext(ctx, q.getGeneratorQueue(generatorID), reqBytes)
	if err != nil {
		return false, err
	}

	q.app.Logger().Debug().
		Str("generator", generatorID).
		Str("job", jobID).
		Str("user", user).
		Msg("Deleted scheduled job")

	jrpcResp, err := rpc.DecodeJSONRPCResponse(resp.Data)
	if err != nil {
		return false, err
	}

	jobResponse, err := rpc.GetJSONRPCResult[rpc.RPCDeleteScheduledJobResponseParams](jrpcResp, q.app.Logger())
	if err != nil {
		q.app.Logger().Error().Err(err).
			Str("generator", generatorID).
			Str("job", jobID).
			Str("user", user).
			Msg("Failed to get delete scheduled job response")
		return false, err
	}

	return jobResponse.Success, nil
}
