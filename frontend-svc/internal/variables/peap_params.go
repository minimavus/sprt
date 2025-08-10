package variables

import (
	"github.com/cisco-open/sprt/go-generator/sdk/radius"
	"github.com/cisco-open/sprt/go-generator/sdk/variables"
	"github.com/cisco-open/sprt/go-generator/sdk/variables/dictionaries"
)

var (
	eapMSCHAPv2Parameters = variables.ParamsSlice{
		variables.NewCheckboxParameter("limitSessionsToCredentials", false, "Amount of sessions equals to amount of credentials").
			Watch(variables.NewWatch(".limitSessionsToCredentials").
				When(true, variables.ActionDisable("general.job.sessionsAmount")).
				When(false, variables.ActionEnable("general.job.sessionsAmount"))),
		variables.NewVariantsParameter("credentials", "Credentials").WithVariants(
			variables.NewVariant("list").
				WithDescription("Credentials from the list").
				WithShort("From list").
				WithField(
					variables.NewListParameter("credentialsList", "Credentials", "").
						SetHint("Format user:password. One record per line").
						SetAllowFromFile(true),
				),
			variables.NewVariant("dictionary").
				WithDescription("Credentials from the dictionaries").
				WithShort("From dictionaries").
				WithField(
					variables.NewDictionaryParameter("dictionaries", []string{},
						[]dictionaries.DictionaryType{dictionaries.Credentials, dictionaries.Unclassified}),
				),
		),
	}

	peapParams = variables.Params{
		{
			Title:    "PEAP Parameters",
			PropName: "peap",
			Parameters: variables.ParamsSlice{
				variables.NewColumnsParameter("peap_params").
					WithColumn(
						variables.ParamsSlice{}.
							With(variables.NewTextInputParameter("innerMethod", "Inner method", "MSCHAPv2").SetReadonly(true)).
							With(eapMSCHAPv2Parameters...).
							With(variables.NewVariantsParameter("outerIdentity", "Outer identity").
								WithVariants(
									variables.NewVariant("same").
										WithDescription("Use username as outer identity").
										WithShort("Username").
										WithField(
											variables.NewInfoParameter("how_works", "Username will be used as outer identity"),
										),
									variables.NewVariant("specified").
										WithDescription("Use specified outer identity").
										WithShort("Specified").
										WithField(
											variables.NewInfoParameter("how_works", "Specified identity will be used for PEAP"),
											variables.NewTextInputParameter("identity", "Identity", "Anonymous"),
										),
								),
							).
							With(variables.NewVariantsParameter("changePassword", "If server requested password change").
								WithVariants(
									variables.NewVariant("drop").
										WithDescription("Send EAP failure").
										WithShort("Send EAP fail").
										WithField(
											variables.NewInfoParameter("how_works", "Send EAP failure and drop connection"),
										),
									variables.NewVariant("change").
										WithDescription("Change password").
										WithShort("Change password").
										WithField(
											variables.NewInfoParameter("how_works", "Will try to change password to specified one"),
											variables.NewTextInputParameter("newPassword", "New password", ""),
										),
								),
							)...,
					).
					WithColumn(tlsParams...),
			},
		},
	}

	PEAP = ProtoDefinition{
		ProtoName: "PEAP",
		Radius: radius.ProtoRadius{
			AccessRequest:   PEAPAccessRequest,
			AccountingStart: PEAPAccountingStart,
		},
		Parameters: peapParams,
		Schema:     peapParams.ToJSONSchema(),
	}
)
