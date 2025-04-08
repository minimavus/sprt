package scep

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/asn1"
	"fmt"

	"github.com/smallstep/scep/x509util"

	"github.com/cisco-open/sprt/frontend-svc/internal/certificates"
)

func newRSAKey(bits int) (*rsa.PrivateKey, error) {
	private, err := rsa.GenerateKey(rand.Reader, bits)
	if err != nil {
		return nil, err
	}
	return private, nil
}

func newECDSAKey(curve string) (*ecdsa.PrivateKey, error) {
	switch curve {
	case "P-224":
		return ecdsa.GenerateKey(elliptic.P224(), rand.Reader)
	case "P-256":
		return ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	case "P-384":
		return ecdsa.GenerateKey(elliptic.P384(), rand.Reader)
	case "P-521":
		return ecdsa.GenerateKey(elliptic.P521(), rand.Reader)
	default:
		return nil, fmt.Errorf("unsupported curve: %s", curve)
	}
}

func keyUsageFlagsToKeyUsage(flags certificates.KeyUsageFlags) x509.KeyUsage {
	var keyUsage x509.KeyUsage
	if flags.CRlSign {
		keyUsage |= x509.KeyUsageCRLSign
	}
	if flags.KeyCertSign {
		keyUsage |= x509.KeyUsageCertSign
	}
	if flags.DecipherOnly {
		keyUsage |= x509.KeyUsageDecipherOnly
	}
	if flags.EncipherOnly {
		keyUsage |= x509.KeyUsageEncipherOnly
	}
	if flags.KeyAgreement {
		keyUsage |= x509.KeyUsageKeyAgreement
	}
	if flags.NonRepudiation {
		keyUsage |= x509.KeyUsageContentCommitment
	}
	if flags.KeyEncipherment {
		keyUsage |= x509.KeyUsageKeyEncipherment
	}
	if flags.DataEncipherment {
		keyUsage |= x509.KeyUsageDataEncipherment
	}
	if flags.DigitalSignature {
		keyUsage |= x509.KeyUsageDigitalSignature
	}
	return keyUsage
}

func extKeyUsageFlagsToExtKeyUsage(flags certificates.ExtendedKeyUsageFlags) []x509.ExtKeyUsage {
	var extKeyUsage []x509.ExtKeyUsage
	if flags.ClientAuth {
		extKeyUsage = append(extKeyUsage, x509.ExtKeyUsageClientAuth)
	}
	if flags.ServerAuth {
		extKeyUsage = append(extKeyUsage, x509.ExtKeyUsageServerAuth)
	}
	if flags.CodeSigning {
		extKeyUsage = append(extKeyUsage, x509.ExtKeyUsageCodeSigning)
	}
	if flags.TimeStamping {
		extKeyUsage = append(extKeyUsage, x509.ExtKeyUsageTimeStamping)
	}
	if flags.EmailProtection {
		extKeyUsage = append(extKeyUsage, x509.ExtKeyUsageEmailProtection)
	}
	return extKeyUsage
}

func makeCsrFromTemplate(template certificates.CertTemplateContent) (*x509util.CertificateRequest, error) {
	sanRaw, err := template.SAN.Marshal()
	if err != nil {
		return nil, fmt.Errorf("failed to marshal SAN: %w", err)
	}

	keyUsageRaw, err := marshalKeyUsage(keyUsageFlagsToKeyUsage(template.KeyUsage))
	if err != nil {
		return nil, fmt.Errorf("failed to marshal key usage: %w", err)
	}

	extKeyUsageRaw, err := marshalExtKeyUsage(extKeyUsageFlagsToExtKeyUsage(template.ExtKeyUsage), []asn1.ObjectIdentifier{})
	if err != nil {
		return nil, fmt.Errorf("failed to marshal extended key usage: %w", err)
	}

	csrtemplate := x509util.CertificateRequest{
		CertificateRequest: x509.CertificateRequest{
			Subject: template.Subject.PKIX(),
			ExtraExtensions: []pkix.Extension{
				{
					Id:    oidExtensionSubjectAltName,
					Value: sanRaw,
				},
				keyUsageRaw,
				extKeyUsageRaw,
			},
		},
	}

	return &csrtemplate, nil
}

func getPrivateKeyForTemplate(template certificates.CertTemplateContent) (any, error) {
	switch template.KeyType {
	case "ecdsa":
		return newECDSAKey(template.ECurve)
	default:
		return newRSAKey(template.KeyLength)
	}
}
