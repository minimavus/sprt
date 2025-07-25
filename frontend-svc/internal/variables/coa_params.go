package variables

type (
	coaAction string

	coaVariantsParams struct {
		act coaAction

		actionAfterAck      *string
		generateNewAfterAck *bool
		dropOldAfterAck     *bool

		actionAfterNack      *string
		generateNewAfterNack *bool
		dropOldAfterNack     *bool
	}
)

const (
	CoaActionAfterReauthenticate        = "reauthenticate"
	CoaActionAfterReauthenticateWithMab = "reauthenticateWithMab"
	CoaActionAfterDoNothing             = "doNothing"

	CoaActionAck  coaAction = "ack"
	CoaActionNack coaAction = "nack"
	CoaActionDrop coaAction = "drop"
)

var (
	coaParams = Params{
		{
			Title:    "CoA Parameters",
			PropName: "coa",
			Parameters: []Parameter{
				NewColumnsParameter("coaColumns").
					WithColumn(ParamsSlice{}.
						With(NewFieldSetParameter("onBounceHostPortFields", "If **bounce-host-port** received").
							WithFields(coaVariants("onBounceHostPort", "", coaVariantsParams{}))).
						With(NewFieldSetParameter("onDisableHostPortFields", "If **disable-host-port** received").
							WithFields(coaVariants("onDisableHostPort", "", coaVariantsParams{}))).
						With(NewFieldSetParameter("onDefaultFields", "Default CoA action").
							WithFields(coaVariants("onDefault", "", coaVariantsParams{})))...).
					WithColumn(ParamsSlice{}.
						With(NewFieldSetParameter("onReauthenticateRerunFields", "If **reauthenticate** of type **rerun** received").
							WithFields(coaVariants("onReauthenticateRerun", "", coaVariantsParams{
								actionAfterAck:      ptr(CoaActionAfterReauthenticateWithMab),
								generateNewAfterAck: ptr(false),
								dropOldAfterAck:     ptr(false),
							}))).
						With(NewFieldSetParameter("onReauthenticateLastFields", "If **reauthenticate** of type **last** received").
							WithFields(coaVariants("onReauthenticateLast", "", coaVariantsParams{
								generateNewAfterAck: ptr(false),
								dropOldAfterAck:     ptr(false),
							}))).
						With(NewFieldSetParameter("onReauthenticateDefaultFields", "If **reauthenticate** w/out type received").
							WithFields(coaVariants("onReauthenticateDefault", "", coaVariantsParams{
								actionAfterAck:      ptr(CoaActionAfterReauthenticateWithMab),
								generateNewAfterAck: ptr(false),
								dropOldAfterAck:     ptr(false),
							})))...),
			},
		},
	}

	COA = VariableDefinition{
		Parameters: coaParams,
		Schema:     coaParams.ToJsonSchema(),
	}
)

func coaVariants(event string, title string, params coaVariantsParams) Parameter {
	v := NewVariantsParameter(event, title).
		WithVariants(
			NewVariant(string(CoaActionAck)).
				WithShort("CoA-ACK").
				WithField(
					NewSingleSelectParameter("actionAfter", "Action after CoA-ACK", []Option[string]{
						{CoaActionAfterReauthenticate, "Reauthenticate"},
						{CoaActionAfterReauthenticateWithMab, "Reauthenticate with MAB"},
						{CoaActionAfterDoNothing, "Do nothing"},
					}, withDefault(params.actionAfterAck, CoaActionAfterReauthenticate))).
				WithField(
					NewCheckboxParameter("newSessionId",
						withDefault(params.generateNewAfterAck, true), "Generate new session ID for re-authentication").
						Watch(NewWatch(".actionAfter").
							When(CoaActionAfterDoNothing, act{A: UseActionHide, T: ".newSessionId"}).
							WhenNot(CoaActionAfterDoNothing, act{A: UseActionShow, T: ".newSessionId"}))).
				WithField(
					NewCheckboxParameter("dropOld",
						withDefault(params.dropOldAfterAck, true), "Drop previous session").
						Watch(NewWatch(".actionAfter").
							When(CoaActionAfterDoNothing, act{A: UseActionHide, T: ".dropOld"}).
							WhenNot(CoaActionAfterDoNothing, act{A: UseActionShow, T: ".dropOld"}))),
			NewVariant(string(CoaActionNack)).
				WithShort("CoA-NACK").
				WithField(
					NewSingleSelectParameter("errorCause", "Error-Cause", []Option[string]{
						{"201", "201 - Residual Session Context Removed"},
						{"202", "202 - Invalid EAP Packet (Ignored)"},
						{"401", "401 - Unsupported Attribute"},
						{"402", "402 - Missing Attribute"},
						{"403", "403 - NAS Identification Mismatch"},
						{"404", "404 - Invalid Request"},
						{"405", "405 - Unsupported Service"},
						{"406", "406 - Unsupported Extension"},
						{"407", "407 - Invalid Attribute Value"},
						{"501", "501 - Administratively Prohibited"},
						{"502", "502 - Request Not Routable (Proxy)"},
						{"503", "503 - Session Context Not Found"},
						{"504", "504 - Session Context Not Removable"},
						{"505", "505 - Other Proxy Processing Error"},
						{"506", "506 - Resources Unavailable"},
						{"507", "507 - Request Initiated"},
						{"508", "508 - Multiple Session Selection Unsupported"},
						{"000", "No Error-Cause"},
					}, "503")).
				WithField(
					NewSingleSelectParameter("actionAfter", "Action after CoA-NACK", []Option[string]{
						{CoaActionAfterReauthenticate, "Reauthenticate"},
						{CoaActionAfterReauthenticateWithMab, "Reauthenticate with MAB"},
						{CoaActionAfterDoNothing, "Do nothing"},
					}, withDefault(params.actionAfterNack, CoaActionAfterDoNothing))).
				WithField(
					NewCheckboxParameter("newSessionId",
						withDefault(params.generateNewAfterNack, true), "Generate new session ID for re-authentication").
						Watch(NewWatch(".actionAfter").
							When(CoaActionAfterDoNothing, act{A: UseActionHide, T: ".newSessionId"}).
							WhenNot(CoaActionAfterDoNothing, act{A: UseActionShow, T: ".newSessionId"}))).
				WithField(
					NewCheckboxParameter("dropOld",
						withDefault(params.dropOldAfterNack, true), "Drop previous session").
						Watch(NewWatch(".actionAfter").
							When(CoaActionAfterDoNothing, act{A: UseActionHide, T: ".dropOld"}).
							WhenNot(CoaActionAfterDoNothing, act{A: UseActionShow, T: ".dropOld"}))),
			NewVariant(string(CoaActionDrop)).
				WithShort("Drop"),
		).WithValue(string(CoaActionAck))

	return v
}
