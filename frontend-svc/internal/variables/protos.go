package variables

import (
	"fmt"
	"net/http"

	"github.com/cisco-open/sprt/frontend-svc/internal/iputils"
)

type (
	RadiusAttribute struct {
		ID             string           `json:"id"`
		Value          string           `json:"value"`
		Dictionary     string           `json:"dictionary"`
		Vendor         string           `json:"vendor,omitempty"`
		Overwrite      bool             `json:"overwrite"`
		NonRemovable   bool             `json:"non_removable"`
		CustomValues   []string         `json:"custom_values,omitempty"`
		FamilySpecific iputils.IPFamily `json:"family_specific,omitempty"`
	}

	ParametersBlock struct {
		Title      string      `json:"title"`
		Parameters []Parameter `json:"parameters"`
		PropName   string      `json:"prop_name"`
	}

	ProtoRadius struct {
		AccessRequest   []RadiusAttribute `json:"access_request"`
		AccountingStart []RadiusAttribute `json:"accounting_start"`
	}

	Params []ParametersBlock

	ProtoDefinition struct {
		ProtoName  string      `json:"proto_name"`
		Radius     ProtoRadius `json:"radius"`
		Parameters Params      `json:"parameters"`
		Schema     any         `json:"schema,omitempty"`
	}
)

var (
	identityCertificatesLoad = NewLoadParams("/certificates/identity", http.MethodGet).
					WithApiPrefix().
					SetResultType(LoadParamsResultTypeTable).
					SetResultPaging(false).
					SetResultAttribute("certificates").
					SetResultFields("friendly_name", "id").
					SetResultColumns([]LoadableResultColumn{
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
		Parameters: Params{},
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
