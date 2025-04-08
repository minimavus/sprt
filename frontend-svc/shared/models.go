package shared

import "github.com/cisco-open/sprt/frontend-svc/internal/auth"

type (
	FlagsmithData struct {
		Enabled bool   `json:"enabled"`
		EnvID   string `json:"envID"`
	}

	SessionData struct {
		auth.UserData
		UIDHashed string `json:"UIDHashed"`
	}

	RenderData struct {
		Theme       string
		Environment string
		Session     SessionData
		Attributes  any
		Flagsmith   FlagsmithData `json:"Flagsmith"`
		MenuData    any
	}
)
