package certificates

import (
	"archive/tar"
	"archive/zip"
	"bytes"
	"compress/bzip2"
	"compress/gzip"
	"crypto/dsa"
	"crypto/ecdsa"
	"crypto/ed25519"
	"crypto/rsa"
	ogx509 "crypto/x509"
	"encoding/asn1"
	"encoding/pem"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/volatiletech/null/v8"
	"github.com/zmap/zcrypto/x509"

	"github.com/cisco-open/sprt/frontend-svc/internal/utils"
	"github.com/cisco-open/sprt/frontend-svc/models"
)

var (
	pemCertificateBlock = regexp.MustCompile(`(-----BEGIN CERTIFICATE-----[a-zA-Z0-9+=/\s]+-----END CERTIFICATE-----)`)
	archFiles           = regexp.MustCompile(`[.](tar|tgz|tbz|zip|tar\.gz)$`)
	tarArchives         = regexp.MustCompile(`[.](tar|tgz|tbz|tar\.gz)$`)
	derFiles            = regexp.MustCompile(`[.](der|cer|crt)$`)
	textFiles           = regexp.MustCompile(`[.](txt|pem|log|out)$`)

	ErrorNoCertificatesFound = errors.New("no certificates found")
)

type supportedFileType int

const (
	unknownFileType supportedFileType = iota
	archiveFileType
	derFileType
	textFileType
)

// SearchCertificatesInPEM searches for certificates in a PEM encoded data
func SearchCertificatesInPEM(data string, owner string, t models.CertType, options ...ParseOption) ([]*models.Certificate, error) {
	blocks := pemCertificateBlock.FindAll([]byte(data), -1)
	if len(blocks) == 0 {
		return nil, ErrorNoCertificatesFound
	}

	certs := make([]*models.Certificate, 0, len(blocks))
	for i, block := range blocks {
		cert, err := ParseCertificate(block, options...)
		if err != nil {
			return nil, fmt.Errorf("failed to parse certificate %d: %w", i, err)
		}
		cert.Owner = owner
		cert.Type = t
		certs = append(certs, cert)
	}

	return certs, nil
}

// SearchCertificatesInFile searches for certificates in an uploaded file
func SearchCertificatesInFile(file *multipart.FileHeader, owner string, t models.CertType) ([]*models.Certificate, error) {
	var (
		certs []*models.Certificate
		err   error
	)

	switch fileType(file.Filename) {
	case archiveFileType:
		certs, err = searchInArchive(file)
	case derFileType:
		certs, err = searchInDER(file)
	case textFileType:
		certs, err = searchInText(file)
	default:
		return nil, errors.New("unsupported file type")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to search for certificates in file: %w", err)
	}

	for _, cert := range certs {
		cert.Owner = owner
		cert.Type = t
	}

	return certs, nil
}

// ParseCertificate parses a certificate from a PEM encoded data
func ParseCertificate(data []byte, options ...ParseOption) (*models.Certificate, error) {
	// log.Debug().Msg("parsing certificate from PEM")
	config := newDefaultParseConfig()
	config.apply(options...)

	// log.Debug().Msg("decoding PEM block")
	block, _ := pem.Decode(data)
	if block == nil {
		return nil, errors.New("not a valid PEM block")
	}

	// log.Debug().Msg("parsing x509 certificate from decoded PEM block")
	cert, err := x509.ParseCertificate(block.Bytes)
	if err != nil {
		return nil, fmt.Errorf("malformed certificate")
	}

	// log.Debug().Msg("converting x509 certificate to model")
	return x509CertificateToModel(cert, string(data), config)
}

func x509CertificateToModel(cert *x509.Certificate, content string, cfg *parseConfig) (*models.Certificate, error) {
	keys, err := createKeys(cert, cfg)
	if err != nil {
		return nil, fmt.Errorf("failed to create keys: %w", err)
	}

	return &models.Certificate{
		FriendlyName: null.StringFrom(reverseRDNSequence(cert.Subject.ToRDNSequence())),
		Content:      content,
		Keys:         keys.asNullJSON(),
		Subject:      null.StringFrom(reverseRDNSequence(cert.Subject.ToRDNSequence())),
		Serial:       null.StringFrom(strings.ToUpper(splitHEX(cert.SerialNumber.Text(16)))),
		Thumbprint:   null.StringFrom(strings.ToUpper(splitHEX(cert.FingerprintSHA1.Hex()))),
		Issuer:       null.StringFrom(reverseRDNSequence(cert.Issuer.ToRDNSequence())),
		ValidFrom:    null.TimeFrom(cert.NotBefore),
		ValidTo:      null.TimeFrom(cert.NotAfter),
		SelfSigned:   null.BoolFrom(isSelfSigned(cert)),
	}, nil
}

func isSelfSigned(cert *x509.Certificate) bool {
	return (cert.Issuer.String() == cert.Subject.String()) ||
		(cert.AuthorityKeyId != nil && cert.SubjectKeyId != nil && bytes.Equal(cert.AuthorityKeyId, cert.SubjectKeyId))
}

func (k *keys) asNullJSON() null.JSON {
	result := null.JSON{}
	_ = result.Marshal(k)
	return result
}

func createKeys(cert *x509.Certificate, cfg *parseConfig) (*keys, error) {
	// log.Debug().Msg("creating keys")
	var (
		keys      = keys{}
		blockType string
		err       error
		pkBytes   []byte
	)

	switch cert.PublicKey.(type) {
	case *rsa.PublicKey:
		keys.Type = "RSA"
		blockType = "RSA PUBLIC KEY"
		pkBytes, err = x509.MarshalPKIXPublicKey(cert.PublicKey)
	case *ecdsa.PublicKey:
		keys.Type = "EC"
		blockType = "EC PUBLIC KEY"
		pkBytes, err = x509.MarshalPKIXPublicKey(cert.PublicKey)
	case *dsa.PublicKey:
		keys.Type = "DSA"
		blockType = "DSA PUBLIC KEY"
		pkBytes, err = asn1.Marshal(cert.PublicKey)
	case *ed25519.PublicKey:
		keys.Type = "Ed25519"
		blockType = "PUBLIC KEY"
		pkBytes, err = x509.MarshalPKIXPublicKey(cert.PublicKey)
	default:
		return nil, errors.New("unsupported public key type")
	}

	if err != nil {
		return nil, fmt.Errorf("failed to marshal public key: %w", err)
	}

	keys.Public = string(pem.EncodeToMemory(&pem.Block{
		Type:  blockType,
		Bytes: pkBytes,
	}))

	if cfg.privateKey != nil {
		keys.Private, err = decryptPrivateKey(cfg.privateKey, cfg.privateKeyPassword, cert.PublicKeyAlgorithm)
		if err != nil {
			return nil, fmt.Errorf("failed to decrypt private key: %w", err)
		}
	}

	// log.Debug().Msg("keys created")
	return &keys, nil
}

func isArchiveFile(filename string) bool {
	return archFiles.MatchString(filename)
}

func isArchiveTar(filename string) bool {
	return tarArchives.MatchString(filename)
}

func isDERFile(filename string) bool {
	return derFiles.MatchString(filename)
}

func isTextFile(filename string) bool {
	return textFiles.MatchString(filename)
}

// fileType returns the type of the file
func fileType(filename string) supportedFileType {
	if isArchiveFile(filename) {
		return archiveFileType
	}
	if isDERFile(filename) {
		return derFileType
	}
	if isTextFile(filename) {
		return textFileType
	}
	return unknownFileType
}

// searchInArchive searches for certificates in an archive file
func searchInArchive(file *multipart.FileHeader) ([]*models.Certificate, error) {
	// log.Debug().Str("file", file.Filename).Msg("searching for certificates in archive")
	if isArchiveTar(file.Filename) {
		return searchInTar(file)
	}
	return searchInZIP(file)
}

// searchInTar searches for certificates in a TAR file (unzips it and searches for certificates in the files)
func searchInTar(file *multipart.FileHeader) ([]*models.Certificate, error) {
	// log.Debug().Str("file", file.Filename).Msg("searching for certificates in tar")
	var (
		uncompressedStream io.Reader
		err                error
		src                multipart.File
	)

	src, err = file.Open()
	if err != nil {
		return nil, err
	}
	defer src.Close()

	switch filepath.Ext(file.Filename) {
	case ".tar":
		uncompressedStream = src
	case ".tgz", ".tar.gz", ".gz":
		uncompressedStream, err = gzip.NewReader(src)
	case ".tbz":
		uncompressedStream = bzip2.NewReader(src)
	}
	if err != nil {
		return nil, fmt.Errorf("failed to decompress file '%s': %w", file.Filename, err)
	}

	foundCertificates := make([]*models.Certificate, 0)
	tarReader := tar.NewReader(uncompressedStream)
	for {
		header, err := tarReader.Next()
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, fmt.Errorf("failed to read tar file '%s': %w", file.Filename, err)
		}

		if header.Typeflag == tar.TypeReg {
			t := fileType(header.Name)
			if t == derFileType || t == textFileType {
				fileContent, err := io.ReadAll(tarReader)
				if err != nil {
					return nil, fmt.Errorf("failed to read file '%s' from tar: %w", header.Name, err)
				}

				if t == derFileType {
					c, err := ParseCertificate(derBytesToPEMBytes(fileContent, "CERTIFICATE"))
					if err != nil {
						return nil, fmt.Errorf("failed to parse certificate from file '%s': %w", header.Name, err)
					}
					foundCertificates = append(foundCertificates, c)
				}
				if t == textFileType {
					certs, err := SearchCertificatesInPEM(string(fileContent), "", models.CertTypeIdentity)
					if err != nil {
						return nil, fmt.Errorf("failed to search for certificates in file '%s': %w", header.Name, err)
					}
					foundCertificates = append(foundCertificates, certs...)
				}
			}
		}
	}

	return foundCertificates, nil
}

// searchInZIP searches for certificates in a ZIP file (unzips it and searches for certificates in the files)
func searchInZIP(file *multipart.FileHeader) ([]*models.Certificate, error) {
	// log.Debug().Str("file", file.Filename).Msg("searching for certificates in zip")
	src, err := file.Open()
	if err != nil {
		return nil, err
	}
	defer src.Close()

	zipReader, err := zip.NewReader(src, file.Size)
	if err != nil {
		return nil, fmt.Errorf("failed to read zip file '%s': %w", file.Filename, err)
	}

	foundCertificates := make([]*models.Certificate, 0)
	for _, file := range zipReader.File {
		if file.FileInfo().IsDir() {
			continue
		}
		// log.Debug().Str("file", file.Name).Msg("verifying file from zip")
		t := fileType(file.Name)
		if t == derFileType || t == textFileType {
			fileReader, err := file.Open()
			if err != nil {
				return nil, fmt.Errorf("failed to open file '%s' from zip: %w", file.Name, err)
			}
			fileContent, err := io.ReadAll(fileReader)
			if err != nil {
				return nil, fmt.Errorf("failed to read file '%s' from zip: %w", file.Name, err)
			}

			if t == derFileType {
				c, err := ParseCertificate(derBytesToPEMBytes(fileContent, "CERTIFICATE"))
				if err != nil {
					return nil, fmt.Errorf("failed to parse certificate from file '%s': %w", file.Name, err)
				}
				foundCertificates = append(foundCertificates, c)
			}
			if t == textFileType {
				certs, err := SearchCertificatesInPEM(string(fileContent), "", models.CertTypeIdentity)
				if err != nil {
					return nil, fmt.Errorf("failed to search for certificates in file '%s': %w", file.Name, err)
				}
				foundCertificates = append(foundCertificates, certs...)
			}
		}
	}

	return foundCertificates, nil
}

// searchInDER searches for certificates in a DER file (reads and parses it as a single certificate)
func searchInDER(file *multipart.FileHeader) ([]*models.Certificate, error) {
	// log.Debug().Str("file", file.Filename).Msg("searching for certificates in der")
	src, err := file.Open()
	if err != nil {
		return nil, err
	}
	defer src.Close()

	b, err := io.ReadAll(src)
	if err != nil {
		return nil, fmt.Errorf("failed to read file '%s': %w", file.Filename, err)
	}

	c, err := ParseCertificate(derBytesToPEMBytes(b, "CERTIFICATE"))
	if err != nil {
		return nil, fmt.Errorf("failed to parse certificate from file '%s': %w", file.Filename, err)
	}

	return []*models.Certificate{c}, nil
}

// derBytesToPEMBytes converts DER bytes to PEM bytes
func derBytesToPEMBytes(derBytes []byte, blockType string) []byte {
	return pem.EncodeToMemory(&pem.Block{
		Type:  blockType,
		Bytes: derBytes,
	})
}

// searchInText searches for certificates in a text file
func searchInText(file *multipart.FileHeader) ([]*models.Certificate, error) {
	// log.Debug().Str("file", file.Filename).Msg("searching for certificates in text")
	src, err := file.Open()
	if err != nil {
		return nil, err
	}
	defer src.Close()

	b, err := io.ReadAll(src)
	if err != nil {
		return nil, fmt.Errorf("failed to read file '%s': %w", file.Filename, err)
	}

	// we don't care about the owner and type here, as they will be set later
	return SearchCertificatesInPEM(string(b), "", models.CertTypeIdentity)
}

// decryptPrivateKey decrypts a private key using the given password and returns it as a PEM encoded string
func decryptPrivateKey(privateKey []byte, password string, alg x509.PublicKeyAlgorithm) (string, error) {
	var (
		decryptedDer []byte
		err          error
	)
	if password == "" {
		if strings.Contains(string(privateKey), "--BEGIN") {
			var pemBlock *pem.Block
			pemBlock, _ = pem.Decode(privateKey)
			if pemBlock == nil {
				return "", errors.New("failed to decode private key: no PEM block found")
			}
			decryptedDer = pemBlock.Bytes
		} else {
			decryptedDer = privateKey
		}
	} else {
		var pemBlock *pem.Block
		pemBlock, _ = pem.Decode(privateKey)
		if pemBlock == nil {
			return "", errors.New("failed to decode private key: no PEM block found")
		}

		decryptedDer, err = x509.DecryptPEMBlock(pemBlock, []byte(password))
		if err != nil {
			return "", fmt.Errorf("failed to decrypt private key: %w", err)
		}
	}

	var bytes []byte

	switch alg {
	case x509.RSA:
		privateKey, err := tryPKCS1OrPKCS8PrivateKey(decryptedDer, ogx509.ParsePKCS1PrivateKey)
		if err != nil {
			return "", err
		}
		bytes = x509.MarshalPKCS1PrivateKey(privateKey)
	case x509.ECDSA:
		privateKey, err := tryPKCS1OrPKCS8PrivateKey(decryptedDer, ogx509.ParseECPrivateKey)
		if err != nil {
			return "", err
		}
		bytes, err = ogx509.MarshalECPrivateKey(privateKey)
		if err != nil {
			return "", fmt.Errorf("failed to marshal EC private key: %w", err)
		}
	case x509.DSA:
		privateKey, err := parseDSAPrivateKey(decryptedDer)
		if err != nil {
			return "", fmt.Errorf("failed to parse DSA private key: %w", err)
		}
		bytes, err = marshalDSAPrivateKey(privateKey)
		if err != nil {
			return "", fmt.Errorf("failed to marshal DSA private key: %w", err)
		}
	case x509.Ed25519:
		privateKey, err := tryPKCS1OrPKCS8PrivateKey[*ed25519.PrivateKey](decryptedDer, nil)
		if err != nil {
			return "", err
		}
		bytes, err = ogx509.MarshalPKCS8PrivateKey(privateKey)
		if err != nil {
			return "", fmt.Errorf("failed to marshal Ed25519 private key: %w", err)
		}
	default:
		return "", fmt.Errorf("unsupported public key algorithm: %s", alg.String())
	}

	return string(pem.EncodeToMemory(&pem.Block{Type: "PRIVATE KEY", Bytes: bytes})), nil
}

type pkcs1Parser[T any] func(der []byte) (T, error)

func tryPKCS1OrPKCS8PrivateKey[T any](der []byte, p pkcs1Parser[T]) (T, error) {
	if p != nil {
		privateKey, err := p(der)
		if err == nil {
			return privateKey, nil
		}
	}

	pkcs8Key, err := ogx509.ParsePKCS8PrivateKey(der)
	if err != nil {
		return utils.Zero[T](), fmt.Errorf("failed to parse PKCS8 private key: %w", err)
	}

	privateKey, ok := pkcs8Key.(T)
	if !ok {
		return utils.Zero[T](), errors.New("failed to parse PKCS8 private key: invalid type")
	}

	return privateKey, nil
}
