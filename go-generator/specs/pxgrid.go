package specs

import "time"

type (
	KeepAliveSpecs struct {
		Time                time.Duration `env:"KEEP_ALIVE_TIME" default:"10s"`
		Timeout             time.Duration `env:"KEEP_ALIVE_TIMEOUT" default:"2s"`
		PermitWithoutStream bool          `env:"KEEP_ALIVE_PERMIT_WITHOUT_STREAM" default:"true"`
	}

	PXGriderSpecs struct {
		URL       string `env:"PXGRIDER_URL"`
		Token     string `env:"PXGRIDER_TOKEN"`
		Keepalive KeepAliveSpecs
	}
)
