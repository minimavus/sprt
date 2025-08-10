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
	plugins     sync.Map
	pluginsLock sync.Mutex
)

func Register(p Plugin) {
	pluginsLock.Lock()
	defer pluginsLock.Unlock()
	if _, loaded := plugins.Load(p.Name()); loaded {
		panic("plugin already registered: " + p.Name())
	}
	plugins.Store(p.Name(), p)
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
