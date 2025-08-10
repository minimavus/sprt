package variables

import (
	"fmt"
	"net/http"

	"github.com/cisco-open/sprt/go-generator/sdk/radius"
	"github.com/cisco-open/sprt/go-generator/sdk/registry"
	"github.com/cisco-open/sprt/go-generator/sdk/variables"
)

type (
	ParametersBlock struct {
		Title      string                `json:"title"`
		Parameters []variables.Parameter `json:"parameters"`
		PropName   string                `json:"prop_name"`
	}

	ProtoDefinition struct {
		ProtoName  string             `json:"proto_name"`
		Radius     radius.ProtoRadius `json:"radius"`
		Parameters variables.Params   `json:"parameters"`
		Schema     any                `json:"schema,omitempty"`
	}
)

var (
	identityCertificatesLoad = variables.NewLoadParams("/certificates/identity", http.MethodGet).
		WithAPIPrefix().
		SetResultType(variables.LoadParamsResultTypeTable).
		SetResultPaging(false).
		SetResultAttribute("certificates").
		SetResultFields("friendly_name", "id").
		SetResultColumns([]variables.LoadableResultColumn{
			{Title: "Friendly Name", Field: "friendly_name"},
			{Title: "Subject", Field: "subject"},
			{Title: "Issuer", Field: "issuer"},
		}).
		SetResultObjectPath(".certificates")
)

func GetProtoDefinition(proto string) (ProtoDefinition, error) {
	switch proto {
	case "pap", "chap", "pap-chap":
		papPlugin, ok := registry.Get("pap")
		if !ok {
			return ProtoDefinition{}, fmt.Errorf("PAP/CHAP plugin not found")
		}

		params := papPlugin.Parameters()

		return ProtoDefinition{
			ProtoName:  "PAP/CHAP",
			Radius:     *papPlugin.RADIUS(),
			Parameters: params,
			Schema:     params.ToJSONSchema(),
		}, nil
	case "eap-tls", "eaptls":
		return EAPTLS, nil
	case "peap":
		return PEAP, nil
	case "mab":
		mabPlugin, ok := registry.Get("mab")
		if !ok {
			return ProtoDefinition{}, fmt.Errorf("MAB plugin not found")
		}

		params := mabPlugin.Parameters()

		return ProtoDefinition{
			ProtoName:  "MAB",
			Radius:     *mabPlugin.RADIUS(),
			Parameters: params,
			Schema:     params.ToJSONSchema(),
		}, nil
	default:
		return ProtoDefinition{}, fmt.Errorf("unknown proto '%s'", proto)
	}
}
