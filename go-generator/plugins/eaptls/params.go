package eaptls

import (
	"net/http"

	"github.com/cisco-open/sprt/go-generator/sdk/variables"
	"github.com/cisco-open/sprt/go-generator/sdk/variables/dictionaries"
)

var (
	eapTLSParams = variables.Params{
		{
			Title:    "EAP-TLS Parameters",
			PropName: "eapTls",
			Parameters: variables.ParamsSlice{
				variables.NewColumnsParameter("eap-tls_params").
					WithColumn(
						variables.NewVariantsParameter("identityCertificates", "Identity certificates").WithVariants(
							variables.NewVariant("selected").
								WithDescription("Select certificates").
								WithShort("Selected").
								WithShowIfChecked(true).
								WithField(
									variables.NewInfoParameter("how_works", "Selected certificates will be used for authentication"),
									variables.NewLoadableSelectParameter("certificates", "Certificates", IdentityCertificatesLoad).
										SetMulti(true).WithAdditionalRules(variables.Rule("min=1")),
								),
							variables.NewVariant("scep").
								WithDescription("Request from SCEP server").
								WithShort("SCEP").
								WithShowIfChecked(true).
								WithField(
									variables.NewInfoParameter("how_works", "Request a session certificate from SCEP server"),
									variables.NewLoadableSelectParameter("scepServer", "SCEP server",
										variables.NewLoadParams("/scep/servers", http.MethodGet).
											WithAPIPrefix().
											SetResultAttribute("scep").
											SetResultAsTable().
											SetResultColumns(variables.LoadableResultColumns{
												{Title: "Name", Field: "name"},
												{Title: "URL", Field: "url"},
											}).
											SetResultFields("name", "id").
											SetResultObjectPath(".servers")).
										WithAdditionalRules(variables.Rule("min=1")),
									variables.NewLoadableSelectParameter("template", "CSR template",
										variables.NewLoadParams("/certificates/templates", http.MethodGet).
											WithAPIPrefix().
											SetResultAttribute("result").
											SetResultAsTable().
											SetResultColumns(variables.LoadableResultColumns{
												{Title: "Friendly Name", Field: "friendly_name"},
												{Title: "Subject", Field: "subject"},
											}).
											SetResultFields("friendly_name", "id").
											SetResultObjectPath(".templates")).
										WithAdditionalRules(variables.Rule("min=1")),
									variables.NewCheckboxParameter("saveIdentityCertificates", false, "Save generated Identity Certificates"),
								),
						),
						variables.NewVariantsParameter("usernames", "EAP Session usernames").WithVariants(
							variables.NewVariant("from-cert-cn").
								WithDescription("Use CN part of Subject").
								WithShort("Certificate - CN").
								WithField(
									variables.NewInfoParameter("how_works", "CN part of Subject field will be used. If CN not found - session will be unsuccessful"),
								),
							variables.NewVariant("from-cert-san-dns").
								WithDescription("Use first found DNS name of SAN").
								WithShort("Certificate - SAN DNS").
								WithField(
									variables.NewInfoParameter("how_works", "First found DNS name of SAN will be used"),
								),
							variables.NewVariant("from-cert-san-pattern").
								WithDescription("Search for SAN matching pattern").
								WithShort("Certificate - SAN pattern").
								WithField(
									variables.NewInfoParameter("how_works", "Every SAN will be checked with pattern, first matched will be used"),
									variables.NewCheckboxesParameter[bool]("sanTypesAllowed", "Include SAN types").
										WithOption("otherName", "Other Name", true).
										WithOption("rfc822Name", "RFC822 Name", true).
										WithOption("dNSName", "DNS Name", true).
										WithOption("iPAddress", "IP Address", true),
									variables.NewTextInputParameter("sanPattern", "Pattern", ".*").SetDescription("RegEx"),
								),
							variables.NewVariant("same-as-mac").
								WithDescription("Same as MAC").
								WithShort("Same as MAC").
								WithField(
									variables.NewInfoParameter("how_works", "$USERNAME$ variable will be replaced with value of $MAC$ variable"),
									variables.NewCheckboxParameter("removeDelimiters", true, "Remove delimiter-characters (-:.) from MAC address to use as username"),
								),
							variables.NewVariant("specified").
								WithDescription("Specify usernames manually").
								WithShort("Specified").
								WithField(
									variables.NewInfoParameter("how_works", "Only specified usernames will be used"),
									variables.NewListParameter("specifiedUsernames", "Usernames", "").
										SetValidate(false).
										SetHint("List of usernames\nOne per line").
										SetAllowFromFile(true),
								),
							variables.NewVariant("dictionary").
								WithDescription("Get usernames from dictionaries").
								WithShort("Dictionary").
								WithField(
									variables.NewDictionaryParameter("dictionaries", []string{},
										[]dictionaries.DictionaryType{dictionaries.Credentials, dictionaries.MAC, dictionaries.Unclassified}).
										WithAdditionalRules(variables.Rule("min=1")),
								),
							variables.NewVariant("random").
								WithDescription("Random username").
								WithShort("Random").
								WithField(
									variables.NewInfoParameter("how_works", "Random username will be created for each session"),
									variables.NewColumnsParameter("length_params").
										WithColumn(variables.NewNumberInputParameter("minLength", "Min username length", 5)).
										WithColumn(variables.NewNumberInputParameter("maxLength", "Max username length", 20)),
								),
						).WithValue("from-cert-cn").Watch(variables.NewWatch(".identityCertificates.variant").
							When("selected",
								variables.ActionHideValues(".usernames", []string{"random"}),
								variables.ActionSetValue(".usernames", "from-cert-cn")).
							When("scep",
								variables.ActionHideValues(".usernames", []string{"from-cert-cn", "from-cert-san-dns", "from-cert-san-pattern"}),
								variables.ActionSetValue(".usernames", "random")),
						),
						variables.NewRadioParameter("chainSend", "What certificates should be sent", []variables.Option[string]{
							{Value: "full", Label: "Full chain"},
							{Value: "but-root", Label: "Full chain w/out root"},
							{Value: "only-identity", Label: "Only identity certificate"},
						}, "but-root").SetAdvanced(true),
					).WithColumn(CommonTLSParams...),
			},
		},
	}
)
