package certificates

type (
	parseConfig struct {
		privateKey         []byte
		privateKeyPassword string

		keepBody bool
	}

	ParseOption func(*parseConfig)
)

func WithPrivateKey(privateKey []byte) ParseOption {
	return func(c *parseConfig) {
		c.privateKey = privateKey
	}
}

func WithPrivateKeyPassword(password string) ParseOption {
	return func(c *parseConfig) {
		c.privateKeyPassword = password
	}
}

func KeepBody(keep bool) ParseOption {
	return func(c *parseConfig) {
		c.keepBody = keep
	}
}

func (c *parseConfig) apply(opts ...ParseOption) {
	for _, opt := range opts {
		opt(c)
	}
}

func newDefaultParseConfig() *parseConfig {
	return &parseConfig{}
}
