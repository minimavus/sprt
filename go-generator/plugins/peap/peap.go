package peap

import (
	"encoding/json"
	"fmt"

	"github.com/cisco-open/sprt/go-generator/generator/plugins/eaptls"
	"github.com/cisco-open/sprt/go-generator/sdk/radius"
	"github.com/cisco-open/sprt/go-generator/sdk/registry"
	"github.com/cisco-open/sprt/go-generator/sdk/variables"
)

type peapPlugin struct{}

var _ registry.Plugin = &peapPlugin{}
var _ registry.CipherSuitesProvider = &peapPlugin{}

var (
	prebuiltProto = &radius.ProtoRadius{
		AccessRequest:   PEAPAccessRequest,
		AccountingStart: PEAPAccountingStart,
	}

	prebuiltSchema = peapParams.ToJSONSchema()
)

func (*peapPlugin) Name() string { return "peap" }

func (*peapPlugin) JSONSchema() []json.RawMessage {
	return prebuiltSchema
}

func (*peapPlugin) Parameters() variables.Params {
	return peapParams
}

func (*peapPlugin) Proto() variables.Protos {
	return variables.ProtosRadius
}

func (*peapPlugin) RADIUS() *radius.ProtoRadius {
	return prebuiltProto
}

func (*peapPlugin) TACACS() any {
	return nil
}

func (*peapPlugin) Provides() []string {
	return []string{"peap"}
}

func (*peapPlugin) GetTLSCipherSuites(_, tlsVersion string) ([]variables.OptionsGroup[bool], error) {
	switch tlsVersion {
	case eaptls.TLSVersionTLSv1, eaptls.TLSVersionTLSv11, eaptls.TLSVersionTLSv12, eaptls.TLSVersionTLSv13:
		m := eaptls.CiphersMap[tlsVersion]

		return m, nil
	default:
		return nil, fmt.Errorf("unsupported TLS version: %s", tlsVersion)
	}
}

func init() {
	registry.Register(&peapPlugin{})
}
