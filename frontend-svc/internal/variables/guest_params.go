package variables

import (
	"strings"

	"github.com/cisco-open/sprt/frontend-svc/internal/dictionaries"
	"github.com/iancoleman/strcase"
	"github.com/icrowley/fake"
	"golang.org/x/text/cases"
	"golang.org/x/text/language"
)

var (
	guestTokenForm = NewTextInputParameter("tokenFormName", "Token form name", "tokenForm")

	uaDictionary = NewDictionaryParameter("userAgents", nil, []dictionaries.DictionaryType{dictionaries.UA, dictionaries.Unclassified}).
			PreselectAllOfType(dictionaries.UA).
			WithLabel("User Agents").WithAllowRepeats(true).WithSelect(DictionarySelectRandom).
			Watch(NewWatch(".guestFlow.variant").
				When(GuestFlowNone, act{A: UseActionHide, T: ".userAgents"}).
				WhenNot(GuestFlowNone, act{A: UseActionShow, T: ".userAgents"}))

	hotSpotParams = NewVariant(GuestFlowHotspot).WithShort("Hotspot").
			WithField(
			NewInfoParameter("how_works", "Redirect to hotspot page for authentication is expected"),
			NewTextInputParameter("accessCode", "Access code", "").SetHint("Leave empty if not needed"),
			NewCollapseSetParameter("fineTune", "Fine tune").WithFields(
				NewColumnsParameter("fineTuneColumns").
					WithColumn(ParamsSlice{}.
						With(NewDivider().WithLabel("Conditions")).
						With(getGuestFlowSuccessCondition(GuestFlowHotspot)).
						With(NewDivider().WithLabel("Forms")).
						With(NewTextInputParameter("formName", "AUP form name", "aupForm"), guestTokenForm)...).
					WithColumn(ParamsSlice{}.
						With(NewDivider().WithLabel("Hotspot fields")).
						With(NewTextInputParameter("hotspotField:accessCode", "Access code field name", "accessCode"))...),
			),
			NewInfoParameter("info",
				"Do not forget to switch from Guest Flow check to GuestEndpoints check. "+
					"Otherwise you can end up in infinite loop.").WithSubType("warning"),
		)

	guestLoginNames = ParamsSlice{
		NewTextInputParameter("loginFields:username", "Username field name", "user.username"),
		NewTextInputParameter("loginFields:password", "Password field name", "user.password"),
		NewTextInputParameter("loginFields:accessCode", "Access code field name", "user.accessCode"),
	}

	withCredsParams = NewVariant(GuestFlowWithCreds).WithShort("Provided credentials").
			WithField(
			NewInfoParameter("how_works", "Will attempt to login on a guest portal with provided credentials"),
			NewVariantsParameter("credentials", "Credentials").
				WithVariants(
					NewVariant("list").WithShort("From list").
						WithDescription("Credentials from the list").
						WithField(NewListParameter("credentialsList", "Credentials list", "").
							SetHint("Format user:password. One record per line").
							SetAllowFromFile(true)),
					NewVariant("dictionaries").WithShort("From dictionaries").WithField(
						NewDictionaryParameter("credentialsDictionary", []string{},
							[]dictionaries.DictionaryType{dictionaries.Credentials, dictionaries.Unclassified}).
							WithSelect(DictionarySelectRandom).
							WithAllowRepeats(true),
					),
				),
			NewTextInputParameter("accessCode", "Access code", "").SetHint("Leave empty if not needed"),
			NewCollapseSetParameter("fineTune", "Fine tune").WithFields(
				NewColumnsParameter("fineTuneColumns").
					WithColumn(ParamsSlice{}.
						With(NewDivider().WithLabel("Conditions")).
						With(getGuestFlowSuccessCondition(GuestFlowWithCreds)).
						With(NewDivider().WithLabel("Forms")).
						With(
							NewTextInputParameter("loginFormName", "Login form name", "loginForm"),
							NewTextInputParameter("aupFormName", "AUP form name", "aupForm"),
							guestTokenForm)...).
					WithColumn(ParamsSlice{}.
						With(NewDivider().WithLabel("Login fields")).
						With(guestLoginNames...)...),
			),
		)

	selfRegParams = NewVariant(GuestFlowSelfReg).WithShort("Self-registration").
			WithField(
			NewInfoParameter("how_works", "Will attempt to self-register on a guest portal and login"),
			NewVariantsParameter("userNameRule", "Username").WithInline(true).
				WithVariants(getSelfRegRuleVariants(getGuestSelfRegRuleVariantsOptions{
					Username: true,
				})...).
				WithValue("others"),
			NewVariantsParameter("firstNameRule", "First name").WithInline(true).
				WithVariants(
					getSelfRegRuleVariants(getGuestSelfRegRuleVariantsOptions{
						Dictionary: dictionaryPrefixByName + "First Names",
						Faker:      fakerFirstName,
					})...,
				).
				WithValue("faker"),
			NewVariantsParameter("lastNameRule", "Last name").WithInline(true).
				WithVariants(
					getSelfRegRuleVariants(getGuestSelfRegRuleVariantsOptions{
						Dictionary: dictionaryPrefixByName + "Last Names",
						Faker:      fakerLastName,
					})...,
				).
				WithValue("faker"),
			NewVariantsParameter("emailAddressRule", "Email address").WithInline(true).
				WithVariants(
					getSelfRegRuleVariants(getGuestSelfRegRuleVariantsOptions{
						Email: true,
						Faker: fakerEmail,
					})...,
				).
				WithValue("faker"),
			NewVariantsParameter("companyRule", "Company").WithInline(true).
				WithVariants(
					getSelfRegRuleVariants(getGuestSelfRegRuleVariantsOptions{
						Dictionary: dictionaryPrefixByName + "Companies",
						Faker:      fakerCompany,
					})...,
				).
				WithValue("faker"),
			NewVariantsParameter("locationRule", "Location").WithInline(true).
				WithVariants(
					NewVariant("static").WithShort("Specify").
						WithField(NewTextInputParameter("value", "Location name", "").
							SetHint("First found will be used if nothing specified here")),
				),
			NewVariantsParameter("smsProviderRule", "SMS provider").WithInline(true).
				WithVariants(
					NewVariant("static").WithShort("Specify").
						WithField(NewTextInputParameter("value", "SMS provider name", "").
							SetHint("First found will be used if nothing specified here")),
				),
			NewVariantsParameter("personVisitedRule", "Person visited").WithInline(true).
				WithVariants(
					getSelfRegRuleVariants(getGuestSelfRegRuleVariantsOptions{
						Email: true,
						Faker: fakerEmail,
					})...,
				),
			NewVariantsParameter("reasonVisitRule", "Reason visit").WithInline(true).
				WithVariants(
					getSelfRegRuleVariants(getGuestSelfRegRuleVariantsOptions{
						Faker: fakerSentence,
					})...,
				),
			NewTextInputParameter("registrationCode", "Registration code", "").SetHint("Leave empty if not needed"),
			NewTextInputParameter("accessCode", "Access code", "").SetHint("Leave empty if not needed"),
			NewCollapseSetParameter("fineTune", "Fine tune").WithFields(ParamsSlice{}.
				With(
					NewColumnsParameter("fineTuneColumns").
						WithColumn(
							NewNumberInputParameter("reauthAfterTimeout", "Perform full re-authentication "+
								"if SMS is received after N minutes", 5).WithAdditionalRules("min:0"),
							NewDivider().WithLabel("Conditions"),
							getGuestFlowSuccessCondition(GuestFlowSelfReg, guestFlowSuccessConditionOptions{
								Title: "Success condition of registration",
							}),
							getGuestFlowSuccessCondition("login", guestFlowSuccessConditionOptions{
								Title:  "Success condition of login",
								Prefix: "login-",
							}),
							NewDivider().WithLabel("Forms"),
							NewTextInputParameter("selfRegFormName", "Self Registration form name", "selfRegForm"),
							NewTextInputParameter("selfRegSuccessFormName", "Self Registration success form name", "selfRegSuccessForm"),
							NewTextInputParameter("loginFormName", "Login form name", "loginForm"),
							NewTextInputParameter("aupFormName", "AUP form name", "aupForm"),
							guestTokenForm,
						).
						WithColumn(ParamsSlice{}.
							With(NewDivider().WithLabel("Self registration fields")).
							With(guestSelfRegNames()...).
							With(NewDivider().WithLabel("Login fields")).
							With(guestLoginNames...)...),
				)...),
			NewInfoParameter("info",
				"Do not forget to configure SMS Gateway on ISE. "+
					"Check the details at [SMS Configuration page](/settings/sms-gateway)").WithSubType("warning"),
		)

	guestParams = Params{
		{
			Title:    "Guest Flow",
			PropName: "guest",
			Parameters: []Parameter{
				NewVariantsParameter("guestFlow", "Expected guest flow").
					WithVariants(
						NewVariant(GuestFlowNone).WithShort("None"),
						hotSpotParams,
						withCredsParams,
						selfRegParams,
					),
				uaDictionary,
			},
		},
	}

	guest = VariableDefinition{
		Parameters: guestParams,
		Schema:     guestParams.ToJsonSchema(),
	}
)

const (
	GuestFlowNone      = "none"
	GuestFlowHotspot   = "hotspot"
	GuestFlowWithCreds = "with-creds"
	GuestFlowSelfReg   = "self-reg"
)

func Guest() VariableDefinition {
	return guest
}

type guestFlowSuccessConditionOptions struct {
	Title     string
	Name      string
	Postfix   string
	Prefix    string
	Condition string
}

func getGuestFlowSuccessCondition(t string, o ...guestFlowSuccessConditionOptions) Parameter {
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

	return NewTextInputParameter(opts.Prefix+opts.Name+opts.Postfix, opts.Title, opts.Condition).
		SetHint("If matched, authentication considered as successful")
}

type getGuestSelfRegRuleRandomOptions struct {
	Min *int
	Max *int
}

func getGuestSelfRegRuleRandom(o ...getGuestSelfRegRuleRandomOptions) Variant {
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

	return NewVariant("random").WithShort("Random string").
		WithField(
			NewColumnsParameter("randomSpecsColumns").
				WithColumn(ParamsSlice{}.
					With(NewNumberInputParameter("minLength", "Min length", *opts.Min))...).
				WithColumn(ParamsSlice{}.
					With(NewNumberInputParameter("maxLength", "Max length", *opts.Max))...,
				),
		)
}

func getGuestSelfRegRulePattern(p string) Variant {
	if p == "" {
		p = `\w{5,10}`
	}

	return NewVariant("random-pattern").WithShort("Pattern-based").
		WithField(NewTextInputParameter("pattern", "Pattern", p))
}

func getGuestSelfRegRuleEmailPattern() Variant {
	return getGuestSelfRegRulePattern(`\w{5,10}@example[.]com`)
}

func getGuestSelfRegRuleDictionary(value any) Variant {
	var d DictionaryParameter

	switch v := value.(type) {
	case []string:
		d = NewDictionaryParameter("dictionary", v,
			[]dictionaries.DictionaryType{dictionaries.Form, dictionaries.Unclassified})
	case nil:
		d = NewDictionaryParameter("dictionary", []string{},
			[]dictionaries.DictionaryType{dictionaries.Form, dictionaries.Unclassified})
	case string:
		switch {
		case strings.HasPrefix(v, dictionaryPrefixByName):
			d = NewDictionaryParameter("dictionary", []string{},
				[]dictionaries.DictionaryType{dictionaries.Form, dictionaries.Unclassified}).
				PreselectByName(strings.TrimPrefix(v, dictionaryPrefixByName))
		case strings.HasPrefix(v, dictionaryPrefixAllByType):
			d = NewDictionaryParameter("dictionary", []string{},
				[]dictionaries.DictionaryType{dictionaries.Form, dictionaries.Unclassified}).
				PreselectAllOfType(dictionaries.DictionaryType(strings.TrimPrefix(v, dictionaryPrefixAllByType)))
		default:
			d = NewDictionaryParameter("dictionary", []string{},
				[]dictionaries.DictionaryType{dictionaries.Form, dictionaries.Unclassified})
		}
	}

	return NewVariant("dictionary").WithShort("From dictionary").WithField(d)
}

func getGuestSelfRegRuleEmpty() Variant {
	return NewVariant("keep-empty").WithShort("Do not fill").WithField(ParamsSlice{}...)
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

func getGuestSelfRegRuleFunctionsBased(o ...getGuestSelfRegRuleFunctionsBasedOptions) Variant {
	var opts getGuestSelfRegRuleFunctionsBasedOptions
	if len(o) > 0 {
		opts = o[0]
	}

	if opts.Name == "" {
		opts.Name = "others"
	}

	return NewVariant(opts.Name).WithShort("Functions-based").
		WithField(
			NewTextInputParameter("funBasedPattern", "Pattern", opts.Pattern).
				WithButtons(
					NewDropDownSideButton("Insert", "", "", []any{
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

func getGuestSelfRegRuleFaker(what fakerWhat) Variant {
	fn, ok := fakers[what]
	if !ok {
		fn = fakers[fakerSentence]
	}

	return NewVariant("faker").WithShort("Fake data").
		WithField(
			NewHiddenParameter("what", string(what)),
			NewInfoParameter("info", "Example: "+fn()).WithSubType("example"),
		)
}

type getGuestSelfRegRuleVariantsOptions struct {
	Email      bool
	Pattern    string
	Dictionary any
	Username   bool
	Faker      fakerWhat
}

func getSelfRegRuleVariants(o getGuestSelfRegRuleVariantsOptions) []Variant {
	var res []Variant

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

func guestSelfRegNames() []Parameter {
	var res []Parameter
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
		if strings.HasPrefix(fieldName, "guestUser.") {
			fieldName = strings.TrimPrefix(fieldName, "guestUser.")
		}
		fieldName = strcase.ToDelimited(fieldName, '_')
		name := cases.Title(language.English, cases.NoLower).String(strings.ReplaceAll(fieldName, "_", " "))
		res = append(res, NewTextInputParameter("selfRegFields:"+fieldName, name+" field name", n))
	}
	return res
}
