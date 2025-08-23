package radacct

import (
	"encoding/json"

	"github.com/cisco-open/sprt/go-generator/sdk/radius"
	"github.com/cisco-open/sprt/go-generator/sdk/registry"
	"github.com/cisco-open/sprt/go-generator/sdk/variables"
)

type plugin struct{}

var (
	prebuiltSchema = radiusAccountingParams.ToJSONSchema()
)

func (*plugin) Name() string { return "RADIUS - Accounting" }

func (*plugin) JSONSchema() []json.RawMessage {
	return prebuiltSchema
}

func (*plugin) Parameters() variables.Params {
	return radiusAccountingParams
}

func (*plugin) Proto() variables.Protos {
	return variables.ProtosRadius
}

func (*plugin) RADIUS() *radius.ProtoRadius {
	return nil
}

func (*plugin) TACACS() any {
	return nil
}

func (*plugin) Provides() []string {
	return []string{"radius_accounting", "radius-accounting"}
}

func init() {
	registry.Register(&plugin{})
}
