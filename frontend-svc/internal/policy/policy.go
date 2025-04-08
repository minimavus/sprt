package policy

import (
	"errors"

	"github.com/cisco-open/sprt/frontend-svc/internal/auth"
	"github.com/gobwas/glob"
	"github.com/labstack/echo/v4"
)

var allowedActions = []glob.Glob{
	glob.MustCompile("certificates.*.own"),
	glob.MustCompile("dictionaries.*.own"),
	glob.MustCompile("generate_defaults.*.own"),
	glob.MustCompile("jobs.*.own"),
	glob.MustCompile("logs.*.own"),
	glob.MustCompile("preferences.*.own"),
	glob.MustCompile("pxgrid.*.own"),
	glob.MustCompile("sessions.*.own"),
	glob.MustCompile("settings.*.own"),
	// glob.MustCompile("*.*.own"),
}

var ErrNotAllowed = errors.New("action not allowed")

func UserCan(u *auth.ExtendedUserData, action string) bool {
	if u.IsAdmin() {
		return true
	}

	for _, v := range allowedActions {
		if v.Match(action) {
			return true
		}
	}

	return false
}

type policyCheckMode string

var (
	policyCheckWhenForDifferentUser policyCheckMode = "for-different-user"
	policyCheckAlways               policyCheckMode = "always"

	ErrUnknownPolicyMode    = errors.New("unknown policy mode")
	ErrEmptyQueryParam      = errors.New("empty query param")
	ErrNoPermissionToVerify = errors.New("no permission to verify")
)

type policyCheck struct {
	mode       policyCheckMode
	permission string
}

func (p *policyCheck) validate() error {
	if p.mode != policyCheckAlways && p.mode != policyCheckWhenForDifferentUser {
		return ErrUnknownPolicyMode
	}

	if p.permission == "" {
		return ErrNoPermissionToVerify
	}

	return nil
}

type PolicyMod interface {
	Apply(p *policyCheck)
}

type PolicyModFunc func(p *policyCheck)

func (f PolicyModFunc) Apply(p *policyCheck) {
	f(p)
}

func applyPolicyMods(p *policyCheck, mods ...PolicyMod) {
	for _, mod := range mods {
		mod.Apply(p)
	}
}

func PoliceAlways() PolicyModFunc {
	return func(p *policyCheck) {
		p.mode = policyCheckAlways
	}
}

func PoliceWhenDifferentUser() PolicyModFunc {
	return func(p *policyCheck) {
		p.mode = policyCheckWhenForDifferentUser
	}
}

func PolicePermission(perm string) PolicyModFunc {
	return func(p *policyCheck) {
		p.permission = perm
	}
}

func defaultPolicy() policyCheck {
	return policyCheck{
		mode: policyCheckWhenForDifferentUser,
	}
}

func IsPermitted(_ echo.Context, u *auth.ExtendedUserData, mods ...PolicyMod) error {
	p := defaultPolicy()
	applyPolicyMods(&p, mods...)

	if err := p.validate(); err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	if p.mode == policyCheckAlways {
		if !UserCan(u, p.permission) {
			return echo.ErrForbidden
		}
		return nil
	}

	if u.ForUser != "" && u.ForUser != u.UserID && !UserCan(u, p.permission) {
		return echo.ErrForbidden
	}

	return nil
}
