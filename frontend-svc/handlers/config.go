package handlers

import (
	"fmt"

	"github.com/cisco-open/sprt/frontend-svc/internal/auth"
	"github.com/cisco-open/sprt/frontend-svc/shared"
	"github.com/labstack/echo/v4"
)

var exposedConfigs = map[string]string{
	"generator.source-ip.exclude":             "Excluded IPs",
	"generator.source-ip.allowed":             "Allowed IPs",
	"generator.source-ip.auto-detect":         "Auto-detect IPs and interfaces",
	"generator.source-ip.explicit-sources":    "Explicit source IPs",
	"generator.max-var-tries":                 "Max tries for variable generation",
	"generator.patterns.session-id":           "Session ID pattern",
	"generator.watcher-lifetime":              "Watcher lifetime",
	"generator.jobs.max-conc":                 "Max concurrent jobs per user",
	"generator.jobs.max-threads":              "Max threads per job",
	"generator.jobs.max-sessions-per-job":     "Max sessions per job",
	"generator.radius.max-retransmits":        "Max RADIUS retransmits",
	"generator.radius.max-retransmit-timeout": "Max RADIUS retransmit timeout",
}

var exposedConfigKeys = make([]string, 0, len(exposedConfigs))

func init() {
	for k := range exposedConfigs {
		exposedConfigKeys = append(exposedConfigKeys, k)
	}
}

func (m *controller) GetGlobalConfig(c echo.Context) error {
	u, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	configs, ok := m.App.GetSpecs(ctx, exposedConfigKeys...)
	if !ok {
		m.App.Logger().Error().Str("user", u.ForUser).Msg("GetGlobalConfig failed")
		return echo.ErrInternalServerError
	}

	return c.JSON(200, configs)
}

func (m *controller) UpdateGlobalConfig(c echo.Context) error {
	u, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	req := make(map[string]any)
	if err = m.bindAndValidate(c, req); err != nil {
		return err
	}
	for k := range req {
		if _, ok := exposedConfigs[k]; !ok {
			return echo.ErrBadRequest.WithInternal(fmt.Errorf("invalid config key: %s", k))
		}
	}

	for k, v := range req {
		m.App.Logger().Debug().Str("user", u.ForUser).Str("key", k).Interface("value", v).Msg("UpdateGlobalConfig")
		if err = m.App.SetSpec(ctx, k, v, shared.SetSpecOptions{AllowDbOnly: true}); err != nil {
			return echo.ErrInternalServerError.WithInternal(err)
		}
	}

	return c.NoContent(200)
}
