package handlers

import (
	"fmt"

	"github.com/cisco-open/sprt/frontend-svc/internal/auth"
	"github.com/cisco-open/sprt/go-generator/specs"
	"github.com/labstack/echo/v4"
)

type (
	field struct {
		Label string `json:"label"`
		Type  string `json:"type"`
	}

	fieldWithValue struct {
		field
		Value any `json:"value"`
	}
)

const (
	fieldTypeString    = "string"
	fieldTypeInt       = "int"
	fieldTypeBool      = "bool"
	fieldTypeArrayStr  = "array[string]"
	fieldTypeArrayInt  = "array[int]"
	fieldTypeArrayBool = "array[bool]"
)

var exposedConfigs = map[string]field{
	"generator.source-ip.exclude":          {"Excluded (IPs/patterns)", fieldTypeArrayStr},
	"generator.source-ip.allowed":          {"Allowed (IPs/patterns)", fieldTypeArrayStr},
	"generator.source-ip.auto-detect":      {"Auto-detect IPs and interfaces", fieldTypeBool},
	"generator.source-ip.explicit-sources": {"Explicit source IPs", fieldTypeArrayStr},
	"generator.max-var-tries":              {"Max tries for variable generation", fieldTypeInt},
	"generator.patterns.session-id":        {"Session ID pattern", fieldTypeString},
	"generator.watcher-lifetime":           {"Watcher lifetime (seconds)", fieldTypeInt},
	"generator.jobs.max-conc":              {"Max concurrent jobs per user", fieldTypeInt},
	"generator.jobs.max-threads":           {"Max threads per job", fieldTypeInt},
	"generator.jobs.max-sessions-per-job":  {"Max sessions per job", fieldTypeInt},
	"generator.radius.max-retransmits":     {"Max RADIUS retransmits", fieldTypeInt},
	"generator.radius.max-timeout":         {"Max RADIUS timeout (seconds)", fieldTypeInt},
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

	config, ok := m.App.GetSpecs(ctx, exposedConfigKeys...)
	if !ok {
		m.App.Logger().Error().Str("user", u.ForUser).Msg("GetGlobalConfig failed")
		return echo.ErrInternalServerError
	}

	globalConfig := make(map[string]fieldWithValue, len(exposedConfigs))
	for k, v := range exposedConfigs {
		if val, ok := config[k]; ok {
			globalConfig[k] = fieldWithValue{
				field: v,
				Value: val,
			}
		} else {
			globalConfig[k] = fieldWithValue{
				field: v,
				Value: nil,
			}
		}
	}

	return c.JSON(200, map[string]any{
		"config": globalConfig,
	})
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
		if err = m.App.SetSpec(ctx, k, v, specs.SetSpecOptions{AllowDbOnly: true}); err != nil {
			return echo.ErrInternalServerError.WithInternal(err)
		}
	}

	return c.NoContent(200)
}
