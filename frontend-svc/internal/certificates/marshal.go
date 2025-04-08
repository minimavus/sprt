package certificates

import (
	"crypto/ecdsa"
	"crypto/ed25519"
	"crypto/rsa"
	"encoding/hex"
	"strings"
	"time"

	"github.com/zmap/zcrypto/encoding/asn1"
	"github.com/zmap/zcrypto/x509"
	"github.com/zmap/zcrypto/x509/pkix"

	"github.com/cisco-open/sprt/frontend-svc/internal/json"
)

func (c Certificate) MarshalJSON() ([]byte, error) {
	s := safeCertificate{
		ID:                 c.ID,
		Owner:              c.Owner,
		FriendlyName:       c.FriendlyName,
		Type:               c.Type,
		Subject:            c.Subject,
		Serial:             c.Serial,
		Thumbprint:         c.Thumbprint,
		Issuer:             c.Issuer,
		ValidFrom:          c.ValidFrom,
		ValidTo:            c.ValidTo,
		IsExpired:          c.isExpired(),
		SelfSigned:         c.SelfSigned,
		Decoded:            populateDecoded(c.Decoded),
		Chain:              c.Chain,
		InvalidationReason: c.invalidationReason,
	}

	if c.DecodeError != nil {
		s.DecodeError = c.DecodeError.Error()
	}

	if c.keepBody {
		s.Body = c.Body
	}

	return json.Marshal(s)
}

func (c *Certificate) KeepBody(keep bool) {
	c.keepBody = keep
}

func isExtensionCritical(cert *x509.Certificate, oid asn1.ObjectIdentifier) bool {
	for _, ext := range cert.Extensions {
		if ext.Id.Equal(oid) {
			return ext.Critical
		}
	}
	return false
}

func isKeyUsageCritical(cert *x509.Certificate) bool {
	return isExtensionCritical(cert, []int{2, 5, 29, 15})
}

func isBasicConstraintsCritical(cert *x509.Certificate) bool {
	return isExtensionCritical(cert, []int{2, 5, 29, 19})
}

func keyUsageToStrings(c *x509.Certificate) []string {
	var usage []string

	ku := c.KeyUsage

	if ku&x509.KeyUsageDigitalSignature != 0 {
		usage = append(usage, "Digital Signature")
	}
	if ku&x509.KeyUsageContentCommitment != 0 {
		usage = append(usage, "Content Commitment")
	}
	if ku&x509.KeyUsageKeyEncipherment != 0 {
		usage = append(usage, "Key Encipherment")
	}
	if ku&x509.KeyUsageDataEncipherment != 0 {
		usage = append(usage, "Data Encipherment")
	}
	if ku&x509.KeyUsageKeyAgreement != 0 {
		usage = append(usage, "Key Agreement")
	}
	if ku&x509.KeyUsageCertSign != 0 {
		usage = append(usage, "Cert Sign")
	}
	if ku&x509.KeyUsageCRLSign != 0 {
		usage = append(usage, "CRL Sign")
	}
	if ku&x509.KeyUsageEncipherOnly != 0 {
		usage = append(usage, "Encipher Only")
	}
	if ku&x509.KeyUsageDecipherOnly != 0 {
		usage = append(usage, "Decipher Only")
	}

	return usage
}

func extKeyUsageToString(ekus []x509.ExtKeyUsage, unknown []asn1.ObjectIdentifier) []string {
	usage := make([]string, 0, len(ekus)+len(unknown))
	for _, eku := range ekus {
		switch eku {
		case x509.ExtKeyUsageAny:
			usage = append(usage, "Any")
		case x509.ExtKeyUsageAppleCodeSigning:
			usage = append(usage, "Apple Code Signing")
		case x509.ExtKeyUsageAppleCodeSigningDevelopment:
			usage = append(usage, "Apple Code Signing Development")
		case x509.ExtKeyUsageAppleSoftwareUpdateSigning:
			usage = append(usage, "Apple Software Update Signing")
		case x509.ExtKeyUsageAppleCodeSigningThirdParty:
			usage = append(usage, "Apple Code Signing Third Party")
		case x509.ExtKeyUsageAppleResourceSigning:
			usage = append(usage, "Apple Resource Signing")
		case x509.ExtKeyUsageAppleIchatSigning:
			usage = append(usage, "Apple iChat Signing")
		case x509.ExtKeyUsageAppleIchatEncryption:
			usage = append(usage, "Apple iChat Encryption")
		case x509.ExtKeyUsageAppleSystemIdentity:
			usage = append(usage, "Apple System Identity")
		case x509.ExtKeyUsageAppleCryptoEnv:
			usage = append(usage, "Apple Crypto Env")
		case x509.ExtKeyUsageAppleCryptoProductionEnv:
			usage = append(usage, "Apple Crypto Production Env")
		case x509.ExtKeyUsageAppleCryptoMaintenanceEnv:
			usage = append(usage, "Apple Crypto Maintenance Env")
		case x509.ExtKeyUsageAppleCryptoTestEnv:
			usage = append(usage, "Apple Crypto Test Env")
		case x509.ExtKeyUsageAppleCryptoDevelopmentEnv:
			usage = append(usage, "Apple Crypto Development Env")
		case x509.ExtKeyUsageAppleCryptoQos:
			usage = append(usage, "Apple Crypto QOS")
		case x509.ExtKeyUsageAppleCryptoTier0Qos:
			usage = append(usage, "Apple Crypto Tier0 QOS")
		case x509.ExtKeyUsageAppleCryptoTier1Qos:
			usage = append(usage, "Apple Crypto Tier1 QOS")
		case x509.ExtKeyUsageAppleCryptoTier2Qos:
			usage = append(usage, "Apple Crypto Tier2 QOS")
		case x509.ExtKeyUsageAppleCryptoTier3Qos:
			usage = append(usage, "Apple Crypto Tier3 QOS")
		case x509.ExtKeyUsageAdobeAuthenticDocumentTrust:
			usage = append(usage, "Adobe Authentic Document Trust")
		case x509.ExtKeyUsageMicrosoftCertTrustListSigning:
			usage = append(usage, "Microsoft Cert Trust List Signing")
		case x509.ExtKeyUsageMicrosoftQualifiedSubordinate:
			usage = append(usage, "Microsoft Qualified Subordinate")
		case x509.ExtKeyUsageMicrosoftKeyRecovery3:
			usage = append(usage, "Microsoft Key Recovery3")
		case x509.ExtKeyUsageMicrosoftDocumentSigning:
			usage = append(usage, "Microsoft Document Signing")
		case x509.ExtKeyUsageMicrosoftLifetimeSigning:
			usage = append(usage, "Microsoft Lifetime Signing")
		case x509.ExtKeyUsageMicrosoftMobileDeviceSoftware:
			usage = append(usage, "Microsoft Mobile Device Software")
		case x509.ExtKeyUsageMicrosoftSmartDisplay:
			usage = append(usage, "Microsoft Smart Display")
		case x509.ExtKeyUsageMicrosoftCspSignature:
			usage = append(usage, "Microsoft CSP Signature")
		case x509.ExtKeyUsageMicrosoftTimestampSigning:
			usage = append(usage, "Microsoft Timestamp Signing")
		case x509.ExtKeyUsageMicrosoftServerGatedCrypto:
			usage = append(usage, "Microsoft Server Gated Crypto")
		case x509.ExtKeyUsageMicrosoftSgcSerialized:
			usage = append(usage, "Microsoft SGC Serialized")
		case x509.ExtKeyUsageMicrosoftEncryptedFileSystem:
			usage = append(usage, "Microsoft Encrypted File System")
		case x509.ExtKeyUsageMicrosoftEfsRecovery:
			usage = append(usage, "Microsoft EFS Recovery")
		case x509.ExtKeyUsageMicrosoftWhqlCrypto:
			usage = append(usage, "Microsoft WHQL Crypto")
		case x509.ExtKeyUsageMicrosoftNt5Crypto:
			usage = append(usage, "Microsoft NT5 Crypto")
		case x509.ExtKeyUsageMicrosoftOemWhqlCrypto:
			usage = append(usage, "Microsoft OEM WHQL Crypto")
		case x509.ExtKeyUsageMicrosoftEmbeddedNtCrypto:
			usage = append(usage, "Microsoft Embedded NT Crypto")
		case x509.ExtKeyUsageMicrosoftRootListSigner:
			usage = append(usage, "Microsoft Root List Signer")
		case x509.ExtKeyUsageMicrosoftDrm:
			usage = append(usage, "Microsoft DRM")
		case x509.ExtKeyUsageMicrosoftDrmIndividualization:
			usage = append(usage, "Microsoft DRM Individualization")
		case x509.ExtKeyUsageMicrosoftLicenses:
			usage = append(usage, "Microsoft Licenses")
		case x509.ExtKeyUsageMicrosoftLicenseServer:
			usage = append(usage, "Microsoft License Server")
		case x509.ExtKeyUsageMicrosoftEnrollmentAgent:
			usage = append(usage, "Microsoft Enrollment Agent")
		case x509.ExtKeyUsageMicrosoftSmartcardLogon:
			usage = append(usage, "Microsoft Smartcard Logon")
		case x509.ExtKeyUsageMicrosoftCaExchange:
			usage = append(usage, "Microsoft CA Exchange")
		case x509.ExtKeyUsageMicrosoftKeyRecovery21:
			usage = append(usage, "Microsoft Key Recovery21")
		case x509.ExtKeyUsageMicrosoftSystemHealth:
			usage = append(usage, "Microsoft System Health")
		case x509.ExtKeyUsageMicrosoftSystemHealthLoophole:
			usage = append(usage, "Microsoft System Health Loophole")
		case x509.ExtKeyUsageMicrosoftKernelModeCodeSigning:
			usage = append(usage, "Microsoft Kernel Mode Code Signing")
		case x509.ExtKeyUsageServerAuth:
			usage = append(usage, "Server Auth")
		case x509.ExtKeyUsageDvcs:
			usage = append(usage, "DVCS")
		case x509.ExtKeyUsageSbgpCertAaServiceAuth:
			usage = append(usage, "SBGP Cert AA Service Auth")
		case x509.ExtKeyUsageEapOverPpp:
			usage = append(usage, "EAP Over PPP")
		case x509.ExtKeyUsageEapOverLan:
			usage = append(usage, "EAP Over LAN")
		case x509.ExtKeyUsageClientAuth:
			usage = append(usage, "Client Auth")
		case x509.ExtKeyUsageCodeSigning:
			usage = append(usage, "Code Signing")
		case x509.ExtKeyUsageEmailProtection:
			usage = append(usage, "Email Protection")
		case x509.ExtKeyUsageIpsecEndSystem:
			usage = append(usage, "IPSEC End System")
		case x509.ExtKeyUsageIpsecTunnel:
			usage = append(usage, "IPSEC Tunnel")
		case x509.ExtKeyUsageIpsecUser:
			usage = append(usage, "IPSEC User")
		case x509.ExtKeyUsageTimeStamping:
			usage = append(usage, "Time Stamping")
		case x509.ExtKeyUsageOcspSigning:
			usage = append(usage, "OCSP Signing")
		case x509.ExtKeyUsageIpsecIntermediateSystemUsage:
			usage = append(usage, "IPSEC Intermediate System Usage")
		case x509.ExtKeyUsageNetscapeServerGatedCrypto:
			usage = append(usage, "Netscape Server Gated Crypto")
		}
	}

	for _, oid := range unknown {
		usage = append(usage, oid.String())
	}

	return usage
}

func splitHEX(s string) (result string) {
	for i, r := range s {
		if (i)%2 == 0 && i != 0 {
			result += ":"
		}
		result += string(r)
	}
	return
}

func reverseRDNSequence(seq pkix.RDNSequence) string {
	var result string
	for i, r := range seq {
		result += pkix.RDNSequence{r}.String()
		if i < len(seq)-1 {
			result += ", "
		}
	}
	return result
}

func getPublicKeySize(pubKey interface{}) int {
	switch pubKey.(type) {
	case *rsa.PublicKey:
		return pubKey.(*rsa.PublicKey).Size() * 8
	case *ecdsa.PublicKey:
		return pubKey.(*ecdsa.PublicKey).Params().BitSize
	case ed25519.PublicKey:
		return ed25519.PublicKeySize * 8
	}
	return 0
}

func populateDecoded(c *x509.Certificate) (populated map[string]any) {
	if c == nil {
		return
	}

	populated = make(map[string]any)
	populated["keyUsage"] = map[string]any{
		"critical": isKeyUsageCritical(c),
		"usage":    keyUsageToStrings(c),
	}
	populated["notAfter"] = c.NotAfter
	populated["notBefore"] = c.NotBefore
	populated["subject"] = reverseRDNSequence(c.Subject.ToRDNSequence())
	populated["issuer"] = reverseRDNSequence(c.Issuer.ToRDNSequence())
	populated["signature"] = c.SignatureAlgorithmName()
	populated["version"] = c.Version
	populated["basicConstraints"] = map[string]any{
		"critical":       isBasicConstraintsCritical(c),
		"valid":          c.BasicConstraintsValid,
		"isCA":           c.IsCA,
		"maxPathLen":     c.MaxPathLen,
		"maxPathLenZero": c.MaxPathLenZero,
	}
	populated["extKeyUsage"] = extKeyUsageToString(c.ExtKeyUsage, c.UnknownExtKeyUsage)
	populated["pubKey"] = map[string]any{
		"algo": c.PublicKeyAlgorithmName(),
		"size": getPublicKeySize(c.PublicKey),
	}
	populated["san"] = map[string]any{
		"dnsNames":       c.DNSNames,
		"emailAddresses": c.EmailAddresses,
		"ipAddresses":    c.IPAddresses,
		"uris":           c.URIs,
	}
	populated["aki"] = strings.ToUpper(splitHEX(hex.EncodeToString(c.AuthorityKeyId)))
	populated["ski"] = strings.ToUpper(splitHEX(hex.EncodeToString(c.SubjectKeyId)))
	populated["serial"] = strings.ToUpper(splitHEX(c.SerialNumber.Text(16)))
	populated["isRoot"] = c.IsCA && c.BasicConstraintsValid && len(c.AuthorityKeyId) == 0
	populated["isExpired"] = c.NotAfter.Before(time.Now())

	return
}
