package raddacl

import (
	"encoding/json"

	"github.com/cisco-open/sprt/go-generator/sdk/radius"
	"github.com/cisco-open/sprt/go-generator/sdk/registry"
	"github.com/cisco-open/sprt/go-generator/sdk/variables"
)

type plugin struct{}

var (
	prebuiltSchema = radiusACLDownloadParams.ToJSONSchema()
)

func (*plugin) Name() string { return "RADIUS - ACL Download" }

func (*plugin) JSONSchema() []json.RawMessage {
	return prebuiltSchema
}

func (*plugin) Parameters() variables.Params {
	return radiusACLDownloadParams
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
	return []string{"radius_acl_download", "radius-acl-download"}
}

func init() {
	registry.Register(&plugin{})
}
