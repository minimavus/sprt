package variables

import (
	"fmt"
	"net/http"

	"github.com/cisco-open/sprt/go-generator/sdk/radius/attributes"
	"github.com/cisco-open/sprt/go-generator/sdk/variables"
)

type (
	ParametersBlock struct {
		Title      string                `json:"title"`
		Parameters []variables.Parameter `json:"parameters"`
		PropName   string                `json:"prop_name"`
	}

	ProtoRadius struct {
		AccessRequest   []attributes.RadiusAttribute `json:"access_request"`
		AccountingStart []attributes.RadiusAttribute `json:"accounting_start"`
	}

	ProtoDefinition struct {
		ProtoName  string           `json:"proto_name"`
		Radius     ProtoRadius      `json:"radius"`
		Parameters variables.Params `json:"parameters"`
		Schema     any              `json:"schema,omitempty"`
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

	MAB = ProtoDefinition{
		ProtoName: "MAB",
		Radius: ProtoRadius{
			AccessRequest:   MABAccessRequest,
			AccountingStart: MABAccountingStart,
		},
		Parameters: variables.Params{},
	}
)

func GetProtoDefinition(proto string) (ProtoDefinition, error) {
	switch proto {
	case "pap", "chap", "pap-chap":
		return PAP, nil
	case "eap-tls", "eaptls":
		return EapTLS, nil
	case "peap":
		return PEAP, nil
	case "mab":
		return MAB, nil
	default:
		return ProtoDefinition{}, fmt.Errorf("unknown proto '%s'", proto)
	}
}
