package variables

import (
	j "encoding/json"

	"github.com/cisco-open/sprt/go-generator/sdk/json"
)

type ignoreJSONSchemaMarshal struct {
	Parameter
}

var _ JSONSchemaMarshaler = (*ignoreJSONSchemaMarshal)(nil)
var _ j.Marshaler = (*ignoreJSONSchemaMarshal)(nil)

func IgnoreJSONSchemaMarshal(p Parameter) Parameter {
	return &ignoreJSONSchemaMarshal{p}
}

func (i *ignoreJSONSchemaMarshal) ToJSONSchema() (any, error) {
	return nil, nil
}

func (i *ignoreJSONSchemaMarshal) MarshalJSON() ([]byte, error) {
	return json.Marshal(i.Parameter)
}
