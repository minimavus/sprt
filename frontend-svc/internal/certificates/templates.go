package certificates

import (
	"crypto/x509/pkix"
	"encoding/asn1"
	"errors"
	"fmt"
	"net"
	"strings"
	"unicode"

	"github.com/volatiletech/null/v8"

	"github.com/cisco-open/sprt/frontend-svc/models"
)

type (
	KeyUsageFlags struct {
		CRlSign          bool `json:"cRLSign,omitempty" validate:"omitempty"`
		KeyCertSign      bool `json:"keyCertSign,omitempty" validate:"omitempty"`
		DecipherOnly     bool `json:"decipherOnly,omitempty" validate:"omitempty"`
		EncipherOnly     bool `json:"encipherOnly,omitempty" validate:"omitempty"`
		KeyAgreement     bool `json:"keyAgreement,omitempty" validate:"omitempty"`
		NonRepudiation   bool `json:"nonRepudiation,omitempty" validate:"omitempty"`
		KeyEncipherment  bool `json:"keyEncipherment,omitempty" validate:"omitempty"`
		DataEncipherment bool `json:"dataEncipherment,omitempty" validate:"omitempty"`
		DigitalSignature bool `json:"digitalSignature,omitempty" validate:"omitempty"`
	}

	ExtendedKeyUsageFlags struct {
		ClientAuth      bool `json:"clientAuth,omitempty" validate:"omitempty"`
		ServerAuth      bool `json:"serverAuth,omitempty" validate:"omitempty"`
		CodeSigning     bool `json:"codeSigning,omitempty" validate:"omitempty"`
		TimeStamping    bool `json:"timeStamping,omitempty" validate:"omitempty"`
		EmailProtection bool `json:"emailProtection,omitempty" validate:"omitempty"`
	}

	Subject map[string][]string

	SubjectAltName struct {
		RFC822Name    []string `json:"rfc822Name,omitempty" validate:"omitempty"`
		DNSName       []string `json:"dNSName,omitempty" validate:"omitempty"`
		X400Address   []string `json:"x400Address,omitempty" validate:"omitempty"`
		DirectoryName []string `json:"directoryName,omitempty" validate:"omitempty"`
		URI           []string `json:"uniformResourceIdentifier,omitempty" validate:"omitempty"`
		IPAddress     []string `json:"iPAddress,omitempty" validate:"omitempty"`
	}

	CertTemplateContent struct {
		SAN         SubjectAltName        `json:"san,omitempty" validate:"omitempty"`
		Subject     Subject               `json:"subject"`
		KeyType     string                `json:"key_type" validate:"required,oneof=rsa ecdsa"`
		KeyUsage    KeyUsageFlags         `json:"key_usage,omitempty" validate:"omitempty"`
		KeyLength   int                   `json:"key_length,omitempty" validate:"omitempty"`
		ECurve      string                `json:"e_curve,omitempty" validate:"omitempty,oneof=P-224 P-256 P-384 P-521"`
		ExtKeyUsage ExtendedKeyUsageFlags `json:"ext_key_usage,omitempty" validate:"omitempty"`
	}
)

var RDNOrder = []string{"cn", "ou", "o", "l", "st", "c", "dc"}

func (c *CertTemplateContent) PopulateModel(m *models.Template) error {
	if c == nil {
		return errors.New("template content is empty")
	}

	content := null.JSON{}
	if err := content.Marshal(c); err != nil {
		return err
	}

	m.Subject = null.StringFrom(c.Subject.String())
	m.Content = content

	return nil
}

func (s *Subject) String() string {
	if s == nil {
		return ""
	}

	res := ""

	for _, k := range RDNOrder {
		if v, ok := (*s)[k]; ok {
			for _, val := range v {
				res += strings.ToUpper(k) + "=" + val + ", "
			}
		}
	}

	return res[:len(res)-2]
}

var (
	oidCountry            = []int{2, 5, 4, 6}
	oidOrganization       = []int{2, 5, 4, 10}
	oidOrganizationalUnit = []int{2, 5, 4, 11}
	oidCommonName         = []int{2, 5, 4, 3}
	oidSurname            = []int{2, 5, 4, 4}
	oidSerialNumber       = []int{2, 5, 4, 5}
	oidLocality           = []int{2, 5, 4, 7}
	oidProvince           = []int{2, 5, 4, 8}
	oidStreetAddress      = []int{2, 5, 4, 9}
	oidPostalCode         = []int{2, 5, 4, 17}
	oidGivenName          = []int{2, 5, 4, 42}
	oidDomainComponent    = []int{0, 9, 2342, 19200300, 100, 1, 25}
	oidDNEmailAddress     = []int{1, 2, 840, 113549, 1, 9, 1}
	// EV
	oidJurisdictionLocality = []int{1, 3, 6, 1, 4, 1, 311, 60, 2, 1, 1}
	oidJurisdictionProvince = []int{1, 3, 6, 1, 4, 1, 311, 60, 2, 1, 2}
	oidJurisdictionCountry  = []int{1, 3, 6, 1, 4, 1, 311, 60, 2, 1, 3}
	// QWACS
	oidOrganizationID = []int{2, 5, 4, 97}
)

func (s *Subject) PKIX() pkix.Name {
	if s == nil {
		return pkix.Name{}
	}

	return pkix.Name{
		CommonName:         cnOrNil((*s)["cn"]),
		Organization:       subjOrNil((*s)["o"]),
		OrganizationalUnit: subjOrNil((*s)["ou"]),
		Locality:           subjOrNil((*s)["l"]),
		Province:           subjOrNil((*s)["st"]),
		Country:            subjOrNil((*s)["c"]),
		ExtraNames:         s.extraNames(),
	}
}

func (s *Subject) extraNames() []pkix.AttributeTypeAndValue {
	dc := (*s)["dc"]
	if len(dc) == 0 {
		return nil
	}

	var extraNames []pkix.AttributeTypeAndValue
	for _, v := range dc {
		extraNames = append(extraNames, pkix.AttributeTypeAndValue{
			Type:  oidDomainComponent,
			Value: v,
		})
	}

	return extraNames
}

func cnOrNil(s []string) string {
	if len(s) == 0 {
		return ""
	}
	return s[0]
}

func subjOrNil(s []string) []string {
	if len(s) == 0 {
		return nil
	}
	return s
}

const (
	nameOtherName     = 0
	nameTypeEmail     = 1
	nameTypeDNS       = 2
	nameX400Address   = 3
	nameDirectoryName = 4
	nameEdiPartyName  = 5
	nameTypeURI       = 6
	nameTypeIP        = 7
)

func (s *SubjectAltName) Marshal() ([]byte, error) {
	var rawValues []asn1.RawValue
	for _, name := range s.DNSName {
		if err := isIA5String(name); err != nil {
			return nil, err
		}
		rawValues = append(rawValues, asn1.RawValue{Tag: nameTypeDNS, Class: 2, Bytes: []byte(name)})
	}
	for _, email := range s.RFC822Name {
		if err := isIA5String(email); err != nil {
			return nil, err
		}
		rawValues = append(rawValues, asn1.RawValue{Tag: nameTypeEmail, Class: 2, Bytes: []byte(email)})
	}
	for _, rawIPStr := range s.IPAddress {
		// If possible, we always want to encode IPv4 addresses in 4 bytes.
		rawIP := net.ParseIP(rawIPStr)
		ip := rawIP.To4()
		if ip == nil {
			ip = rawIP
		}
		rawValues = append(rawValues, asn1.RawValue{Tag: nameTypeIP, Class: 2, Bytes: ip})
	}
	for _, uri := range s.URI {
		if err := isIA5String(uri); err != nil {
			return nil, err
		}
		rawValues = append(rawValues, asn1.RawValue{Tag: nameTypeURI, Class: 2, Bytes: []byte(uri)})
	}
	for _, x400 := range s.X400Address {
		rawValues = append(rawValues, asn1.RawValue{Tag: nameX400Address, Class: 2, Bytes: []byte(x400)})
	}
	for _, dir := range s.DirectoryName {
		rawValues = append(rawValues, asn1.RawValue{Tag: nameDirectoryName, Class: 2, Bytes: []byte(dir)})
	}
	return asn1.Marshal(rawValues)
}

func isIA5String(s string) error {
	for _, r := range s {
		// Per RFC5280 "IA5String is limited to the set of ASCII characters"
		if r > unicode.MaxASCII {
			return fmt.Errorf("x509: %q cannot be encoded as an IA5String", s)
		}
	}

	return nil
}
