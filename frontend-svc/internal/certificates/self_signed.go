package certificates

import (
	"bytes"
	"context"
	"crypto/ecdsa"
	"crypto/ed25519"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha1"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/asn1"
	"encoding/pem"
	"fmt"
	"math/big"
	"net"
	"time"

	"github.com/google/uuid"
	"github.com/volatiletech/null/v8"

	"github.com/cisco-open/sprt/frontend-svc/internal/config"
	"github.com/cisco-open/sprt/frontend-svc/internal/db"
	"github.com/cisco-open/sprt/frontend-svc/models"
)

type (
	GenerateOptions struct {
		SerialNumber       *big.Int
		Subject            pkix.Name
		NotBefore          time.Time
		NotAfter           time.Time
		KeyUsage           x509.KeyUsage
		ExtKeyUsage        []x509.ExtKeyUsage
		IsCA               bool
		Hosts              []string
		SignatureAlgorithm x509.SignatureAlgorithm
		RsaBits            int
		EcdsaCurve         string
	}

	Out struct {
		Cert       []byte
		PrivateKey []byte
		PublicKey  []byte
	}
)

func publicKey(priv any) any {
	switch k := priv.(type) {
	case *rsa.PrivateKey:
		return &k.PublicKey
	case *ecdsa.PrivateKey:
		return &k.PublicKey
	case ed25519.PrivateKey:
		return k.Public().(ed25519.PublicKey)
	default:
		return nil
	}
}

func generatePrivateKey(curve string, rsaBits int) (any, error) {
	switch curve {
	case "":
		if rsaBits == 0 {
			rsaBits = 2048
		}
		return rsa.GenerateKey(rand.Reader, rsaBits)
	case "P224":
		return ecdsa.GenerateKey(elliptic.P224(), rand.Reader)
	case "P256":
		return ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	case "P384":
		return ecdsa.GenerateKey(elliptic.P384(), rand.Reader)
	case "P521":
		return ecdsa.GenerateKey(elliptic.P521(), rand.Reader)
	default:
		return nil, fmt.Errorf("unrecognized elliptic curve: %q", curve)
	}
}

func getSerialNumber(provided *big.Int) (*big.Int, error) {
	if provided != nil {
		return provided, nil
	}

	serialNumberLimit := new(big.Int).Lsh(big.NewInt(1), 128)
	return rand.Int(rand.Reader, serialNumberLimit)
}

func generateSKI(pubKey []byte) ([]byte, error) {
	var pubKeyInfo struct {
		Algo      pkix.AlgorithmIdentifier
		BitString asn1.BitString
	}

	_, err := asn1.Unmarshal(pubKey, &pubKeyInfo)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal public key: %w", err)
	}

	h := sha1.Sum(pubKeyInfo.BitString.Bytes)
	return h[:], nil
}

func GenerateSelfSigned(opts GenerateOptions) (*Out, error) {
	var priv any
	var err error

	priv, err = generatePrivateKey(opts.EcdsaCurve, opts.RsaBits)

	if err != nil {
		return nil, fmt.Errorf("failed to generate private key: %w", err)
	}

	rawPublicKey := publicKey(priv)
	pubBytes, err := x509.MarshalPKIXPublicKey(rawPublicKey)
	if err != nil {
		return nil, fmt.Errorf("unable to marshal public key: %w", err)
	}

	subjectKeyId, err := generateSKI(pubBytes)
	if err != nil {
		return nil, fmt.Errorf("failed to generate subject key id: %w", err)
	}

	// ECDSA, ED25519 and RSA subject keys should have the DigitalSignature
	// KeyUsage bits set in the x509.Certificate template
	var keyUsage x509.KeyUsage

	if opts.KeyUsage != 0 {
		keyUsage = opts.KeyUsage
	} else {
		keyUsage = x509.KeyUsageDigitalSignature

		// Only RSA subject keys should have the KeyEncipherment KeyUsage bits set. In
		// the context of TLS this KeyUsage is particular to RSA key exchange and
		// authentication.
		if _, isRSA := priv.(*rsa.PrivateKey); isRSA {
			keyUsage |= x509.KeyUsageKeyEncipherment
		}

		keyUsage |= x509.KeyUsageDataEncipherment
		keyUsage |= x509.KeyUsageKeyAgreement
		keyUsage |= x509.KeyUsageContentCommitment
	}

	var extKeyUsage []x509.ExtKeyUsage
	if opts.ExtKeyUsage != nil {
		extKeyUsage = opts.ExtKeyUsage
	} else {
		extKeyUsage = []x509.ExtKeyUsage{x509.ExtKeyUsageServerAuth, x509.ExtKeyUsageClientAuth}
	}

	serialNumber, err := getSerialNumber(opts.SerialNumber)
	if err != nil {
		return nil, fmt.Errorf("failed to generate serial number: %w", err)
	}

	template := x509.Certificate{
		SerialNumber:   serialNumber,
		Subject:        opts.Subject,
		NotBefore:      opts.NotBefore,
		NotAfter:       opts.NotAfter,
		AuthorityKeyId: subjectKeyId,

		SignatureAlgorithm:    opts.SignatureAlgorithm,
		KeyUsage:              keyUsage,
		ExtKeyUsage:           extKeyUsage,
		BasicConstraintsValid: true,
	}

	for _, h := range opts.Hosts {
		if ip := net.ParseIP(h); ip != nil {
			template.IPAddresses = append(template.IPAddresses, ip)
		} else {
			template.DNSNames = append(template.DNSNames, h)
		}
	}

	if opts.IsCA {
		template.IsCA = true
		template.KeyUsage |= x509.KeyUsageCertSign
	}

	derBytes, err := x509.CreateCertificate(rand.Reader, &template, &template, rawPublicKey, priv)
	if err != nil {
		return nil, fmt.Errorf("failed to create certificate: %w", err)
	}

	certOut := &bytes.Buffer{}
	if err := pem.Encode(certOut, &pem.Block{Type: "CERTIFICATE", Bytes: derBytes}); err != nil {
		return nil, fmt.Errorf("failed to write data: %w", err)
	}

	keyOut := &bytes.Buffer{}
	privBytes, err := x509.MarshalPKCS8PrivateKey(priv)
	if err != nil {
		return nil, fmt.Errorf("unable to marshal private key: %w", err)
	}

	if err := pem.Encode(keyOut, &pem.Block{Type: "PRIVATE KEY", Bytes: privBytes}); err != nil {
		return nil, fmt.Errorf("failed to write data: %w", err)
	}

	publicKeyOut := &bytes.Buffer{}
	if err := pem.Encode(publicKeyOut, &pem.Block{Type: "PUBLIC KEY", Bytes: pubBytes}); err != nil {
		return nil, fmt.Errorf("failed to write data: %w", err)
	}

	return &Out{
		Cert:       certOut.Bytes(),
		PrivateKey: keyOut.Bytes(),
		PublicKey:  publicKeyOut.Bytes(),
	}, nil
}

func AddDefaultSelfSignedSigningCertificate(ctx context.Context, app *config.AppConfig, user string) error {
	opts := GenerateOptions{
		Subject: pkix.Name{
			CommonName:         fmt.Sprintf("%s-SCEP-signer", user),
			OrganizationalUnit: []string{"SPRT SCEP"},
		},
		NotBefore: time.Now(),
		NotAfter:  time.Now().AddDate(5, 0, 0),
		IsCA:      true,
		RsaBits:   4096,
	}

	cert, err := GenerateSelfSigned(opts)
	if err != nil {
		return fmt.Errorf("failed to generate self-signed certificate: %w", err)
	}

	id, err := uuid.NewV7()
	if err != nil {
		return fmt.Errorf("failed to generate UUID: %w", err)
	}

	parsed, err := ParseCertificate(cert.Cert, WithPrivateKey(cert.PrivateKey))
	if err != nil {
		return fmt.Errorf("failed to parse certificate: %w", err)
	}

	parsed.ID = id.String()
	parsed.Owner = user
	parsed.Type = "signer"
	parsed.FriendlyName = null.StringFrom(fmt.Sprintf("%s-SCEP-signer", user))

	_, err = db.Exec(app).StoreCertificates(ctx, models.CertificateSlice{parsed})
	if err != nil {
		return fmt.Errorf("failed to store self-signed certificate: %w", err)
	}

	return nil
}
