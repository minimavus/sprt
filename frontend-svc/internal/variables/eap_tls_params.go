package variables

import (
	"net/http"

	"github.com/cisco-open/sprt/frontend-svc/internal/dictionaries"
)

var (
	eapTlsParams = Params{
		{
			Title:    "EAP-TLS Parameters",
			PropName: "eapTls",
			Parameters: ParamsSlice{
				NewColumnsParameter("eap-tls_params").
					WithColumn(
						NewVariantsParameter("identityCertificates", "Identity certificates").WithVariants(
							NewVariant("selected").
								WithDescription("Select certificates").
								WithShort("Selected").
								WithShowIfChecked(true).
								WithField(
									NewInfoParameter("how_works", "Selected certificates will be used for authentication"),
									NewLoadableSelectParameter("certificates", "Certificates", identityCertificatesLoad).SetMulti(true),
								),
							NewVariant("scep").
								WithDescription("Request from SCEP server").
								WithShort("SCEP").
								WithShowIfChecked(true).
								WithField(
									NewInfoParameter("how_works", "Request a session certificate from SCEP server"),
									NewLoadableSelectParameter("scepServer", "SCEP server",
										NewLoadParams("/scep/servers", http.MethodGet).
											WithApiPrefix().
											SetResultAttribute("scep").
											SetResultType(LoadParamsResultTypeTable).
											SetResultColumns(LoadableResultColumns{
												{Title: "Name", Field: "name"},
												{Title: "URL", Field: "url"},
											}).
											SetResultFields("name", "id").
											SetResultObjectPath(".servers")),
									NewLoadableSelectParameter("template", "CSR template",
										NewLoadParams("/certificates/templates", http.MethodGet).
											WithApiPrefix().
											SetResultAttribute("result").
											SetResultType(LoadParamsResultTypeTable).
											SetResultColumns(LoadableResultColumns{
												{Title: "Friendly Name", Field: "friendly_name"},
												{Title: "Subject", Field: "subject"},
											}).
											SetResultFields("friendly_name", "id").
											SetResultObjectPath(".templates")),
									NewCheckboxParameter("saveIdentityCertificates", false, "Save generated Identity Certificates"),
								),
						),
						NewVariantsParameter("usernames", "EAP Session usernames").WithVariants(
							NewVariant("from-cert-cn").
								WithDescription("Use CN part of Subject").
								WithShort("Certificate - CN").
								WithField(
									NewInfoParameter("how_works", "CN part of Subject field will be used. If CN not found - session will be unsuccessful"),
								),
							NewVariant("from-cert-san-dns").
								WithDescription("Use first found DNS name of SAN").
								WithShort("Certificate - SAN DNS").
								WithField(
									NewInfoParameter("how_works", "First found DNS name of SAN will be used"),
								),
							NewVariant("from-cert-san-pattern").
								WithDescription("Search for SAN matching pattern").
								WithShort("Certificate - SAN pattern").
								WithField(
									NewInfoParameter("how_works", "Every SAN will be checked with pattern, first matched will be used"),
									NewCheckboxesParameter[bool]("sanTypesAllowed", "Include SAN types").
										WithOption("otherName", "Other Name", true).
										WithOption("rfc822Name", "RFC822 Name", true).
										WithOption("dNSName", "DNS Name", true).
										WithOption("iPAddress", "IP Address", true),
									NewTextInputParameter("sanPattern", "Pattern", ".*").SetDescription("RegEx"),
								),
							NewVariant("same-as-mac").
								WithDescription("Same as MAC").
								WithShort("Same as MAC").
								WithField(
									NewInfoParameter("how_works", "$USERNAME$ variable will be replaced with value of $MAC$ variable"),
									NewCheckboxParameter("removeDelimiters", true, "Remove delimiter-characters (-:.) from MAC address to use as username"),
								),
							NewVariant("specified").
								WithDescription("Specify usernames manually").
								WithShort("Specified").
								WithField(
									NewInfoParameter("how_works", "Only specified usernames will be used"),
									NewListParameter("specifiedUsernames", "Usernames", "").
										SetValidate(false).
										SetHint("List of usernames\nOne per line").
										SetAllowFromFile(true),
								),
							NewVariant("dictionary").
								WithDescription("Get usernames from dictionaries").
								WithShort("Dictionary").
								WithField(
									NewDictionaryParameter("dictionaries", []string{},
										[]dictionaries.DictionaryType{dictionaries.Credentials, dictionaries.MAC, dictionaries.Unclassified}),
								),
							NewVariant("random").
								WithDescription("Random username").
								WithShort("Random").
								WithField(
									NewInfoParameter("how_works", "Random username will be created for each session"),
									NewColumnsParameter("length_params").
										WithColumn(NewNumberInputParameter("minLength", "Min username length", 5)).
										WithColumn(NewNumberInputParameter("maxLength", "Max username length", 20)),
								),
						).Watch(NewWatch(".identityCertificates.variant").
							When("selected",
								act{A: UseActionHideValues, T: ".usernames", V: []string{"random"}},
								act{A: UseActionSetValue, T: ".usernames", V: "from-cert-cn"}).
							When("scep",
								act{A: UseActionHideValues, T: ".usernames", V: []string{"from-cert-cn", "from-cert-san-dns", "from-cert-san-pattern"}},
								act{A: UseActionSetValue, T: ".usernames", V: "random"}),
						),
						NewRadioParameter("chainSend", "What certificates should be sent", []Option[string]{
							{Value: "full", Label: "Full chain"},
							{Value: "but-root", Label: "Full chain w/out root"},
							{Value: "only-identity", Label: "Only identity certificate"},
						}, "but-root").SetAdvanced(true),
					).WithColumn(tlsParams...),
			},
		},
	}

	EapTLS = ProtoDefinition{
		ProtoName: "EAP-TLS",
		Radius: ProtoRadius{
			AccessRequest:   EAPTLSAccessRequest,
			AccountingStart: EAPTLSAccountingStart,
		},
		Parameters: eapTlsParams,
		Schema:     eapTlsParams.ToJsonSchema(),
	}
)
