package variables

import "github.com/cisco-open/sprt/go-generator/sdk/variables"

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
	coaParams = variables.Params{
		{
			Title:    "CoA Parameters",
			PropName: "coa",
			Parameters: []variables.Parameter{
				variables.NewColumnsParameter("coaColumns").
					WithColumn(variables.ParamsSlice{}.
						With(variables.NewFieldSetParameter("onBounceHostPortFields", "If **bounce-host-port** received").
							WithFields(coaVariants("onBounceHostPort", "", coaVariantsParams{}))).
						With(variables.NewFieldSetParameter("onDisableHostPortFields", "If **disable-host-port** received").
							WithFields(coaVariants("onDisableHostPort", "", coaVariantsParams{}))).
						With(variables.NewFieldSetParameter("onDefaultFields", "Default CoA action").
							WithFields(coaVariants("onDefault", "", coaVariantsParams{})))...).
					WithColumn(variables.ParamsSlice{}.
						With(variables.NewFieldSetParameter("onReauthenticateRerunFields", "If **reauthenticate** of type **rerun** received").
							WithFields(coaVariants("onReauthenticateRerun", "", coaVariantsParams{
								actionAfterAck:      ptr(CoaActionAfterReauthenticateWithMab),
								generateNewAfterAck: ptr(false),
								dropOldAfterAck:     ptr(false),
							}))).
						With(variables.NewFieldSetParameter("onReauthenticateLastFields", "If **reauthenticate** of type **last** received").
							WithFields(coaVariants("onReauthenticateLast", "", coaVariantsParams{
								generateNewAfterAck: ptr(false),
								dropOldAfterAck:     ptr(false),
							}))).
						With(variables.NewFieldSetParameter("onReauthenticateDefaultFields", "If **reauthenticate** w/out type received").
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
		Schema:     coaParams.ToJSONSchema(),
	}
)

func coaVariants(event string, title string, params coaVariantsParams) variables.Parameter {
	v := variables.NewVariantsParameter(event, title).
		WithVariants(
			variables.NewVariant(string(CoaActionAck)).
				WithShort("CoA-ACK").
				WithField(
					variables.NewSingleSelectParameter("actionAfter", "Action after CoA-ACK", []variables.Option[string]{
						{Value: CoaActionAfterReauthenticate, Label: "Reauthenticate"},
						{Value: CoaActionAfterReauthenticateWithMab, Label: "Reauthenticate with MAB"},
						{Value: CoaActionAfterDoNothing, Label: "Do nothing"},
					}, withDefault(params.actionAfterAck, CoaActionAfterReauthenticate))).
				WithField(
					variables.NewCheckboxParameter("newSessionId",
						withDefault(params.generateNewAfterAck, true), "Generate new session ID for re-authentication").
						Watch(variables.NewWatch(".actionAfter").
							When(CoaActionAfterDoNothing, variables.ActionHide(".newSessionId")).
							WhenNot(CoaActionAfterDoNothing, variables.ActionShow(".newSessionId")))).
				WithField(
					variables.NewCheckboxParameter("dropOld",
						withDefault(params.dropOldAfterAck, true), "Drop previous session").
						Watch(variables.NewWatch(".actionAfter").
							When(CoaActionAfterDoNothing, variables.ActionHide(".dropOld")).
							WhenNot(CoaActionAfterDoNothing, variables.ActionShow(".dropOld")))),
			variables.NewVariant(string(CoaActionNack)).
				WithShort("CoA-NACK").
				WithField(
					variables.NewSingleSelectParameter("errorCause", "Error-Cause", []variables.Option[string]{
						{Value: "201", Label: "201 - Residual Session Context Removed"},
						{Value: "202", Label: "202 - Invalid EAP Packet (Ignored)"},
						{Value: "401", Label: "401 - Unsupported Attribute"},
						{Value: "402", Label: "402 - Missing Attribute"},
						{Value: "403", Label: "403 - NAS Identification Mismatch"},
						{Value: "404", Label: "404 - Invalid Request"},
						{Value: "405", Label: "405 - Unsupported Service"},
						{Value: "406", Label: "406 - Unsupported Extension"},
						{Value: "407", Label: "407 - Invalid Attribute Value"},
						{Value: "501", Label: "501 - Administratively Prohibited"},
						{Value: "502", Label: "502 - Request Not Routable (Proxy)"},
						{Value: "503", Label: "503 - Session Context Not Found"},
						{Value: "504", Label: "504 - Session Context Not Removable"},
						{Value: "505", Label: "505 - Other Proxy Processing Error"},
						{Value: "506", Label: "506 - Resources Unavailable"},
						{Value: "507", Label: "507 - Request Initiated"},
						{Value: "508", Label: "508 - Multiple Session Selection Unsupported"},
						{Value: "000", Label: "No Error-Cause"},
					}, "503")).
				WithField(
					variables.NewSingleSelectParameter("actionAfter", "Action after CoA-NACK", []variables.Option[string]{
						{Value: CoaActionAfterReauthenticate, Label: "Reauthenticate"},
						{Value: CoaActionAfterReauthenticateWithMab, Label: "Reauthenticate with MAB"},
						{Value: CoaActionAfterDoNothing, Label: "Do nothing"},
					}, withDefault(params.actionAfterNack, CoaActionAfterDoNothing))).
				WithField(
					variables.NewCheckboxParameter("newSessionId",
						withDefault(params.generateNewAfterNack, true), "Generate new session ID for re-authentication").
						Watch(variables.NewWatch(".actionAfter").
							When(CoaActionAfterDoNothing, variables.ActionHide(".newSessionId")).
							WhenNot(CoaActionAfterDoNothing, variables.ActionShow(".newSessionId")))).
				WithField(
					variables.NewCheckboxParameter("dropOld",
						withDefault(params.dropOldAfterNack, true), "Drop previous session").
						Watch(variables.NewWatch(".actionAfter").
							When(CoaActionAfterDoNothing, variables.ActionHide(".dropOld")).
							WhenNot(CoaActionAfterDoNothing, variables.ActionShow(".dropOld")))),
			variables.NewVariant(string(CoaActionDrop)).
				WithShort("Drop"),
		).WithValue(string(CoaActionAck))

	return v
}
