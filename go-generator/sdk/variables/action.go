package variables

type (
	UseAction string

	act struct {
		A UseAction `json:"action"`
		T string    `json:"target"`
		V any       `json:"value,omitempty"`
	}
)

const (
	UseActionSetValue   UseAction = "set_value"
	UseActionHideValues UseAction = "hide_values"
	UseActionShowValues UseAction = "show_values"
	UseActionHide       UseAction = "hide"
	UseActionShow       UseAction = "show"
	UseActionDisable    UseAction = "disable"
	UseActionEnable     UseAction = "enable"
)

func ActionSetValue(target string, value any) act {
	return act{A: UseActionSetValue, T: target, V: value}
}

func ActionHide(target string) act {
	return act{A: UseActionHide, T: target}
}

func ActionShow(target string) act {
	return act{A: UseActionShow, T: target}
}

func ActionHideValues(target string, value any) act {
	return act{A: UseActionHideValues, T: target, V: value}
}

func ActionShowValues(target string, value any) act {
	return act{A: UseActionShowValues, T: target, V: value}
}

func ActionDisable(target string) act {
	return act{A: UseActionDisable, T: target}
}

func ActionEnable(target string) act {
	return act{A: UseActionEnable, T: target}
}
