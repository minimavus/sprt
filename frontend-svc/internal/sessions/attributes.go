package sessions

type (
	GuestFlow struct {
		Fields        *map[string]any `json:"FIELDS"`
		AupForm       *string         `json:"AUP_FORM"`
		FlowType      *string         `json:"FLOW_TYPE"`
		LoginForm     *string         `json:"LOGIN_FORM"`
		UserAgent     *string         `json:"USER_AGENT"`
		AccessCode    *string         `json:"ACCESS_CODE"`
		Credentials   *[]string       `json:"CREDENTIALS"`
		RedirectURL   *string         `json:"REDIRECT_URL"`
		TokenFormName *string         `json:"TOKEN_FORM_NAME"`
		SuccessCond   *string         `json:"SUCCESS_CONDITION"`
	}

	RadiusSessionAttributesSnapshot struct {
		IP        *string    `json:"IP"`
		MAC       *string    `json:"MAC"`
		Owner     *string    `json:"OWNER"`
		SessionID *string    `json:"SESSIONID"`
		GuestFlow *GuestFlow `json:"GUEST_FLOW"`
	}

	RadiusSessionAttributes struct {
		Snapshot *RadiusSessionAttributesSnapshot `json:"snapshot"`
	}
)

func (g *GuestFlow) GetFields() *map[string]any {
	if g == nil {
		return nil
	}

	return g.Fields
}

func (g *GuestFlow) GetAupForm() *string {
	if g == nil {
		return nil
	}

	return g.AupForm
}

func (g *GuestFlow) GetFlowType() *string {
	if g == nil {
		return nil
	}

	return g.FlowType
}

func (g *GuestFlow) GetLoginForm() *string {
	if g == nil {
		return nil
	}

	return g.LoginForm
}

func (g *GuestFlow) GetUserAgent() *string {
	if g == nil {
		return nil
	}

	return g.UserAgent
}

func (g *GuestFlow) GetAccessCode() *string {
	if g == nil {
		return nil
	}

	return g.AccessCode
}

func (g *GuestFlow) GetCredentials() *[]string {
	if g == nil {
		return nil
	}

	return g.Credentials
}

func (g *GuestFlow) GetRedirectURL() *string {
	if g == nil {
		return nil
	}

	return g.RedirectURL
}

func (g *GuestFlow) GetTokenFormName() *string {
	if g == nil {
		return nil
	}

	return g.TokenFormName
}

func (g *GuestFlow) GetSuccessCond() *string {
	if g == nil {
		return nil
	}

	return g.SuccessCond
}

func (r *RadiusSessionAttributesSnapshot) GetIP() *string {
	if r == nil {
		return nil
	}

	return r.IP
}

func (r *RadiusSessionAttributesSnapshot) GetMAC() *string {
	if r == nil {
		return nil
	}

	return r.MAC
}

func (r *RadiusSessionAttributesSnapshot) GetOwner() *string {
	if r == nil {
		return nil
	}

	return r.Owner
}

func (r *RadiusSessionAttributesSnapshot) GetSessionID() *string {
	if r == nil {
		return nil
	}

	return r.SessionID
}

func (r *RadiusSessionAttributesSnapshot) GetGuestFlow() *GuestFlow {
	if r == nil {
		return nil
	}

	return r.GuestFlow
}

func (r *RadiusSessionAttributes) GetSnapshot() *RadiusSessionAttributesSnapshot {
	if r == nil {
		return nil
	}

	return r.Snapshot
}
