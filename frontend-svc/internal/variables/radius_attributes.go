package variables

import (
	"slices"

	"github.com/cisco-open/sprt/go-generator/sdk/radius/attributes"
)

var (
	commonRequest = []attributes.RadiusAttribute{
		attributes.Build(attributes.ID("Acct-Session-Id"),
			attributes.Value("$SESSION_ID$"),
			attributes.RFC2866,
			attributes.NonRemovable()),
		attributes.Build(attributes.ID("Calling-Station-Id"),
			attributes.Value("$MAC$"),
			attributes.RFC2865,
			attributes.Overridable(),
			attributes.CustomValues([]string{"$MAC$"})),
		attributes.Build(attributes.ID("Called-Station-Id"),
			attributes.Value("00-00-00-FF-FF-FF"),
			attributes.RFC2865,
			attributes.Overridable()),
		attributes.Build(attributes.ID("NAS-IP-Address"),
			attributes.Value("$NAS_IP$"),
			attributes.RFC2865,
			attributes.Overridable(),
			attributes.CustomValues([]string{"$NAS_IP$"}),
			attributes.V4Only),
		attributes.Build(attributes.ID("NAS-IPv6-Address"),
			attributes.Value("$NAS_IP$"),
			attributes.RFC3162,
			attributes.Overridable(),
			attributes.CustomValues([]string{"$NAS_IP$"}),
			attributes.V6Only),
		attributes.Build(attributes.ID("NAS-Port-Type"),
			attributes.Value("$PORT_TYPE$"),
			attributes.RFC2865,
			attributes.Overridable(),
			attributes.CustomValues([]string{"$PORT_TYPE$"})),
		attributes.Build(attributes.ID("Message-Authenticator"),
			attributes.Calculate,
			attributes.RFC2869,
			attributes.Overridable(),
			attributes.CustomValues([]string{"Calculate"})),
		attributes.Build(attributes.ID("Framed-MTU"),
			attributes.Value("$MTU$"),
			attributes.RFC2865,
			attributes.Overridable(),
			attributes.CustomValues([]string{"$MTU$"})),
	}

	commonAccounting = []attributes.RadiusAttribute{
		attributes.Build(attributes.ID("Acct-Authentic"),
			attributes.Value("RADIUS"),
			attributes.RFC2866,
			attributes.Overridable()),
		attributes.Build(attributes.ID("Acct-Session-Id"),
			attributes.CopyLatestValue,
			attributes.RFC2866,
			attributes.Overridable(),
			attributes.CopyValues),
		attributes.Build(attributes.ID("Acct-Status-Type"),
			attributes.Value("Start"),
			attributes.RFC2866,
			attributes.Overridable()),
		attributes.Build(attributes.ID("Called-Station-Id"),
			attributes.CopyLatestValue,
			attributes.RFC2865,
			attributes.Overridable(),
			attributes.CopyValues),
		attributes.Build(attributes.ID("Calling-Station-Id"),
			attributes.CopyLatestValue,
			attributes.RFC2865,
			attributes.Overridable(),
			attributes.CopyValues),
		attributes.Build(attributes.ID("Class"),
			attributes.CopyFromResponse,
			attributes.RFC2865,
			attributes.Overridable(),
			attributes.CopyValues),
		attributes.Build(attributes.ID("Framed-IP-Address"),
			attributes.Value("$IP$"),
			attributes.RFC2865,
			attributes.Overridable(),
			attributes.CustomValues([]string{"$IP$"})),
		attributes.Build(attributes.ID("NAS-IP-Address"),
			attributes.CopyLatestValue,
			attributes.RFC2865,
			attributes.Overridable(),
			attributes.CopyValues,
			attributes.V4Only),
		attributes.Build(attributes.ID("NAS-IPv6-Address"),
			attributes.CopyLatestValue,
			attributes.RFC3162,
			attributes.Overridable(),
			attributes.CopyValues,
			attributes.V6Only),
		attributes.Build(attributes.ID("NAS-Port-Type"),
			attributes.CopyLatestValue,
			attributes.RFC2865,
			attributes.Overridable(),
			attributes.CopyValues),
		attributes.Build(attributes.ID("Service-Type"),
			attributes.CopyLatestValue,
			attributes.RFC2865,
			attributes.Overridable(),
			attributes.CopyValues),
		attributes.Build(attributes.ID("User-Name"),
			attributes.CopyFromResponse,
			attributes.RFC2865,
			attributes.Overridable(),
			attributes.CopyValues),
	}

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
		commonRequest)

	MABAccountingStart = slices.Concat(commonAccounting)

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
		commonRequest)

	PAPAccountingStart = slices.Concat(commonAccounting)

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
		commonRequest)

	PEAPAccountingStart = slices.Concat(commonAccounting)

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
		commonRequest)

	EAPTLSAccountingStart = slices.Concat(commonAccounting)
)
