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

func (*papPlugin) Name() string { return "pap" }

func (*papPlugin) JSONSchema() []json.RawMessage {
	return prebuiltSchema
}

func (*papPlugin) Parameters() variables.Params {
	return papParams
}

func (*papPlugin) Proto() variables.Protos {
	return variables.ProtosRadius
}

func (*papPlugin) RADIUS() *radius.ProtoRadius {
	return prebuiltProto
}

func (*papPlugin) TACACS() any {
	return nil
}

func (*papPlugin) Provides() []string {
	return []string{"pap", "chap", "pap-chap"}
}

func init() {
	registry.Register(&papPlugin{})
}
