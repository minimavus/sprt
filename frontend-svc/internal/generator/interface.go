package generator

import (
	"context"

	"layeh.com/radius/dictionary"

	"github.com/cisco-open/sprt/frontend-svc/internal/queue"
	"github.com/cisco-open/sprt/go-generator/sdk/iputils"
	"github.com/cisco-open/sprt/go-generator/sdk/variables"
)

type Generator interface {
	ListDictionaries() ([]Dictionary, error)
	GetDictionary(ctx context.Context, name, user string) (*dictionary.Dictionary, string, error)
	GetTLSCipherSuites(proto, tlsVersion string) ([]variables.OptionsGroup[bool], error)
	GetAvailableIPSources(ctx context.Context, q *queue.QueueClient, includeAll bool) ([]iputils.Source, error)
}
