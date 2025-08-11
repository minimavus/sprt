package eaptls

import (
	"slices"

	"github.com/cisco-open/sprt/go-generator/sdk/radius/attributes"
)

var (
	EAPTLSAccessRequest = slices.Concat(
		[]attributes.RadiusAttribute{
			attributes.Build(attributes.ID("Service-Type"),
				attributes.Value("Framed-User"),
				attributes.RFC2865,
				attributes.NonRemovable()),
			attributes.Build(attributes.ID("User-Name"),
				attributes.Value("$USERNAME$"),
				attributes.RFC2865,
				attributes.NonRemovable()),
			attributes.Build(attributes.ID("EAP-Message"),
				attributes.EAPData,
				attributes.RFC3579,
				attributes.NonRemovable()),
		},
		attributes.CommonRequest)

	EAPTLSAccountingStart = slices.Concat(attributes.CommonAccounting)
)
