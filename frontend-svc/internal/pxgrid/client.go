package pxgrid

import (
	"context"
	"errors"
	"fmt"

	"github.com/rs/zerolog"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	_ "google.golang.org/grpc/health" // Register the health check client
	healthgrpc "google.golang.org/grpc/health/grpc_health_v1"
	"google.golang.org/grpc/keepalive"
	"google.golang.org/grpc/resolver"
	"google.golang.org/grpc/resolver/manual"

	pxgrider_proto "github.com/vkumov/go-pxgrider/pkg"
)

type PXGridClient struct {
	cl pxgrider_proto.PxgriderServiceClient

	cfg   PXGriderSpecs
	l     *zerolog.Logger
	conn  *grpc.ClientConn
	hlCln healthgrpc.HealthClient
}

const (
	healthCheckService = ""

	serviceConfig = `{
		"loadBalancingPolicy": "round_robin",
		"healthCheckConfig": {
			"serviceName": "` + healthCheckService + `"
		}
	}`
)

func NewPXGridClient(cfg PXGriderSpecs, logger *zerolog.Logger) *PXGridClient {
	return &PXGridClient{
		cfg: cfg,
		l:   logger,
	}
}

func (c *PXGridClient) Connect() error {
	if !c.IsEnabled() {
		c.l.Warn().Msg("pxGrid client is not configured")
		return nil
	}

	creds := insecure.NewCredentials()

	r := manual.NewBuilderWithScheme("pxgrid")
	r.InitialState(resolver.State{
		Addresses: []resolver.Address{
			{Addr: c.cfg.URL},
		},
	})

	address := fmt.Sprintf("%s:///unused", r.Scheme())

	opts := []grpc.DialOption{
		grpc.WithPerRPCCredentials(perRPC(c.cfg.Token)),
		grpc.WithTransportCredentials(creds),
		grpc.WithKeepaliveParams(keepalive.ClientParameters{
			Time:                c.cfg.Keepalive.Time,
			Timeout:             c.cfg.Keepalive.Timeout,
			PermitWithoutStream: c.cfg.Keepalive.PermitWithoutStream,
		}),
		grpc.WithResolvers(r),
		grpc.WithDefaultServiceConfig(serviceConfig),
	}

	c.l.Debug().Str("address", address).Str("url", c.cfg.URL).Msg("Connecting to pxGrid")
	conn, err := grpc.NewClient(address, opts...)
	if err != nil {
		c.l.Error().Err(err).Msg("Failed to connect to pxGrid")
		return err
	}

	c.conn = conn
	c.cl = pxgrider_proto.NewPxgriderServiceClient(conn)
	c.hlCln = healthgrpc.NewHealthClient(conn)

	if _, err := c.hlCln.Check(context.Background(), &healthgrpc.HealthCheckRequest{Service: ""}); err != nil {
		c.l.Error().Err(err).Msg("Failed to check pxGrid health")
	}

	return nil
}

func (c *PXGridClient) Close() error {
	if c.conn == nil {
		return nil
	}

	if err := c.conn.Close(); err != nil {
		c.l.Error().Err(err).Msg("Failed to close pxGrid connection")
		return err
	}

	c.conn = nil
	c.cl = nil
	c.hlCln = nil

	return nil
}

func (c *PXGridClient) IsHealthy(ctx context.Context) (bool, error) {
	if c == nil {
		return false, errors.New("pxGrid client is not enabled")
	}

	if c.hlCln == nil {
		return false, errors.New("pxGrid client is not connected")
	}

	r, err := c.hlCln.Check(ctx, &healthgrpc.HealthCheckRequest{Service: healthCheckService})
	if err != nil {
		return false, err
	}

	return r.Status == healthgrpc.HealthCheckResponse_SERVING, nil
}

func (c *PXGridClient) IsEnabled() bool {
	if c == nil {
		return false
	}

	return c.cfg.URL != ""
}

func (c *PXGridClient) beforeCallHook(ctx context.Context) error {
	c.l.Debug().Msg("Before call hook")
	if !c.IsEnabled() {
		c.l.Error().Msg("pxGrid client is not configured")
		return errors.New("pxGrid client is not configured")
	}

	healthy, err := c.IsHealthy(ctx)
	if err != nil {
		c.l.Error().Err(err).Msg("Failed to check pxGrid health")
		return fmt.Errorf("pxGrid health check failed: %w", err)
	}

	if !healthy {
		c.l.Error().Msg("pxGrid is not healthy")
		return errors.New("pxGrid is not healthy")
	}

	return nil
}
