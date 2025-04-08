package pxgrid

import (
	"context"

	"google.golang.org/grpc/credentials"
)

type rpcCredentials struct {
	token string
}

var _ credentials.PerRPCCredentials = (*rpcCredentials)(nil)

func perRPC(token string) credentials.PerRPCCredentials {
	return &rpcCredentials{token: token}
}

func (c *rpcCredentials) GetRequestMetadata(context.Context, ...string) (map[string]string, error) {
	return map[string]string{
		"token": c.token,
	}, nil
}

func (c *rpcCredentials) RequireTransportSecurity() bool {
	return false
}
