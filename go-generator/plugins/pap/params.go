package pap

import (
	"github.com/cisco-open/sprt/go-generator/sdk/variables"
	"github.com/cisco-open/sprt/go-generator/sdk/variables/dictionaries"
)

var (
	papParams = variables.Params{
		{
			Title:    "PAP/CHAP Parameters",
			PropName: "papChap",
			Parameters: []variables.Parameter{
				variables.NewCheckboxParameter("chap", false, "Use CHAP not PAP"),
				variables.NewCheckboxParameter("limitSessionsToCredentials", false, "Amount of sessions equals to amount of credentials").
					Watch(variables.NewWatch(".limitSessionsToCredentials").
						When(true, variables.ActionDisable("general.job.sessionsAmount")).
						When(false, variables.ActionEnable("general.job.sessionsAmount"))),
				variables.NewVariantsParameter("credentials", "Credentials").WithVariants(
					variables.NewVariant("list").
						WithDescription("Credentials from the list").
						WithShort("From list").
						WithField(
							variables.NewListParameter("credentialsList", "Credentials list", "").
								SetHint("Format user:password. One record per line").
								SetAllowFromFile(true),
						),
					variables.NewVariant("dictionary").
						WithDescription("Credentials from the dictionaries").
						WithShort("From dictionaries").
						WithField(
							variables.NewDictionaryParameter("dictionaries", []string{},
								[]dictionaries.DictionaryType{dictionaries.Credentials, dictionaries.Unclassified}).
								WithAdditionalRules(variables.Rule("min=1")),
						),
				),
			},
		},
	}
)
