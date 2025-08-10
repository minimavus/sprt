package radius

import "github.com/cisco-open/sprt/go-generator/sdk/radius/attributes"

type ProtoRadius struct {
	AccessRequest   []attributes.RadiusAttribute `json:"access_request"`
	AccountingStart []attributes.RadiusAttribute `json:"accounting_start"`
}
