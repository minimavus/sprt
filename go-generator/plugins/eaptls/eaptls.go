package eaptls

import (
	"encoding/json"
	"fmt"

	"github.com/cisco-open/sprt/go-generator/sdk/radius"
	"github.com/cisco-open/sprt/go-generator/sdk/registry"
	"github.com/cisco-open/sprt/go-generator/sdk/variables"
)

type eapTLSPlugin struct{}

var _ registry.Plugin = &eapTLSPlugin{}
var _ registry.CipherSuitesProvider = &eapTLSPlugin{}

var (
	prebuiltProto = &radius.ProtoRadius{
		AccessRequest:   EAPTLSAccessRequest,
		AccountingStart: EAPTLSAccountingStart,
	}

	prebuiltSchema = eapTLSParams.ToJSONSchema()
)

func (*eapTLSPlugin) Name() string { return "eap-tls" }

func (*eapTLSPlugin) JSONSchema() []json.RawMessage {
	return prebuiltSchema
}

func (*eapTLSPlugin) Parameters() variables.Params {
	return eapTLSParams
}

func (*eapTLSPlugin) Proto() variables.Protos {
	return variables.ProtosRadius
}

func (*eapTLSPlugin) RADIUS() *radius.ProtoRadius {
	return prebuiltProto
}

func (*eapTLSPlugin) TACACS() any {
	return nil
}

func (*eapTLSPlugin) GetTLSCipherSuites(_, tlsVersion string) ([]variables.OptionsGroup[bool], error) {
	switch tlsVersion {
	case TLSVersionTLSv1, TLSVersionTLSv11, TLSVersionTLSv12, TLSVersionTLSv13:
		m := CiphersMap[tlsVersion]

		return m, nil
	default:
		return nil, fmt.Errorf("unsupported TLS version: %s", tlsVersion)
	}
}

func init() {
	registry.Register(&eapTLSPlugin{})
}
