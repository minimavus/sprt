package queue

import (
	"context"

	"github.com/cisco-open/sprt/go-generator/sdk/iputils"
	"github.com/cisco-open/sprt/go-generator/sdk/rpc"
)

func (q *QueueClient) GetIPSourcesOfGenerator(ctx context.Context, generatorID string) ([]iputils.Source, error) {
	q.app.Logger().Debug().Str("generator", generatorID).Msg("Getting IP sources of generator")

	reqBytes, err := rpc.Request(rpc.RPCMethodGetIPSources).ID(q.nextMsgID()).Bytes()
	if err != nil {
		return nil, err
	}

	resp, err := q.nc.RequestWithContext(ctx, q.getGeneratorQueue(generatorID), reqBytes)
	if err != nil {
		return nil, err
	}

	q.app.Logger().Debug().Str("generator", generatorID).Msg("Got IP sources of generator")

	jrpcResp, err := rpc.DecodeJSONRPCResponse(resp.Data)
	if err != nil {
		return nil, err
	}

	response, err := rpc.GetJSONRPCResult[rpc.RPCGetIPSourcesResponseParams](jrpcResp, q.app.Logger())
	if err != nil {
		q.app.Logger().Error().Err(err).Str("generator", generatorID).Msg("Failed to get IP sources of generator")
		return nil, err
	}

	return response.Sources, nil
}

func (q *QueueClient) GetIPSources(ctx context.Context) ([]iputils.Source, error) {
	sources, err := forAllGenerators(ctx, q, q.GetIPSourcesOfGenerator)
	if err != nil {
		return nil, err
	}

	return sources, nil
}
