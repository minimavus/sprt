package mab

import (
	"encoding/json"

	"github.com/cisco-open/sprt/go-generator/sdk/radius"
	"github.com/cisco-open/sprt/go-generator/sdk/registry"
	"github.com/cisco-open/sprt/go-generator/sdk/variables"
)

type mabPlugin struct{}

var (
	prebuiltProto = &radius.ProtoRadius{
		AccessRequest:   MABAccessRequest,
		AccountingStart: MABAccountingStart,
	}

	prebuiltSchema = mabParams.ToJSONSchema()
)

func (f *mabPlugin) Name() string { return "mab" }

func (f *mabPlugin) JSONSchema() []json.RawMessage {
	return prebuiltSchema
}

func (f *mabPlugin) Parameters() variables.Params {
	return mabParams
}

func (f *mabPlugin) Proto() variables.Protos {
	return variables.ProtosRadius
}

func (f *mabPlugin) RADIUS() *radius.ProtoRadius {
	return prebuiltProto
}

func (f *mabPlugin) TACACS() any {
	return nil
}

func init() {
	registry.Register(&mabPlugin{})
}
