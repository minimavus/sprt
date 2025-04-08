package variables

import (
	"net/http"
)

const (
	TLSVersionTLSv1  = "TLSv1"
	TLSVersionTLSv11 = "TLSv1_1"
	TLSVersionTLSv12 = "TLSv1_2"
	TLSVersionTLSv13 = "TLSv1_3"
)

var (
	tlsParams = []Parameter{
		NewRadioParameter("tlsVersion", "Allowed TLS versions", []Option[string]{
			{Value: TLSVersionTLSv1, Label: "TLS v1.0"},
			{Value: TLSVersionTLSv11, Label: "TLS v1.1"},
			{Value: TLSVersionTLSv12, Label: "TLS v1.2"},
		}, TLSVersionTLSv12).
			SetUpdateOnChange([]string{"allowedCiphers"}),
		NewLoadableSelectParameter("allowedCiphers", "Allowed ciphers",
			NewLoadParams("/generate/tls/ciphers", http.MethodGet).
				WithApiPrefix().
				SetResultType(LoadParamsResultTypeGroups).
				SetResultPaging(false).
				SetRequest(map[string]any{"version": "{{.tlsVersion}}"}).
				SetResultAttribute("ciphers").
				SetResultFields("name", "id"),
		).SetMulti(true).SetAdvanced(true),
		NewCheckboxParameter("validateServer", false, "Validate server"),
		NewLoadableSelectParameter("trustedCertificates", "Trusted CA/Root certificates",
			NewLoadParams("/certificates/trusted", http.MethodGet).
				WithApiPrefix().
				SetResultType(LoadParamsResultTypeTable).
				SetResultPaging(true).
				SetResultAttribute("trusted").
				SetResultFields("friendly_name", "id").
				SetResultColumns(LoadableResultColumns{
					{Title: "Friendly Name", Field: "friendly_name"},
					{Title: "Subject", Field: "subject"},
				}).
				SetResultObjectPath(".certificates"),
		).SetMulti(true).
			Watch(NewWatch(".validateServer").
				When(false, act{A: UseActionHide, T: ".trustedCertificates"}).
				When(true, act{A: UseActionShow, T: ".trustedCertificates"})),
		NewRadioParameter("validateFailAction", "Action if failed to validate server's certificate", []Option[string]{
			{Value: "drop", Label: "Drop session"},
			{Value: "inform", Label: "Sent TLS alert to the server"},
		}, "inform").
			Watch(NewWatch(".validateServer").
				When(false, act{A: UseActionHide, T: ".validateFailAction"}).
				When(true, act{A: UseActionShow, T: ".validateFailAction"})),
	}
)

var cipherSuites = map[string]string{
	// TLS 1.0/1.1
	"TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA":  "ECDHE-ECDSA-AES256-SHA",
	"TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA":    "ECDHE-RSA-AES256-SHA",
	"TLS_DHE_RSA_WITH_AES_256_CBC_SHA":      "DHE-RSA-AES256-SHA",
	"TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA":  "ECDHE-ECDSA-AES128-SHA",
	"TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA":    "ECDHE-RSA-AES128-SHA",
	"TLS_DHE_RSA_WITH_AES_128_CBC_SHA":      "DHE-RSA-AES128-SHA",
	"TLS_ECDHE_PSK_WITH_AES_256_CBC_SHA384": "ECDHE-PSK-AES256-CBC-SHA384",
	"TLS_ECDHE_PSK_WITH_AES_256_CBC_SHA":    "ECDHE-PSK-AES256-CBC-SHA",
	"TLS_SRP_SHA_RSA_WITH_AES_256_CBC_SHA":  "SRP-RSA-AES-256-CBC-SHA",
	"TLS_SRP_SHA_WITH_AES_256_CBC_SHA":      "SRP-AES-256-CBC-SHA",
	"TLS_RSA_PSK_WITH_AES_256_CBC_SHA384":   "RSA-PSK-AES256-CBC-SHA384",
	"TLS_DHE_PSK_WITH_AES_256_CBC_SHA384":   "DHE-PSK-AES256-CBC-SHA384",
	"TLS_RSA_PSK_WITH_AES_256_CBC_SHA":      "RSA-PSK-AES256-CBC-SHA",
	"TLS_DHE_PSK_WITH_AES_256_CBC_SHA":      "DHE-PSK-AES256-CBC-SHA",
	"TLS_RSA_WITH_AES_256_CBC_SHA":          "AES256-SHA",
	"TLS_PSK_WITH_AES_256_CBC_SHA384":       "PSK-AES256-CBC-SHA384",
	"TLS_PSK_WITH_AES_256_CBC_SHA":          "PSK-AES256-CBC-SHA",
	"TLS_ECDHE_PSK_WITH_AES_128_CBC_SHA256": "ECDHE-PSK-AES128-CBC-SHA256",
	"TLS_ECDHE_PSK_WITH_AES_128_CBC_SHA":    "ECDHE-PSK-AES128-CBC-SHA",
	"TLS_SRP_SHA_RSA_WITH_AES_128_CBC_SHA":  "SRP-RSA-AES-128-CBC-SHA",
	"TLS_SRP_SHA_WITH_AES_128_CBC_SHA":      "SRP-AES-128-CBC-SHA",
	"TLS_RSA_PSK_WITH_AES_128_CBC_SHA256":   "RSA-PSK-AES128-CBC-SHA256",
	"TLS_DHE_PSK_WITH_AES_128_CBC_SHA256":   "DHE-PSK-AES128-CBC-SHA256",
	"TLS_RSA_PSK_WITH_AES_128_CBC_SHA":      "RSA-PSK-AES128-CBC-SHA",
	"TLS_DHE_PSK_WITH_AES_128_CBC_SHA":      "DHE-PSK-AES128-CBC-SHA",
	"TLS_RSA_WITH_AES_128_CBC_SHA":          "AES128-SHA",
	"TLS_PSK_WITH_AES_128_CBC_SHA256":       "PSK-AES128-CBC-SHA256",
	"TLS_PSK_WITH_AES_128_CBC_SHA":          "PSK-AES128-CBC-SHA",

	// TLS 1.2
	"TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384":       "ECDHE-ECDSA-AES256-GCM-SHA384",
	"TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384":         "ECDHE-RSA-AES256-GCM-SHA384",
	"TLS_DHE_RSA_WITH_AES_256_GCM_SHA384":           "DHE-RSA-AES256-GCM-SHA384",
	"TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256": "ECDHE-ECDSA-CHACHA20-POLY1305",
	"TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256":   "ECDHE-RSA-CHACHA20-POLY1305",
	"TLS_DHE_RSA_WITH_CHACHA20_POLY1305_SHA256":     "DHE-RSA-CHACHA20-POLY1305",
	"TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256":       "ECDHE-ECDSA-AES128-GCM-SHA256",
	"TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256":         "ECDHE-RSA-AES128-GCM-SHA256",
	"TLS_DHE_RSA_WITH_AES_128_GCM_SHA256":           "DHE-RSA-AES128-GCM-SHA256",
	"TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA384":       "ECDHE-ECDSA-AES256-SHA384",
	"TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA384":         "ECDHE-RSA-AES256-SHA384",
	"TLS_DHE_RSA_WITH_AES_256_CBC_SHA256":           "DHE-RSA-AES256-SHA256",
	"TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA256":       "ECDHE-ECDSA-AES128-SHA256",
	"TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA256":         "ECDHE-RSA-AES128-SHA256",
	"TLS_DHE_RSA_WITH_AES_128_CBC_SHA256":           "DHE-RSA-AES128-SHA256",
	"TLS_RSA_PSK_WITH_AES_256_GCM_SHA384":           "RSA-PSK-AES256-GCM-SHA384",
	"TLS_DHE_PSK_WITH_AES_256_GCM_SHA384":           "DHE-PSK-AES256-GCM-SHA384",
	"TLS_RSA_PSK_WITH_CHACHA20_POLY1305_SHA256":     "RSA-PSK-CHACHA20-POLY1305",
	"TLS_DHE_PSK_WITH_CHACHA20_POLY1305_SHA256":     "DHE-PSK-CHACHA20-POLY1305",
	"TLS_ECDHE_PSK_WITH_CHACHA20_POLY1305_SHA256":   "ECDHE-PSK-CHACHA20-POLY1305",
	"TLS_RSA_WITH_AES_256_GCM_SHA384":               "AES256-GCM-SHA384",
	"TLS_PSK_WITH_AES_256_GCM_SHA384":               "PSK-AES256-GCM-SHA384",
	"TLS_PSK_WITH_CHACHA20_POLY1305_SHA256":         "PSK-CHACHA20-POLY1305",
	"TLS_RSA_PSK_WITH_AES_128_GCM_SHA256":           "RSA-PSK-AES128-GCM-SHA256",
	"TLS_DHE_PSK_WITH_AES_128_GCM_SHA256":           "DHE-PSK-AES128-GCM-SHA256",
	"TLS_RSA_WITH_AES_128_GCM_SHA256":               "AES128-GCM-SHA256",
	"TLS_PSK_WITH_AES_128_GCM_SHA256":               "PSK-AES128-GCM-SHA256",
	"TLS_RSA_WITH_AES_256_CBC_SHA256":               "AES256-SHA256",
	"TLS_RSA_WITH_AES_128_CBC_SHA256":               "AES128-SHA256",

	// TLS 1.3
	"TLS_AES_256_GCM_SHA384":       "TLS_AES_256_GCM_SHA384",
	"TLS_CHACHA20_POLY1305_SHA256": "TLS_CHACHA20_POLY1305_SHA256",
	"TLS_AES_128_GCM_SHA256":       "TLS_AES_128_GCM_SHA256",
}

func opensslToOption(openssl string) OptionWithName[bool] {
	for k, v := range cipherSuites {
		if v == openssl {
			return OptionWithName[bool]{Name: openssl, Label: k, Value: true}
		}
	}
	return OptionWithName[bool]{Name: openssl, Label: openssl, Value: false}
}

var t1 = []string{
	"ECDHE-ECDSA-AES256-SHA",
	"ECDHE-RSA-AES256-SHA",
	"DHE-RSA-AES256-SHA",
	"ECDHE-ECDSA-AES128-SHA",
	"ECDHE-RSA-AES128-SHA",
	"DHE-RSA-AES128-SHA",
	"ECDHE-PSK-AES256-CBC-SHA",
	"SRP-RSA-AES-256-CBC-SHA",
	"SRP-AES-256-CBC-SHA",
	"RSA-PSK-AES256-CBC-SHA384",
	"DHE-PSK-AES256-CBC-SHA384",
	"RSA-PSK-AES256-CBC-SHA",
	"DHE-PSK-AES256-CBC-SHA",
	"AES256-SHA",
	"PSK-AES256-CBC-SHA384",
	"PSK-AES256-CBC-SHA",
	"ECDHE-PSK-AES128-CBC-SHA",
	"SRP-RSA-AES-128-CBC-SHA",
	"SRP-AES-128-CBC-SHA",
	"RSA-PSK-AES128-CBC-SHA256",
	"DHE-PSK-AES128-CBC-SHA256",
	"RSA-PSK-AES128-CBC-SHA",
	"DHE-PSK-AES128-CBC-SHA",
	"AES128-SHA",
	"PSK-AES128-CBC-SHA256",
	"PSK-AES128-CBC-SHA",
}

func tls1() []OptionWithName[bool] {
	res := make([]OptionWithName[bool], 0, len(t1))
	for _, v := range t1 {
		res = append(res, opensslToOption(v))
	}
	return res
}

var tls1Ciphers = []OptionsGroup[bool]{
	{Name: "tls1-ciphers", Label: "TLSv1.0/1.1 cipher suites", Options: tls1()},
}

var t2 = []string{
	"ECDHE-ECDSA-AES256-GCM-SHA384",
	"ECDHE-RSA-AES256-GCM-SHA384",
	"DHE-RSA-AES256-GCM-SHA384",
	"ECDHE-ECDSA-CHACHA20-POLY1305",
	"ECDHE-RSA-CHACHA20-POLY1305",
	"DHE-RSA-CHACHA20-POLY1305",
	"ECDHE-ECDSA-AES128-GCM-SHA256",
	"ECDHE-RSA-AES128-GCM-SHA256",
	"DHE-RSA-AES128-GCM-SHA256",
	"ECDHE-ECDSA-AES256-SHA384",
	"ECDHE-RSA-AES256-SHA384",
	"DHE-RSA-AES256-SHA256",
	"ECDHE-ECDSA-AES128-SHA256",
	"ECDHE-RSA-AES128-SHA256",
	"DHE-RSA-AES128-SHA256",
	"RSA-PSK-AES256-GCM-SHA384",
	"DHE-PSK-AES256-GCM-SHA384",
	"RSA-PSK-CHACHA20-POLY1305",
	"DHE-PSK-CHACHA20-POLY1305",
	"ECDHE-PSK-CHACHA20-POLY1305",
	"AES256-GCM-SHA384",
	"PSK-AES256-GCM-SHA384",
	"PSK-CHACHA20-POLY1305",
	"RSA-PSK-AES128-GCM-SHA256",
	"DHE-PSK-AES128-GCM-SHA256",
	"AES128-GCM-SHA256",
	"PSK-AES128-GCM-SHA256",
	"AES256-SHA256",
	"AES128-SHA256",
}

func tls2Specific() []OptionWithName[bool] {
	res := make([]OptionWithName[bool], 0, len(t2))
	for _, v := range t2 {
		res = append(res, opensslToOption(v))
	}
	return res
}

var tls2Ciphers = append(tls1Ciphers,
	OptionsGroup[bool]{Name: "tls12-ciphers", Label: "TLSv1.2 specific", Options: tls2Specific()})

var CiphersMap = map[string][]OptionsGroup[bool]{
	TLSVersionTLSv1:  tls1Ciphers,
	TLSVersionTLSv11: tls1Ciphers,
	TLSVersionTLSv12: tls2Ciphers,
}
