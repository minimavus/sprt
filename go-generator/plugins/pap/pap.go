package pap

import (
	"encoding/json"

	"github.com/cisco-open/sprt/go-generator/sdk/radius"
	"github.com/cisco-open/sprt/go-generator/sdk/registry"
	"github.com/cisco-open/sprt/go-generator/sdk/variables"
)

type papPlugin struct{}

var (
	prebuiltProto = &radius.ProtoRadius{
		AccessRequest:   PAPAccessRequest,
		AccountingStart: PAPAccountingStart,
	}

	prebuiltSchema = papParams.ToJSONSchema()
)

func (f *papPlugin) Name() string { return "pap" }

func (f *papPlugin) JSONSchema() []json.RawMessage {
	return prebuiltSchema
}

func (f *papPlugin) Parameters() variables.Params {
	return papParams
}

func (f *papPlugin) Proto() variables.Protos {
	return variables.ProtosRadius
}

func (f *papPlugin) RADIUS() *radius.ProtoRadius {
	return prebuiltProto
}

func (f *papPlugin) TACACS() any {
	return nil
}

func init() {
	registry.Register(&papPlugin{})
}
