package attributes

import "github.com/cisco-open/sprt/go-generator/sdk/iputils"

type (
	buildOption func(*RadiusAttribute)

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
)

var (
	CopyLatestValue     = Value("Copy Latest Value")
	CopyFromResponse    = Value("Copy From Response")
	Calculate           = Value("Calculate")
	FromCredentialsList = Value("From the credentials list")
	EAPData             = Value("EAP and TLS data")

	CopyValues = CustomValues([]string{"Copy Latest Value", "Copy From Response"})

	RFC2865 = Dictionary("rfc2865")
	RFC2866 = Dictionary("rfc2866")
	RFC2869 = Dictionary("rfc2869")
	RFC3579 = Dictionary("rfc3579")
	RFC3162 = Dictionary("rfc3162")

	V4Only = FamilySpecific(iputils.IPv4)
	V6Only = FamilySpecific(iputils.IPv6)
)

func ID(id string) buildOption {
	return func(ra *RadiusAttribute) {
		ra.ID = id
	}
}

func Value(value string) buildOption {
	return func(ra *RadiusAttribute) {
		ra.Value = value
	}
}

func Dictionary(dictionary string) buildOption {
	return func(ra *RadiusAttribute) {
		ra.Dictionary = dictionary
	}
}

func Overridable() buildOption {
	return func(ra *RadiusAttribute) {
		ra.Overwrite = true
	}
}

func NonRemovable() buildOption {
	return func(ra *RadiusAttribute) {
		ra.NonRemovable = true
	}
}

func Vendor(vendor string) buildOption {
	return func(ra *RadiusAttribute) {
		ra.Vendor = vendor
	}
}

func CustomValues(customValues []string) buildOption {
	return func(ra *RadiusAttribute) {
		ra.CustomValues = customValues
	}
}

func FamilySpecific(family iputils.IPFamily) buildOption {
	return func(ra *RadiusAttribute) {
		ra.FamilySpecific = family
	}
}

func Build(opts ...buildOption) RadiusAttribute {
	ra := RadiusAttribute{}
	for _, opt := range opts {
		opt(&ra)
	}
	return ra
}
