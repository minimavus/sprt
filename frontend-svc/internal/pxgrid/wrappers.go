package pxgrid

import (
	"context"

	proto "github.com/vkumov/go-pxgrider/pkg"
	"google.golang.org/grpc"
)

func (c *PXGridClient) CheckFQDN(ctx context.Context, in *proto.CheckFQDNRequest, opts ...grpc.CallOption) (*proto.CheckFQDNResponse, error) {
	if err := c.beforeCallHook(ctx); err != nil {
		return nil, err
	}

	return c.cl.CheckFQDN(ctx, in, opts...)
}

func (c *PXGridClient) GetConnections(ctx context.Context, in *proto.GetConnectionsRequest, opts ...grpc.CallOption) (*proto.GetConnectionsResponse, error) {
	if err := c.beforeCallHook(ctx); err != nil {
		return nil, err
	}

	return c.cl.GetConnections(ctx, in, opts...)
}

func (c *PXGridClient) GetConnectionsTotal(ctx context.Context, in *proto.GetConnectionsTotalRequest, opts ...grpc.CallOption) (*proto.GetConnectionsTotalResponse, error) {
	if err := c.beforeCallHook(ctx); err != nil {
		return nil, err
	}

	return c.cl.GetConnectionsTotal(ctx, in, opts...)
}

func (c *PXGridClient) CreateConnection(ctx context.Context, in *proto.CreateConnectionRequest, opts ...grpc.CallOption) (*proto.CreateConnectionResponse, error) {
	if err := c.beforeCallHook(ctx); err != nil {
		return nil, err
	}

	return c.cl.CreateConnection(ctx, in, opts...)
}

func (c *PXGridClient) GetConnection(ctx context.Context, in *proto.GetConnectionRequest, opts ...grpc.CallOption) (*proto.GetConnectionResponse, error) {
	if err := c.beforeCallHook(ctx); err != nil {
		return nil, err
	}

	return c.cl.GetConnection(ctx, in, opts...)
}

func (c *PXGridClient) UpdateConnection(ctx context.Context, in *proto.UpdateConnectionRequest, opts ...grpc.CallOption) (*proto.UpdateConnectionResponse, error) {
	if err := c.beforeCallHook(ctx); err != nil {
		return nil, err
	}

	return c.cl.UpdateConnection(ctx, in, opts...)
}

func (c *PXGridClient) DeleteConnection(ctx context.Context, in *proto.DeleteConnectionRequest, opts ...grpc.CallOption) (*proto.DeleteConnectionResponse, error) {
	if err := c.beforeCallHook(ctx); err != nil {
		return nil, err
	}

	return c.cl.DeleteConnection(ctx, in, opts...)
}

func (c *PXGridClient) RefreshConnection(ctx context.Context, in *proto.RefreshConnectionRequest, opts ...grpc.CallOption) (*proto.RefreshConnectionResponse, error) {
	if err := c.beforeCallHook(ctx); err != nil {
		return nil, err
	}

	return c.cl.RefreshConnection(ctx, in, opts...)

}

func (c *PXGridClient) GetAllSubscriptions(ctx context.Context, in *proto.GetAllSubscriptionsRequest, opts ...grpc.CallOption) (*proto.GetAllSubscriptionsResponse, error) {
	if err := c.beforeCallHook(ctx); err != nil {
		return nil, err
	}

	return c.cl.GetAllSubscriptions(ctx, in, opts...)

}

func (c *PXGridClient) GetSubscription(ctx context.Context, in *proto.GetSubscriptionRequest, opts ...grpc.CallOption) (*proto.GetSubscriptionResponse, error) {
	if err := c.beforeCallHook(ctx); err != nil {
		return nil, err
	}

	return c.cl.GetSubscription(ctx, in, opts...)
}

func (c *PXGridClient) SubscribeConnection(ctx context.Context, in *proto.SubscribeConnectionRequest, opts ...grpc.CallOption) (*proto.SubscribeConnectionResponse, error) {
	if err := c.beforeCallHook(ctx); err != nil {
		return nil, err
	}

	return c.cl.SubscribeConnection(ctx, in, opts...)

}

func (c *PXGridClient) UnsubscribeConnection(ctx context.Context, in *proto.UnsubscribeConnectionRequest, opts ...grpc.CallOption) (*proto.UnsubscribeConnectionResponse, error) {
	if err := c.beforeCallHook(ctx); err != nil {
		return nil, err
	}

	return c.cl.UnsubscribeConnection(ctx, in, opts...)

}

func (c *PXGridClient) GetConnectionMessages(ctx context.Context, in *proto.GetConnectionMessagesRequest, opts ...grpc.CallOption) (*proto.GetConnectionMessagesResponse, error) {
	if err := c.beforeCallHook(ctx); err != nil {
		return nil, err
	}

	return c.cl.GetConnectionMessages(ctx, in, opts...)

}

func (c *PXGridClient) MarkConnectionMessagesAsRead(ctx context.Context, in *proto.MarkConnectionMessagesAsReadRequest, opts ...grpc.CallOption) (*proto.MarkConnectionMessagesAsReadResponse, error) {
	if err := c.beforeCallHook(ctx); err != nil {
		return nil, err
	}

	return c.cl.MarkConnectionMessagesAsRead(ctx, in, opts...)

}

func (c *PXGridClient) DeleteConnectionMessages(ctx context.Context, in *proto.DeleteConnectionMessagesRequest, opts ...grpc.CallOption) (*proto.DeleteConnectionMessagesResponse, error) {
	if err := c.beforeCallHook(ctx); err != nil {
		return nil, err
	}

	return c.cl.DeleteConnectionMessages(ctx, in, opts...)

}

func (c *PXGridClient) GetConnectionLogs(ctx context.Context, in *proto.GetConnectionLogsRequest, opts ...grpc.CallOption) (*proto.GetConnectionLogsResponse, error) {
	if err := c.beforeCallHook(ctx); err != nil {
		return nil, err
	}

	return c.cl.GetConnectionLogs(ctx, in, opts...)

}

func (c *PXGridClient) DeleteConnectionLogs(ctx context.Context, in *proto.DeleteConnectionLogsRequest, opts ...grpc.CallOption) (*proto.DeleteConnectionLogsResponse, error) {
	if err := c.beforeCallHook(ctx); err != nil {
		return nil, err
	}

	return c.cl.DeleteConnectionLogs(ctx, in, opts...)

}

func (c *PXGridClient) GetConnectionServices(ctx context.Context, in *proto.GetConnectionServicesRequest, opts ...grpc.CallOption) (*proto.GetConnectionServicesResponse, error) {
	if err := c.beforeCallHook(ctx); err != nil {
		return nil, err
	}

	return c.cl.GetConnectionServices(ctx, in, opts...)

}

func (c *PXGridClient) GetConnectionService(ctx context.Context, in *proto.GetConnectionServiceRequest, opts ...grpc.CallOption) (*proto.GetConnectionServiceResponse, error) {
	if err := c.beforeCallHook(ctx); err != nil {
		return nil, err
	}

	return c.cl.GetConnectionService(ctx, in, opts...)

}

func (c *PXGridClient) GetServiceMethods(ctx context.Context, in *proto.GetServiceMethodsRequest, opts ...grpc.CallOption) (*proto.GetServiceMethodsResponse, error) {
	if err := c.beforeCallHook(ctx); err != nil {
		return nil, err
	}

	return c.cl.GetServiceMethods(ctx, in, opts...)

}

func (c *PXGridClient) CallServiceMethod(ctx context.Context, in *proto.CallServiceMethodRequest, opts ...grpc.CallOption) (*proto.CallServiceMethodResponse, error) {
	if err := c.beforeCallHook(ctx); err != nil {
		return nil, err
	}

	return c.cl.CallServiceMethod(ctx, in, opts...)

}

func (c *PXGridClient) ServiceLookup(ctx context.Context, in *proto.ServiceLookupRequest, opts ...grpc.CallOption) (*proto.ServiceLookupResponse, error) {
	if err := c.beforeCallHook(ctx); err != nil {
		return nil, err
	}

	return c.cl.ServiceLookup(ctx, in, opts...)
}

func (c *PXGridClient) ServiceUpdateSecrets(ctx context.Context, in *proto.ServiceUpdateSecretsRequest, opts ...grpc.CallOption) (*proto.ServiceUpdateSecretsResponse, error) {
	if err := c.beforeCallHook(ctx); err != nil {
		return nil, err
	}

	return c.cl.ServiceUpdateSecrets(ctx, in, opts...)

}

func (c *PXGridClient) ServiceCheckNodes(ctx context.Context, in *proto.ServiceCheckNodesRequest, opts ...grpc.CallOption) (*proto.ServiceCheckNodesResponse, error) {
	if err := c.beforeCallHook(ctx); err != nil {
		return nil, err
	}

	return c.cl.ServiceCheckNodes(ctx, in, opts...)

}

func (c *PXGridClient) GetConnectionTopics(ctx context.Context, in *proto.GetConnectionTopicsRequest, opts ...grpc.CallOption) (*proto.GetConnectionTopicsResponse, error) {
	if err := c.beforeCallHook(ctx); err != nil {
		return nil, err
	}

	return c.cl.GetConnectionTopics(ctx, in, opts...)

}

func (c *PXGridClient) GetServiceTopics(ctx context.Context, in *proto.GetServiceTopicsRequest, opts ...grpc.CallOption) (*proto.GetServiceTopicsResponse, error) {
	if err := c.beforeCallHook(ctx); err != nil {
		return nil, err
	}

	return c.cl.GetServiceTopics(ctx, in, opts...)
}

func (c *PXGridClient) RefreshAccountState(ctx context.Context, in *proto.RefreshAccountStateRequest, opts ...grpc.CallOption) (*proto.RefreshAccountStateResponse, error) {
	if err := c.beforeCallHook(ctx); err != nil {
		return nil, err
	}

	return c.cl.RefreshAccountState(ctx, in, opts...)

}
