package mab

import (
	"slices"

	"github.com/cisco-open/sprt/go-generator/sdk/radius/attributes"
)

var (
	MABAccessRequest = slices.Concat(
		[]attributes.RadiusAttribute{
			attributes.Build(attributes.ID("Service-Type"),
				attributes.Value("Call-Check"),
				attributes.RFC2865,
				attributes.NonRemovable()),
			attributes.Build(attributes.ID("User-Name"),
				attributes.Value("Same as MAC address"),
				attributes.RFC2865,
				attributes.NonRemovable()),
		},
		attributes.CommonRequest)

	MABAccountingStart = slices.Concat(attributes.CommonAccounting)
)
