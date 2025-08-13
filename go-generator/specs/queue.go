package specs

type (
	NatsSpecs struct {
		URL string `env:"QUEUE_NATS_URL"`
	}

	QueueSpecs struct {
		Nats          NatsSpecs
		GenerateQueue string `env:"QUEUE_GENERATE_QUEUE" default:"generate"`
	}
)
