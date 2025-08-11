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

func (*mabPlugin) Name() string { return "mab" }

func (*mabPlugin) JSONSchema() []json.RawMessage {
	return prebuiltSchema
}

func (*mabPlugin) Parameters() variables.Params {
	return mabParams
}

func (*mabPlugin) Proto() variables.Protos {
	return variables.ProtosRadius
}

func (*mabPlugin) RADIUS() *radius.ProtoRadius {
	return prebuiltProto
}

func (*mabPlugin) TACACS() any {
	return nil
}

func init() {
	registry.Register(&mabPlugin{})
}
