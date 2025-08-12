package registry

import (
	j "encoding/json"
	"sync"

	"github.com/cisco-open/sprt/go-generator/sdk/radius"
	"github.com/cisco-open/sprt/go-generator/sdk/variables"
)

type (
	Plugin interface {
		Name() string
		Provides() []string
		JSONSchema() []j.RawMessage
		Parameters() variables.Params
		Proto() variables.Protos

		RADIUS() *radius.ProtoRadius
		TACACS() any // FIXME: implement TACACS support
	}

	CipherSuitesProvider interface {
		GetTLSCipherSuites(proto, tlsVersion string) ([]variables.OptionsGroup[bool], error)
	}

	plugins struct {
		byName     sync.Map
		byProvides sync.Map
	}
)

var (
	repo plugins
)

func Register(p Plugin) {
	if _, loaded := repo.byName.LoadOrStore(p.Name(), p); loaded {
		panic("plugin already registered: " + p.Name())
	}

	for _, provide := range p.Provides() {
		if _, loaded := repo.byProvides.LoadOrStore(provide, p); loaded {
			panic("plugin already registered for provides '" + provide + "': " + p.Name())
		}
	}
}

func Registered() []Plugin {
	var registered []Plugin
	repo.byName.Range(func(_, value any) bool {
		if plugin, ok := value.(Plugin); ok {
			registered = append(registered, plugin)
		}
		return true
	})
	return registered
}

func GetByName(name string) (Plugin, bool) {
	if value, ok := repo.byName.Load(name); ok {
		if plugin, ok := value.(Plugin); ok {
			return plugin, true
		}
	}
	return nil, false
}

func GetByProvides(provides string) (Plugin, bool) {
	if value, ok := repo.byProvides.Load(provides); ok {
		if plugin, ok := value.(Plugin); ok {
			return plugin, true
		}
	}
	return nil, false
}
