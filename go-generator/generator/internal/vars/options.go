package vars

import "github.com/rs/zerolog"

type varsOptions struct {
	maxTries     int
	stopIfNoMore bool
	logger       *zerolog.Logger
}

type varsOption func(*varsOptions)

func defaultVarsOptions() varsOptions {
	return varsOptions{
		maxTries:     10000,
		stopIfNoMore: true,
	}
}

func applyVarsOptions(o varsOptions, opts []varsOption) varsOptions {
	for _, opt := range opts {
		opt(&o)
	}
	return o
}

func WithMaxTries(maxTries int) varsOption {
	return func(o *varsOptions) {
		o.maxTries = maxTries
	}
}

func WithStopIfNoMore(stopIfNoMore bool) varsOption {
	return func(o *varsOptions) {
		o.stopIfNoMore = stopIfNoMore
	}
}

func WithLogger(logger *zerolog.Logger) varsOption {
	return func(o *varsOptions) {
		o.logger = logger
	}
}
