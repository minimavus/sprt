package pap

import (
	"encoding/json"

	"github.com/cisco-open/sprt/go-generator/sdk/registry"
)

type fooPlugin struct{}

func (f *fooPlugin) Name() string { return "pap" }
func (f *fooPlugin) JSONSchema() []json.RawMessage {
	return []json.RawMessage{
		[]byte(`{ "type": "object" }`),
	}
}

func init() {
	registry.Register(&fooPlugin{})
}
