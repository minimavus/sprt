package certificates

import (
	"bytes"
	"context"
	"crypto/ed25519"
	"crypto/rand"
	ogx509 "crypto/x509"
	ogjson "encoding/json"
	"encoding/pem"
	"errors"
	"fmt"
	"io"
	"os"
	"strings"
	"time"

	"github.com/aarondl/null/v8"
	"github.com/zmap/zcrypto/x509"

	"github.com/cisco-open/sprt/go-generator/sdk/app"
	"github.com/cisco-open/sprt/go-generator/sdk/db"
	"github.com/cisco-open/sprt/go-generator/sdk/db/models"
)

var ErrNoKeys = errors.New("no keys")

type (
	extraCertFields struct {
		Decoded     *x509.Certificate `json:"decoded,omitempty"`
		DecodeError error             `json:"decode_error,omitempty"`
		Chain       *Certificate      `json:"chain,omitempty"`
		Body        string            `json:"body,omitempty"`
	}

	safeCertificate struct {
		ID                 string          `json:"id"`
		Owner              string          `json:"owner"`
		FriendlyName       null.String     `json:"friendly_name,omitempty"`
		Type               models.CertType `json:"type"`
		Subject            null.String     `json:"subject,omitempty"`
		Serial             null.String     `json:"serial,omitempty"`
		Thumbprint         null.String     `json:"thumbprint,omitempty"`
		Issuer             null.String     `json:"issuer,omitempty"`
		ValidFrom          null.Time       `json:"valid_from,omitempty"`
		ValidTo            null.Time       `json:"valid_to,omitempty"`
		IsExpired          bool            `json:"is_expired"`
		SelfSigned         null.Bool       `json:"self_signed,omitempty"`
		Decoded            map[string]any  `json:"decoded,omitempty"`
		DecodeError        string          `json:"decode_error,omitempty"`
		Chain              *Certificate    `json:"chain,omitempty"`
		InvalidationReason string          `json:"invalidation_reason,omitempty"`
		Body               string          `json:"body,omitempty"`
	}

	keys struct {
		Type    string `json:"type,omitempty"`
		Public  string `json:"public,omitempty"`
		Private string `json:"private,omitempty"`
	}

	Certificate struct {
		models.Certificate
		extraCertFields

		invalidationReason string
		keys               *keys
		keepBody           bool
	}
)

var _ ogjson.Marshaler = (*Certificate)(nil)

func FromModels(m models.Certificate) Certificate {
	return Certificate{Certificate: m, extraCertFields: extraCertFields{
		Body: m.Content,
	}}
}

func FromX509(c *ogx509.Certificate) (Certificate, error) {
	s := &strings.Builder{}
	err := pem.Encode(s, &pem.Block{Type: "CERTIFICATE", Bytes: c.Raw})
	if err != nil {
		return Certificate{}, err
	}

	zc, err := CommonToZ(c)
	if err != nil {
		return Certificate{}, err
	}

	config := newDefaultParseConfig()
	m, err := x509CertificateToModel(zc, s.String(), config)
	if err != nil {
		return Certificate{}, err
	}
	return FromModels(*m), nil
}

func FromInvalidCertificate(c InvalidCertificate) Certificate {
	return Certificate{
		Certificate:        *c.Certificate,
		invalidationReason: c.Reason,
	}
}

func FromModelsSlice(sl models.CertificateSlice) []*Certificate {
	r := make([]*Certificate, 0, len(sl))
	for _, s := range sl {
		if s != nil {
			ref := FromModels(*s)
			r = append(r, &ref)
		}
	}
	return r
}

func FromInvalidCertificateSlice(sl []InvalidCertificate) []*Certificate {
	r := make([]*Certificate, 0, len(sl))
	for _, s := range sl {
		ref := FromInvalidCertificate(s)
		r = append(r, &ref)
	}
	return r
}

func (c *Certificate) IsInFile() bool {
	return strings.HasPrefix(c.Content, "file:/")
}

func (c *Certificate) Decode() (err error) {
	if c.Content == "" {
		err = errors.New("empty certificate")
		c.DecodeError = err
		return
	}

	var der []byte

	if c.IsInFile() {
		der, err = c.loadFile()
		if err != nil {
			err = fmt.Errorf("failed to load certificate: %w", err)
			c.DecodeError = err
			return
		}
	} else {
		der = []byte(c.Content)
	}

	block, _ := pem.Decode(der)
	if block == nil {
		err = errors.New("not a PEM")
		c.DecodeError = err
		return
	}

	cert, err := x509.ParseCertificate(block.Bytes)
	if err != nil {
		err = fmt.Errorf("failed to parse certificate: %w", err)
		c.DecodeError = err
		return
	}

	c.Decoded = cert
	c.DecodeError = nil
	return nil
}

func (c *Certificate) loadFile() ([]byte, error) {
	file := strings.TrimPrefix(c.Content, "file:")
	f, err := os.ReadFile(file)
	if err != nil {
		return nil, err
	}
	return f, nil
}

func (c *Certificate) isSelfSigned() bool {
	if c.SelfSigned.Valid {
		return c.SelfSigned.Bool
	}

	if len(c.Decoded.SubjectKeyId) == 0 {
		return true
	}

	return bytes.Compare(c.Decoded.SubjectKeyId, c.Decoded.AuthorityKeyId) == 0
}

func (c *Certificate) isExpired() bool {
	if c.ValidTo.Valid {
		return c.ValidTo.Time.Before(time.Now())
	}
	return false
}

func (c *Certificate) LoadChain(ctx context.Context, app app.App) error {
	if c.isSelfSigned() {
		return nil
	}

	issuerCertRaw, err := db.Exec(app).GetCertificateBySubject(ctx, c.Certificate.Issuer.String, c.Owner)
	if err != nil {
		return err
	}
	if issuerCertRaw == nil {
		return nil
	}

	issuerCert := FromModels(*issuerCertRaw)
	c.Chain = &issuerCert

	return c.Chain.LoadChain(ctx, app)
}

func (c *Certificate) getReader() (io.Reader, int64, error) {
	if c.IsInFile() {
		file, err := os.Open(strings.TrimPrefix(c.Content, "file:"))
		if err != nil {
			return nil, 0, err
		}

		stat, err := file.Stat()
		if err != nil {
			return nil, 0, err
		}

		return file, stat.Size(), nil
	}

	return strings.NewReader(c.Content), int64(len(c.Content)), nil
}

func (c *Certificate) loadKeys() error {
	if c.keys != nil {
		return nil
	}

	if !c.Keys.Valid {
		return ErrNoKeys
	}

	var k keys

	if err := c.Keys.Unmarshal(&k); err != nil {
		return fmt.Errorf("failed to unmarshal keys: %w", err)
	}

	c.keys = &k

	return nil
}

func (c *Certificate) encryptPrivateKey(password string) ([]byte, error) {
	if err := c.loadKeys(); err != nil {
		return nil, err
	}

	if c.keys.Private == "" {
		return nil, nil
	}

	switch strings.ToLower(c.keys.Type) {
	case "ecc", "ecdsa":
		return c.encryptECCKey(password)
	case "dsa":
		return c.encryptDSAKey(password)
	case "ed25519":
		return c.encryptEd25519Key(password)
	default:
		return c.encryptRSAKey(password)
	}
}

func (c *Certificate) encryptECCKey(password string) ([]byte, error) {
	block, _ := pem.Decode([]byte(c.keys.Private))
	if block == nil {
		return nil, errors.New("not a PEM")
	}

	key, err := ogx509.ParseECPrivateKey(block.Bytes)
	if err != nil {
		return nil, fmt.Errorf("failed to parse private key: %w", err)
	}

	bytes, err := ogx509.MarshalECPrivateKey(key)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal private key: %w", err)
	}

	return encryptAndEncodePrivateKey(bytes, "EC PRIVATE KEY", password)
}

func (c *Certificate) encryptDSAKey(password string) ([]byte, error) {
	block, _ := pem.Decode([]byte(c.keys.Private))
	if block == nil {
		return nil, errors.New("not a PEM")
	}

	key, err := parseDSAPrivateKey(block.Bytes)
	if err != nil {
		return nil, fmt.Errorf("failed to parse private key: %w", err)
	}

	bytes, err := marshalDSAPrivateKey(key)

	return encryptAndEncodePrivateKey(bytes, "DSA PRIVATE KEY", password)
}

func (c *Certificate) encryptRSAKey(password string) ([]byte, error) {
	block, _ := pem.Decode([]byte(c.keys.Private))
	if block == nil {
		return nil, errors.New("not a PEM")
	}

	key, err := ogx509.ParsePKCS1PrivateKey(block.Bytes)
	if err != nil {
		return nil, fmt.Errorf("failed to parse private key: %w", err)
	}

	bytes := ogx509.MarshalPKCS1PrivateKey(key)

	return encryptAndEncodePrivateKey(bytes, "RSA PRIVATE KEY", password)
}

func (c *Certificate) encryptEd25519Key(password string) ([]byte, error) {
	block, _ := pem.Decode([]byte(c.keys.Private))
	if block == nil {
		return nil, errors.New("not a PEM")
	}

	key, err := ogx509.ParsePKCS8PrivateKey(block.Bytes)
	if err != nil {
		return nil, fmt.Errorf("failed to parse private key: %w", err)
	}

	edKey, ok := key.(ed25519.PrivateKey)
	if !ok {
		return nil, errors.New("invalid private key type")
	}

	bytes, err := ogx509.MarshalPKCS8PrivateKey(edKey)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal private key: %w", err)
	}

	return encryptAndEncodePrivateKey(bytes, "PRIVATE KEY", password)
}

func encryptAndEncodePrivateKey(bytes []byte, blockType, password string) ([]byte, error) {
	enc, err := x509.EncryptPEMBlock(rand.Reader, blockType, bytes, []byte(password), x509.PEMCipherAES256)
	if err != nil {
		return nil, fmt.Errorf("failed to encrypt private key: %w", err)
	}

	return pem.EncodeToMemory(enc), nil
}

func CommonToZ(x *ogx509.Certificate) (*x509.Certificate, error) {
	return x509.ParseCertificate(x.Raw)
}

func ZToCommon(z *x509.Certificate) (*ogx509.Certificate, error) {
	return ogx509.ParseCertificate(z.Raw)
}

func (c *Certificate) GetPrivateKey() (any, error) {
	if err := c.loadKeys(); err != nil {
		return nil, err
	}

	if c.keys.Private == "" {
		return nil, nil
	}

	block, _ := pem.Decode([]byte(c.keys.Private))

	switch strings.ToLower(c.keys.Type) {
	case "ecc":
		return ogx509.ParseECPrivateKey(block.Bytes)
	case "dsa":
		return parseDSAPrivateKey(block.Bytes)
	case "ed25519", "ecdsa", "ecdh":
		return ogx509.ParsePKCS8PrivateKey(block.Bytes)
	default:
		return ogx509.ParsePKCS1PrivateKey(block.Bytes)
	}
}
