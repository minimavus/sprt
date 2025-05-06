package generator

import (
	"context"

	"layeh.com/radius/dictionary"

	"github.com/cisco-open/sprt/frontend-svc/internal/iputils"
	"github.com/cisco-open/sprt/frontend-svc/internal/variables"
)

type Generator interface {
	ListDictionaries() ([]Dictionary, error)
	GetDictionary(ctx context.Context, name, user string) (*dictionary.Dictionary, string, error)
	GetTLSCipherSuites(tlsVersion string) ([]variables.OptionsGroup[bool], error)
	GetAvailableIPSources(includeAll bool) ([]iputils.Source, error)
}
