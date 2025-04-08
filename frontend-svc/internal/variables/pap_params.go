package variables

import "github.com/cisco-open/sprt/frontend-svc/internal/dictionaries"

var (
	papParams = Params{
		{
			Title:    "PAP/CHAP Parameters",
			PropName: "papChap",
			Parameters: []Parameter{
				NewCheckboxParameter("chap", false, "Use CHAP not PAP"),
				NewCheckboxParameter("limitSessionsToCredentials", false, "Amount of sessions equals to amount of credentials").
					Watch(NewWatch(".limitSessionsToCredentials").
						When(true, act{A: UseActionDisable, T: "general.job.sessionsAmount"}).
						When(false, act{A: UseActionEnable, T: "general.job.sessionsAmount"})),
				NewVariantsParameter("credentials", "Credentials").WithVariants(
					NewVariant("list").
						WithDescription("Credentials from the list").
						WithShort("From list").
						WithField(
							NewListParameter("credentialsList", "Credentials list", "").
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
			},
		},
	}

	PAP = ProtoDefinition{
		ProtoName: "PAP/CHAP",
		Radius: ProtoRadius{
			AccessRequest:   PAPAccessRequest,
			AccountingStart: PAPAccountingStart,
		},
		Parameters: papParams,
		Schema:     papParams.ToJsonSchema(),
	}
)
