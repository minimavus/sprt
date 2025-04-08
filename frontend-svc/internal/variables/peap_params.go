package variables

import "github.com/cisco-open/sprt/frontend-svc/internal/dictionaries"

var (
	eapMSCHAPv2Parameters = ParamsSlice{
		NewCheckboxParameter("limitSessionsToCredentials", false, "Amount of sessions equals to amount of credentials").
			Watch(NewWatch(".limitSessionsToCredentials").
				When(true, act{A: UseActionDisable, T: "general.job.sessionsAmount"}).
				When(false, act{A: UseActionEnable, T: "general.job.sessionsAmount"})),
		NewVariantsParameter("credentials", "Credentials").WithVariants(
			NewVariant("list").
				WithDescription("Credentials from the list").
				WithShort("From list").
				WithField(
					NewListParameter("credentialsList", "Credentials", "").
						SetHint("Format user:password. One record per line").
						SetAllowFromFile(true),
				),
			NewVariant("dictionary").
				WithDescription("Credentials from the dictionaries").
				WithShort("From dictionaries").
				WithField(
					NewDictionaryParameter("dictionaries", []string{},
						[]dictionaries.DictionaryType{dictionaries.Credentials, dictionaries.Unclassified}),
				),
		),
	}

	peapParams = Params{
		{
			Title:    "PEAP Parameters",
			PropName: "peap",
			Parameters: ParamsSlice{
				NewColumnsParameter("peap_params").
					WithColumn(
						ParamsSlice{}.
							With(NewTextInputParameter("innerMethod", "Inner method", "MSCHAPv2").SetReadonly(true)).
							With(eapMSCHAPv2Parameters...).
							With(NewVariantsParameter("outerIdentity", "Outer identity").
								WithVariants(
									NewVariant("same").
										WithDescription("Use username as outer identity").
										WithShort("Username").
										WithField(
											NewInfoParameter("how_works", "Username will be used as outer identity"),
										),
									NewVariant("specified").
										WithDescription("Use specified outer identity").
										WithShort("Specified").
										WithField(
											NewInfoParameter("how_works", "Specified identity will be used for PEAP"),
											NewTextInputParameter("identity", "Identity", "Anonymous"),
										),
								),
							).
							With(NewVariantsParameter("changePassword", "If server requested password change").
								WithVariants(
									NewVariant("drop").
										WithDescription("Send EAP failure").
										WithShort("Send EAP fail").
										WithField(
											NewInfoParameter("how_works", "Send EAP failure and drop connection"),
										),
									NewVariant("change").
										WithDescription("Change password").
										WithShort("Change password").
										WithField(
											NewInfoParameter("how_works", "Will try to change password to specified one"),
											NewTextInputParameter("newPassword", "New password", ""),
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
		Radius: ProtoRadius{
			AccessRequest:   PEAPAccessRequest,
			AccountingStart: PEAPAccountingStart,
		},
		Parameters: peapParams,
		Schema:     peapParams.ToJsonSchema(),
	}
)
