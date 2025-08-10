package registry

import (
	j "encoding/json"
	"sync"

	"github.com/cisco-open/sprt/go-generator/sdk/radius"
	"github.com/cisco-open/sprt/go-generator/sdk/variables"
)

type Plugin interface {
	Name() string
	JSONSchema() []j.RawMessage
	Parameters() variables.Params
	Proto() variables.Protos

	RADIUS() *radius.ProtoRadius
	TACACS() any // FIXME: implement TACACS support
}

var (
	plugins sync.Map
)

func Register(p Plugin) {
	if _, loaded := plugins.LoadOrStore(p.Name(), p); loaded {
		panic("plugin already registered: " + p.Name())
	}
}

func Registered() []Plugin {
	var registered []Plugin
	plugins.Range(func(_, value any) bool {
		if plugin, ok := value.(Plugin); ok {
			registered = append(registered, plugin)
		}
		return true
	})
	return registered
}

func Get(name string) (Plugin, bool) {
	if value, ok := plugins.Load(name); ok {
		if plugin, ok := value.(Plugin); ok {
			return plugin, true
		}
	}
	return nil, false
}
