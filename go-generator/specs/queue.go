package specs

import "time"

type (
	NatsSpecs struct {
		URL           string        `env:"QUEUE_NATS_URL"`
		ReconnectWait time.Duration `env:"QUEUE_NATS_RECONNECT_WAIT" default:"2s"`
		TotalWait     time.Duration `env:"QUEUE_NATS_TOTAL_WAIT" default:"2m"`
		Timeout       time.Duration `env:"QUEUE_NATS_TIMEOUT" default:"2s"`
		ManagementURL string        `env:"QUEUE_NATS_MANAGEMENT_URL"`
	}

	QueueSpecs struct {
		Nats          NatsSpecs
		GenerateQueue string `env:"QUEUE_GENERATE_QUEUE" default:"sprt.generate"`
		ControlQueue  string `env:"QUEUE_CONTROL_QUEUE" default:"sprt.control"`
	}
)
