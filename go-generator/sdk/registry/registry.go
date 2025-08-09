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
	mux     sync.RWMutex
	plugins []Plugin
)

func Register(p Plugin) {
	mux.Lock()
	plugins = append(plugins, p)
	mux.Unlock()
}

func Registered() []Plugin {
	mux.RLock()
	defer mux.RUnlock()
	out := make([]Plugin, len(plugins))
	copy(out, plugins)
	return out
}
