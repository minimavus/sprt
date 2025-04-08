package variables

import "slices"

var (
	copyLatestValue     = value("Copy Latest Value")
	copyFromResponse    = value("Copy From Response")
	calculate           = value("Calculate")
	fromCredentialsList = value("From the credentials list")
	eapData             = value("EAP and TLS data")

	copyValues = customValues([]string{"Copy Latest Value", "Copy From Response"})

	rfc2865 = dictionary("rfc2865")
	rfc2866 = dictionary("rfc2866")
	rfc2869 = dictionary("rfc2869")
	rfc3579 = dictionary("rfc3579")

	commonRequest = []RadiusAttribute{
		buildAttribute(id("Acct-Session-Id"), value("$SESSION_ID$"), rfc2866, nonRemovable()),
		buildAttribute(id("Calling-Station-Id"), value("$MAC$"), rfc2865, overwritable(), customValues([]string{"$MAC$"})),
		buildAttribute(id("Called-Station-Id"), value("00-00-00-FF-FF-FF"), rfc2865, overwritable()),
		buildAttribute(id("NAS-IP-Address"), value("$NAS_IP$"), rfc2865, overwritable(), customValues([]string{"$NAS_IP$"})),
		buildAttribute(id("NAS-Port-Type"), value("$PORT_TYPE$"), rfc2865, overwritable(), customValues([]string{"$PORT_TYPE$"})),
		buildAttribute(id("Message-Authenticator"), calculate, rfc2869, overwritable(), customValues([]string{"Calculate"})),
		buildAttribute(id("Framed-MTU"), value("$MTU$"), rfc2865, overwritable(), customValues([]string{"$MTU$"})),
	}

	commonAccounting = []RadiusAttribute{
		buildAttribute(id("Acct-Authentic"), value("RADIUS"), rfc2866, overwritable()),
		buildAttribute(id("Acct-Session-Id"), copyLatestValue, rfc2866, overwritable(), copyValues),
		buildAttribute(id("Acct-Status-Type"), value("Start"), rfc2866, overwritable()),
		buildAttribute(id("Called-Station-Id"), copyLatestValue, rfc2865, overwritable(), copyValues),
		buildAttribute(id("Calling-Station-Id"), copyLatestValue, rfc2865, overwritable(), copyValues),
		buildAttribute(id("Class"), copyFromResponse, rfc2865, overwritable(), copyValues),
		buildAttribute(id("Framed-IP-Address"), value("$IP$"), rfc2865, overwritable(), customValues([]string{"$IP$"})),
		buildAttribute(id("NAS-IP-Address"), copyLatestValue, rfc2865, overwritable(), copyValues),
		buildAttribute(id("NAS-Port-Type"), copyLatestValue, rfc2865, overwritable(), copyValues),
		buildAttribute(id("Service-Type"), copyLatestValue, rfc2865, overwritable(), copyValues),
		buildAttribute(id("User-Name"), copyFromResponse, rfc2865, overwritable(), copyValues),
	}

	MABAccessRequest = slices.Concat(
		[]RadiusAttribute{
			buildAttribute(id("Service-Type"), value("Call-Check"), rfc2865, nonRemovable()),
			buildAttribute(id("User-Name"), value("Same as MAC address"), rfc2865, nonRemovable()),
		},
		commonRequest)

	MABAccountingStart = slices.Concat(commonAccounting)

	PAPAccessRequest = slices.Concat(
		[]RadiusAttribute{
			buildAttribute(id("Service-Type"), value("Framed-User"), rfc2865, nonRemovable()),
			buildAttribute(id("User-Name"), fromCredentialsList, rfc2865, nonRemovable()),
			buildAttribute(id("User-Password"), fromCredentialsList, rfc2865, nonRemovable()),
		},
		commonRequest)

	PAPAccountingStart = slices.Concat(commonAccounting)

	PEAPAccessRequest = slices.Concat(
		[]RadiusAttribute{
			buildAttribute(id("Service-Type"), value("Framed-User"), rfc2865, nonRemovable()),
			buildAttribute(id("User-Name"), value("$USERNAME$"), rfc2865, nonRemovable()),
			buildAttribute(id("EAP-Message"), eapData, rfc3579, nonRemovable()),
		},
		commonRequest)

	PEAPAccountingStart = slices.Concat(commonAccounting)

	EAPTLSAccessRequest = slices.Concat(
		[]RadiusAttribute{
			buildAttribute(id("Service-Type"), value("Framed-User"), rfc2865, nonRemovable()),
			buildAttribute(id("User-Name"), value("$USERNAME$"), rfc2865, nonRemovable()),
			buildAttribute(id("EAP-Message"), eapData, rfc3579, nonRemovable()),
		},
		commonRequest)

	EAPTLSAccountingStart = slices.Concat(commonAccounting)
)

type buildOption func(*RadiusAttribute)

func id(id string) buildOption {
	return func(ra *RadiusAttribute) {
		ra.ID = id
	}
}

func value(value string) buildOption {
	return func(ra *RadiusAttribute) {
		ra.Value = value
	}
}

func dictionary(dictionary string) buildOption {
	return func(ra *RadiusAttribute) {
		ra.Dictionary = dictionary
	}
}

func overwritable() buildOption {
	return func(ra *RadiusAttribute) {
		ra.Overwrite = true
	}
}

func nonRemovable() buildOption {
	return func(ra *RadiusAttribute) {
		ra.NonRemovable = true
	}
}

func vendor(vendor string) buildOption {
	return func(ra *RadiusAttribute) {
		ra.Vendor = vendor
	}
}

func customValues(customValues []string) buildOption {
	return func(ra *RadiusAttribute) {
		ra.CustomValues = customValues
	}
}

func buildAttribute(opts ...buildOption) RadiusAttribute {
	ra := RadiusAttribute{}
	for _, opt := range opts {
		opt(&ra)
	}
	return ra
}
