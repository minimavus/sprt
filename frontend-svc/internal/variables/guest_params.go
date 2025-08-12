package variables

import (
	"strings"

	"github.com/iancoleman/strcase"
	"github.com/icrowley/fake"
	"github.com/kaptinlin/jsonschema"
	"golang.org/x/text/cases"
	"golang.org/x/text/language"

	"github.com/cisco-open/sprt/go-generator/sdk/variables"
	"github.com/cisco-open/sprt/go-generator/sdk/variables/dictionaries"
)

var (
	guestTokenForm = variables.NewTextInputParameter("tokenFormName", "Token form name", "tokenForm")

	uaDictionary = variables.NewDictionaryParameter("userAgents", nil, []dictionaries.DictionaryType{dictionaries.UA, dictionaries.Unclassified}).
			PreselectAllOfType(dictionaries.UA).
			WithLabel("User Agents").WithAllowRepeats(true).WithRandomSelect().WithAdditionalRules(variables.Rule("min=1")).
			Watch(variables.NewWatch(".guestFlow.variant").
				When(GuestFlowNone, variables.ActionHide(".userAgents")).
				WhenNot(GuestFlowNone, variables.ActionShow(".userAgents")))

	hotSpotParams = variables.NewVariant(GuestFlowHotspot).WithShort("Hotspot").
			WithField(
			variables.NewInfoParameter("how_works", "Redirect to hotspot page for authentication is expected"),
			variables.NewTextInputParameter("accessCode", "Access code", "").SetHint("Leave empty if not needed"),
			variables.NewCollapseSetParameter("fineTune", "Fine tune").WithFields(
				variables.NewColumnsParameter("fineTuneColumns").
					WithColumn(variables.ParamsSlice{}.
						With(variables.NewDivider().WithLabel("Conditions")).
						With(getGuestFlowSuccessCondition(GuestFlowHotspot)).
						With(variables.NewDivider().WithLabel("Forms")).
						With(variables.NewTextInputParameter("formName", "AUP form name", "aupForm"), guestTokenForm)...).
					WithColumn(variables.ParamsSlice{}.
						With(variables.NewDivider().WithLabel("Hotspot fields")).
						With(variables.NewTextInputParameter("hotspotField:accessCode", "Access code field name", "accessCode"))...),
			),
			variables.NewInfoParameter("info",
				"Do not forget to switch from Guest Flow check to GuestEndpoints check. "+
					"Otherwise you can end up in infinite loop.").WithSubType("warning"),
		)

	guestLoginNames = variables.ParamsSlice{
		variables.NewTextInputParameter("loginFields:username", "Username field name", "user.username"),
		variables.NewTextInputParameter("loginFields:password", "Password field name", "user.password"),
		variables.NewTextInputParameter("loginFields:accessCode", "Access code field name", "user.accessCode"),
	}

	withCredsParams = variables.NewVariant(GuestFlowWithCreds).WithShort("Provided credentials").
			WithField(
			variables.NewInfoParameter("how_works", "Will attempt to login on a guest portal with provided credentials"),
			variables.NewVariantsParameter("credentials", "Credentials").
				WithVariants(
					variables.NewVariant("list").WithShort("From list").
						WithDescription("Credentials from the list").
						WithField(variables.NewListParameter("credentialsList", "Credentials list", "").
							SetHint("Format user:password. One record per line").
							SetAllowFromFile(true)),
					variables.NewVariant("dictionaries").WithShort("From dictionaries").WithField(
						variables.NewDictionaryParameter("credentialsDictionary", []string{},
							[]dictionaries.DictionaryType{dictionaries.Credentials, dictionaries.Unclassified}).
							WithRandomSelect().
							WithAllowRepeats(true).WithAdditionalRules(variables.Rule("min=1")),
					),
				),
			variables.NewTextInputParameter("accessCode", "Access code", "").SetHint("Leave empty if not needed"),
			variables.NewCollapseSetParameter("fineTune", "Fine tune").WithFields(
				variables.NewColumnsParameter("fineTuneColumns").
					WithColumn(variables.ParamsSlice{}.
						With(variables.NewDivider().WithLabel("Conditions")).
						With(getGuestFlowSuccessCondition(GuestFlowWithCreds)).
						With(variables.NewDivider().WithLabel("Forms")).
						With(
							variables.NewTextInputParameter("loginFormName", "Login form name", "loginForm"),
							variables.NewTextInputParameter("aupFormName", "AUP form name", "aupForm"),
							guestTokenForm)...).
					WithColumn(variables.ParamsSlice{}.
						With(variables.NewDivider().WithLabel("Login fields")).
						With(guestLoginNames...)...),
			),
		)

	selfRegParams = variables.NewVariant(GuestFlowSelfReg).WithShort("Self-registration").
			WithField(
			variables.NewInfoParameter("how_works", "Will attempt to self-register on a guest portal and login"),
			variables.NewVariantsParameter("userNameRule", "Username").WithInline(true).
				WithVariants(getSelfRegRuleVariants(getGuestSelfRegRuleVariantsOptions{
					Username: true,
				})...).
				WithValue("others"),
			variables.NewVariantsParameter("firstNameRule", "First name").WithInline(true).
				WithVariants(
					getSelfRegRuleVariants(getGuestSelfRegRuleVariantsOptions{
						Dictionary: variables.DictionaryPrefixByName + "First Names",
						Faker:      fakerFirstName,
					})...,
				).
				WithValue("faker"),
			variables.NewVariantsParameter("lastNameRule", "Last name").WithInline(true).
				WithVariants(
					getSelfRegRuleVariants(getGuestSelfRegRuleVariantsOptions{
						Dictionary: variables.DictionaryPrefixByName + "Last Names",
						Faker:      fakerLastName,
					})...,
				).
				WithValue("faker"),
			variables.NewVariantsParameter("emailAddressRule", "Email address").WithInline(true).
				WithVariants(
					getSelfRegRuleVariants(getGuestSelfRegRuleVariantsOptions{
						Email: true,
						Faker: fakerEmail,
					})...,
				).
				WithValue("faker"),
			variables.NewVariantsParameter("companyRule", "Company").WithInline(true).
				WithVariants(
					getSelfRegRuleVariants(getGuestSelfRegRuleVariantsOptions{
						Dictionary: variables.DictionaryPrefixByName + "Companies",
						Faker:      fakerCompany,
					})...,
				).
				WithValue("faker"),
			variables.NewVariantsParameter("locationRule", "Location").WithInline(true).
				WithVariants(
					variables.NewVariant("static").WithShort("Specify").
						WithField(variables.NewTextInputParameter("value", "Location name", "").
							SetHint("First found will be used if nothing specified here")),
				),
			variables.NewVariantsParameter("smsProviderRule", "SMS provider").WithInline(true).
				WithVariants(
					variables.NewVariant("static").WithShort("Specify").
						WithField(variables.NewTextInputParameter("value", "SMS provider name", "").
							SetHint("First found will be used if nothing specified here")),
				),
			variables.NewVariantsParameter("personVisitedRule", "Person visited").WithInline(true).
				WithVariants(
					getSelfRegRuleVariants(getGuestSelfRegRuleVariantsOptions{
						Email: true,
						Faker: fakerEmail,
					})...,
				),
			variables.NewVariantsParameter("reasonVisitRule", "Reason visit").WithInline(true).
				WithVariants(
					getSelfRegRuleVariants(getGuestSelfRegRuleVariantsOptions{
						Faker: fakerSentence,
					})...,
				),
			variables.NewTextInputParameter("registrationCode", "Registration code", "").SetHint("Leave empty if not needed"),
			variables.NewTextInputParameter("accessCode", "Access code", "").SetHint("Leave empty if not needed"),
			variables.NewCollapseSetParameter("fineTune", "Fine tune").WithFields(variables.ParamsSlice{}.
				With(
					variables.NewColumnsParameter("fineTuneColumns").
						WithColumn(
							variables.NewNumberInputParameter("reauthAfterTimeout", "Perform full re-authentication "+
								"if SMS is received after N minutes", 5).WithAdditionalRules("min:0"),
							variables.NewDivider().WithLabel("Conditions"),
							getGuestFlowSuccessCondition(GuestFlowSelfReg, guestFlowSuccessConditionOptions{
								Title: "Success condition of registration",
							}),
							getGuestFlowSuccessCondition("login", guestFlowSuccessConditionOptions{
								Title:  "Success condition of login",
								Prefix: "login-",
							}),
							variables.NewDivider().WithLabel("Forms"),
							variables.NewTextInputParameter("selfRegFormName", "Self Registration form name", "selfRegForm"),
							variables.NewTextInputParameter("selfRegSuccessFormName", "Self Registration success form name", "selfRegSuccessForm"),
							variables.NewTextInputParameter("loginFormName", "Login form name", "loginForm"),
							variables.NewTextInputParameter("aupFormName", "AUP form name", "aupForm"),
							guestTokenForm,
						).
						WithColumn(variables.ParamsSlice{}.
							With(variables.NewDivider().WithLabel("Self registration fields")).
							With(guestSelfRegNames()...).
							With(variables.NewDivider().WithLabel("Login fields")).
							With(guestLoginNames...)...),
				)...),
			variables.NewInfoParameter("info",
				"Do not forget to configure SMS Gateway on ISE. "+
					"Check the details at [SMS Configuration page](/settings/sms-gateway)").WithSubType("warning"),
		)

	guestParams = variables.BuildParams(
		variables.ParametersBlock{
			Title:    "Guest Flow",
			PropName: "guest",
			Parameters: variables.ParamsSlice{
				variables.NewVariantsParameter("guestFlow", "Expected guest flow").
					WithVariants(
						variables.NewVariant(GuestFlowNone).WithShort("None"),
						hotSpotParams,
						withCredsParams,
						selfRegParams,
					),
				uaDictionary,
			},
			IfThenElse: jsonschema.If(jsonschema.Object(
				jsonschema.Prop("type", jsonschema.Const("premium")),
			)),
		},
	)

	Guest = VariableDefinition{
		Parameters: guestParams,
		Schema:     guestParams.ToJSONSchema(),
	}
)

const (
	GuestFlowNone      = "none"
	GuestFlowHotspot   = "hotspot"
	GuestFlowWithCreds = "with-creds"
	GuestFlowSelfReg   = "self-reg"
)

type guestFlowSuccessConditionOptions struct {
	Title     string
	Name      string
	Postfix   string
	Prefix    string
	Condition string
}

func getGuestFlowSuccessCondition(t string, o ...guestFlowSuccessConditionOptions) variables.Parameter {
	var opts guestFlowSuccessConditionOptions
	if len(o) > 0 {
		opts = o[0]
	}

	c := "(?<id>ui_success_message)"
	if opts.Title == "" {
		opts.Title = "Regular expression"
	}
	if opts.Name == "" {
		opts.Name = "successCondition"
	}

	if t == GuestFlowSelfReg {
		c = "(?<id>ui_login_instruction_message|ui_success_message|ui_self_reg_results_instruction_message)"
	}

	if opts.Condition == "" {
		opts.Condition = `<[^>]+id="` + c + `"[^>]*>(?<message>[^<]+)`
	}

	return variables.NewTextInputParameter(opts.Prefix+opts.Name+opts.Postfix, opts.Title, opts.Condition).
		SetHint("If matched, authentication considered as successful")
}

type getGuestSelfRegRuleRandomOptions struct {
	Min *int
	Max *int
}

func getGuestSelfRegRuleRandom(o ...getGuestSelfRegRuleRandomOptions) variables.Variant {
	var opts getGuestSelfRegRuleRandomOptions
	if len(o) > 0 {
		opts = o[0]
	}

	if opts.Min == nil {
		opts.Min = ptr(5)
	}
	if opts.Max == nil {
		opts.Max = ptr(10)
	}

	return variables.NewVariant("random").WithShort("Random string").
		WithField(
			variables.NewColumnsParameter("randomSpecsColumns").
				WithColumn(variables.ParamsSlice{}.
					With(variables.NewNumberInputParameter("minLength", "Min length", *opts.Min))...).
				WithColumn(variables.ParamsSlice{}.
					With(variables.NewNumberInputParameter("maxLength", "Max length", *opts.Max))...,
				),
		)
}

func getGuestSelfRegRulePattern(p string) variables.Variant {
	if p == "" {
		p = `\w{5,10}`
	}

	return variables.NewVariant("random-pattern").WithShort("Pattern-based").
		WithField(variables.NewTextInputParameter("pattern", "Pattern", p))
}

func getGuestSelfRegRuleEmailPattern() variables.Variant {
	return getGuestSelfRegRulePattern(`\w{5,10}@example[.]com`)
}

func getGuestSelfRegRuleDictionary(value any) variables.Variant {
	var d variables.DictionaryParameter

	switch v := value.(type) {
	case []string:
		d = variables.NewDictionaryParameter("dictionary", v,
			[]dictionaries.DictionaryType{dictionaries.Form, dictionaries.Unclassified})
	case nil:
		d = variables.NewDictionaryParameter("dictionary", []string{},
			[]dictionaries.DictionaryType{dictionaries.Form, dictionaries.Unclassified})
	case string:
		switch {
		case strings.HasPrefix(v, variables.DictionaryPrefixByName):
			d = variables.NewDictionaryParameter("dictionary", []string{},
				[]dictionaries.DictionaryType{dictionaries.Form, dictionaries.Unclassified}).
				PreselectByName(strings.TrimPrefix(v, variables.DictionaryPrefixByName))
		case strings.HasPrefix(v, variables.DictionaryPrefixAllByType):
			d = variables.NewDictionaryParameter("dictionary", []string{},
				[]dictionaries.DictionaryType{dictionaries.Form, dictionaries.Unclassified}).
				PreselectAllOfType(dictionaries.DictionaryType(strings.TrimPrefix(v, variables.DictionaryPrefixAllByType)))
		default:
			d = variables.NewDictionaryParameter("dictionary", []string{},
				[]dictionaries.DictionaryType{dictionaries.Form, dictionaries.Unclassified})
		}
	}

	return variables.NewVariant("dictionary").WithShort("From dictionary").WithField(d).WithAdditionalRules(variables.Rule("min=1"))
}

func getGuestSelfRegRuleEmpty() variables.Variant {
	return variables.NewVariant("keep-empty").WithShort("Do not fill").WithField(variables.ParamsSlice{}...)
}

var (
	functionsMap = map[string]string{
		"rand()":          "Random number",     // accepts `number` or `number..number`
		"randstr()":       "Random string",     // accepts `number`, `number,number`, `regex`
		"hex()":           "Convert to HEX",    // accepts `number`, converts to HEX
		"oct()":           "Conver to OCT",     // accepts `number`, converts to OCT
		"uc()":            "To UPPER case",     // accepts `string`, converts to UPPER case
		"lc()":            "To lower case",     // accepts `string`, converts to lower case
		"no_delimiters()": "Remove delimiters", // accepts `string`, removes delimiters - `.`, `-` and ':'
	}

	variablesMap = map[string]string{
		"$first_name$":    "First Name",
		"$last_name$":     "Last Name",
		"$email_address$": "Email Address",
		"$phone_number$":  "Phone Number",
	}
)

func insertDD(values map[string]string) []map[string]any {
	var res []map[string]any
	for k, v := range values {
		res = append(res, map[string]any{
			"value":  k,
			"title":  v,
			"insert": true,
			"type":   "value",
		})
	}
	return res
}

type getGuestSelfRegRuleFunctionsBasedOptions struct {
	Pattern string
	Name    string
}

func getGuestSelfRegRuleFunctionsBased(o ...getGuestSelfRegRuleFunctionsBasedOptions) variables.Variant {
	var opts getGuestSelfRegRuleFunctionsBasedOptions
	if len(o) > 0 {
		opts = o[0]
	}

	if opts.Name == "" {
		opts.Name = "others"
	}

	return variables.NewVariant(opts.Name).WithShort("Functions-based").
		WithField(
			variables.NewTextInputParameter("funBasedPattern", "Pattern", opts.Pattern).
				WithButtons(
					variables.NewDropDownSideButton("Insert", "", "", []any{
						map[string]any{
							"type":   "group",
							"title":  "Functions",
							"values": insertDD(functionsMap),
						},
						map[string]any{
							"type":   "group",
							"title":  "Variables",
							"values": insertDD(variablesMap),
						},
					}),
				),
		)
}

type (
	fakerFn   func() string
	fakerWhat string
)

const (
	fakerFirstName fakerWhat = "first_name"
	fakerLastName  fakerWhat = "last_name"
	fakerEmail     fakerWhat = "email"
	fakerCompany   fakerWhat = "company"
	fakerSentence  fakerWhat = "sentence"
	fakerPhone     fakerWhat = "phone"
)

var fakers = map[fakerWhat]fakerFn{
	fakerFirstName: func() string { return fake.FirstName() },
	fakerLastName:  func() string { return fake.LastName() },
	fakerEmail:     func() string { return fake.EmailAddress() },
	fakerCompany:   func() string { return fake.FirstName() },
	fakerSentence:  func() string { return fake.Sentence() },
	fakerPhone:     func() string { return fake.Phone() },
}

func getGuestSelfRegRuleFaker(what fakerWhat) variables.Variant {
	fn, ok := fakers[what]
	if !ok {
		fn = fakers[fakerSentence]
	}

	return variables.NewVariant("faker").WithShort("Fake data").
		WithField(
			variables.NewHiddenParameter("what", string(what)),
			variables.NewInfoParameter("info", "Example: "+fn()).WithSubType("example"),
		)
}

type getGuestSelfRegRuleVariantsOptions struct {
	Email      bool
	Pattern    string
	Dictionary any
	Username   bool
	Faker      fakerWhat
}

func getSelfRegRuleVariants(o getGuestSelfRegRuleVariantsOptions) []variables.Variant {
	var res []variables.Variant

	res = append(res, getGuestSelfRegRuleRandom())
	if o.Email {
		res = append(res, getGuestSelfRegRuleEmailPattern())
	} else {
		res = append(res, getGuestSelfRegRulePattern(o.Pattern))
	}
	res = append(res, getGuestSelfRegRuleDictionary(o.Dictionary))
	if o.Username {
		res = append(res, getGuestSelfRegRuleFunctionsBased(getGuestSelfRegRuleFunctionsBasedOptions{
			Pattern: "lc($first_name$).lc($last_name$)",
			Name:    "others",
		}))
	}
	if o.Faker != "" {
		res = append(res, getGuestSelfRegRuleFaker(o.Faker))
	}
	res = append(res, getGuestSelfRegRuleEmpty())

	return res
}

func guestSelfRegNames() []variables.Parameter {
	var res []variables.Parameter
	for _, n := range []string{
		"guestUser.accessCode",
		"guestUser.fieldValues.ui_user_name",
		"guestUser.fieldValues.ui_first_name",
		"guestUser.fieldValues.ui_last_name",
		"guestUser.fieldValues.ui_email_address",
		"guestUser.fieldValues.ui_phone_number",
		"guestUser.fieldValues.ui_company",
		"guestUser.fieldValues.ui_location",
		"guestUser.fieldValues.ui_sms_provider",
		"guestUser.fieldValues.ui_person_visited",
		"guestUser.fieldValues.ui_reason_visit",
	} {
		fieldName := strings.TrimPrefix(n, "guestUser.fieldValues.ui_")
		if after, ok := strings.CutPrefix(fieldName, "guestUser."); ok {
			fieldName = after
		}
		fieldName = strcase.ToDelimited(fieldName, '_')
		name := cases.Title(language.English, cases.NoLower).String(strings.ReplaceAll(fieldName, "_", " "))
		res = append(res, variables.NewTextInputParameter("selfRegFields:"+fieldName, name+" field name", n))
	}
	return res
}
