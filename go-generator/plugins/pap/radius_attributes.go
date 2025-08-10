package pap

import (
	"slices"

	"github.com/cisco-open/sprt/go-generator/sdk/radius/attributes"
)

var (
	PAPAccessRequest = slices.Concat(
		[]attributes.RadiusAttribute{
			attributes.Build(attributes.ID("Service-Type"),
				attributes.Value("Framed-User"),
				attributes.RFC2865,
				attributes.NonRemovable()),
			attributes.Build(attributes.ID("User-Name"),
				attributes.FromCredentialsList,
				attributes.RFC2865,
				attributes.NonRemovable()),
			attributes.Build(attributes.ID("User-Password"),
				attributes.FromCredentialsList,
				attributes.RFC2865,
				attributes.NonRemovable()),
		},
		attributes.CommonRequest)

	PAPAccountingStart = slices.Concat(attributes.CommonAccounting)
)
