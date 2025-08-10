package variables

import (
	"slices"

	"github.com/cisco-open/sprt/go-generator/sdk/radius/attributes"
)

var (
	// MABAccessRequest = slices.Concat(
	// 	[]attributes.RadiusAttribute{
	// 		attributes.Build(attributes.ID("Service-Type"),
	// 			attributes.Value("Call-Check"),
	// 			attributes.RFC2865,
	// 			attributes.NonRemovable()),
	// 		attributes.Build(attributes.ID("User-Name"),
	// 			attributes.Value("Same as MAC address"),
	// 			attributes.RFC2865,
	// 			attributes.NonRemovable()),
	// 	},
	// 	attributes.CommonRequest)

	// MABAccountingStart = slices.Concat(attributes.CommonAccounting)

	// PAPAccessRequest = slices.Concat(
	// 	[]attributes.RadiusAttribute{
	// 		attributes.Build(attributes.ID("Service-Type"),
	// 			attributes.Value("Framed-User"),
	// 			attributes.RFC2865,
	// 			attributes.NonRemovable()),
	// 		attributes.Build(attributes.ID("User-Name"),
	// 			attributes.FromCredentialsList,
	// 			attributes.RFC2865,
	// 			attributes.NonRemovable()),
	// 		attributes.Build(attributes.ID("User-Password"),
	// 			attributes.FromCredentialsList,
	// 			attributes.RFC2865,
	// 			attributes.NonRemovable()),
	// 	},
	// 	attributes.CommonRequest)

	// PAPAccountingStart = slices.Concat(attributes.CommonAccounting)

	PEAPAccessRequest = slices.Concat(
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

	PEAPAccountingStart = slices.Concat(attributes.CommonAccounting)

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
