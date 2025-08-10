package registry

import (
	j "encoding/json"
	"sync"
)

type Plugin interface {
	Name() string
	JSONSchema() []j.RawMessage
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
