package handlers

import (
	j "encoding/json"
	"fmt"
	"net/http"

	"github.com/go-viper/mapstructure/v2"
	"github.com/kaptinlin/jsonschema"
	"github.com/labstack/echo/v4"

	"github.com/cisco-open/sprt/frontend-svc/internal/auth"
	"github.com/cisco-open/sprt/frontend-svc/internal/policy"
	"github.com/cisco-open/sprt/frontend-svc/internal/user"
	"github.com/cisco-open/sprt/frontend-svc/internal/variables"
	"github.com/cisco-open/sprt/go-generator/sdk/json"
	"github.com/cisco-open/sprt/go-generator/sdk/registry"
	"github.com/cisco-open/sprt/go-generator/sdk/schemas"
)

var defaultJSONSchemaCompiler = jsonschema.NewCompiler()

func (m *controller) GetProtoSpecificParams(c echo.Context) error {
	req := new(struct {
		Proto string `param:"proto" validate:"required"`
	})
	if err := m.bindAndValidate(c, req); err != nil {
		return err
	}

	definition, err := variables.GetProtoDefinition(req.Proto)
	if err != nil {
		return c.JSON(http.StatusOK, map[string]any{})
	}

	return c.JSON(http.StatusOK, definition)
}

func (m *controller) GetVariableDefinition(c echo.Context) error {
	req := new(struct {
		Variable string `param:"variable" validate:"required"`
	})
	if err := m.bindAndValidate(c, req); err != nil {
		return err
	}

	definition, err := variables.GetVariableDefinition(req.Variable)
	if err != nil {
		return echo.ErrNotFound.WithInternal(err)
	}

	return c.JSON(http.StatusOK, definition)
}

func (m *controller) GetAvailableIPSources(c echo.Context) error {
	req := new(struct {
		IncludeAll bool `query:"include_all"`
	})
	if err := m.bindAndValidate(c, req); err != nil {
		return err
	}

	u, _, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}
	if !policy.UserCan(u, "ipsources.read.all") {
		return echo.ErrForbidden
	}

	sources, err := m.App.Generator().GetAvailableIPSources(req.IncludeAll)
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	return c.JSON(http.StatusOK, sources)
}

func (m *controller) GetRadiusDictionaries(c echo.Context) error {
	dictionaries, err := m.App.Generator().ListDictionaries()
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	return c.JSON(http.StatusOK, dictionaries)
}

func (m *controller) GetRadiusDictionary(c echo.Context) error {
	u, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	req := new(struct {
		Name string `param:"name" validate:"required"`
	})
	if err = m.bindAndValidate(c, req); err != nil {
		return err
	}

	if u.ForUser != u.UserID && !policy.UserCan(u, "dictionaries.read.others") {
		return echo.ErrForbidden
	}

	m.App.Logger().Debug().
		Str("uid", u.ForUser).Str("name", req.Name).Msg("Get dictionary")

	dict, friendly, err := m.App.Generator().GetDictionary(ctx, req.Name, u.ForUser)
	if err != nil {
		m.App.Logger().Error().
			Err(err).Str("name", req.Name).Str("uid", u.ForUser).
			Msg("Failed to get dictionary")
		return echo.ErrInternalServerError.WithInternal(err)
	}

	response := map[string]any{
		"name": req.Name,
		"data": dict,
	}
	if friendly != "" {
		response["friendly_name"] = friendly
	}

	return c.JSON(http.StatusOK, response)
}

func (m *controller) GetProtoDefaults(c echo.Context) error {
	u, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	req := new(struct {
		Proto string `param:"proto" validate:"required"`
	})
	if err = m.bindAndValidate(c, req); err != nil {
		return err
	}

	res, err := user.GetUserProtoDefaults(ctx, m.App, *u, req.Proto)
	if err != nil {
		m.App.Logger().Error().
			Err(err).Str("proto", req.Proto).Str("uid", u.ForUser).
			Msg("Failed to get proto defaults")
		return echo.ErrInternalServerError.WithInternal(err)
	}

	return c.JSON(http.StatusOK, res)
}

func (m *controller) GetSupportedTLSCipherSuites(c echo.Context) error {
	req := new(struct {
		Proto   string `query:"proto" validate:"required"`
		Version string `query:"version" validate:"omitempty,oneof=TLSv1 TLSv1_1 TLSv1_2 TLSv1_3"`
	})
	if err := m.bindAndValidate(c, req); err != nil {
		return err

	}

	ciphers, err := m.App.Generator().GetTLSCipherSuites(req.Proto, req.Version)
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	return c.JSON(http.StatusOK, ciphers)
}

// Generate handles the generate request
func (m *controller) Generate(c echo.Context) error {
	u, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	m.App.Logger().Debug().Str("uid", u.ForUser).Msg("Generate request received")

	rawBody := map[string]any{}
	if err = json.NewDecoder(c.Request().Body).Decode(&rawBody); err != nil {
		m.App.Logger().Error().Err(err).Str("uid", u.ForUser).
			Msg("Failed to decode request body")
		return echo.ErrBadRequest.WithInternal(err)
	}

	decodedBody := schemas.GenerateJSON{}
	if err = mapstructure.Decode(rawBody, &decodedBody); err != nil {
		m.App.Logger().Error().Err(err).Str("uid", u.ForUser).
			Msg("Failed to map request body")
		return echo.ErrBadRequest.WithInternal(err)
	}

	proto := decodedBody.General.Job.Proto
	m.App.Logger().Debug().Str("uid", u.ForUser).Str("proto", proto).
		Msg("Starting new generate job")

	if err = m.validateProtoSchema(u, proto, decodedBody.Other); err != nil {
		m.App.Logger().Error().Err(err).Str("uid", u.ForUser).Str("proto", proto).
			Msg("Validation failed for proto body")
		return echo.ErrBadRequest.WithInternal(err)
	}

	if decodedBody.General.Server.LoadedID != nil {
		// validate guest and CoA parameters
		if err = m.validateSchemaForLoadedServer(&decodedBody); err != nil {
			m.App.Logger().Error().Err(err).Str("uid", u.ForUser).Str("proto", proto).
				Msg("Validation failed for guest and CoA parameters")
			return echo.ErrBadRequest.WithInternal(err)
		}
	}

	rawBodyBytes, err := json.Marshal(rawBody)
	if err != nil {
		m.App.Logger().Error().Err(err).Str("uid", u.ForUser).Str("proto", proto).
			Msg("Failed to marshal raw body")
		return echo.ErrInternalServerError.WithInternal(err)
	}

	jobID, err := m.App.Queue().PublishGenerateJob(ctx, rawBodyBytes, u)
	if err != nil {
		m.App.Logger().Error().Err(err).Str("uid", u.ForUser).Str("proto", proto).
			Msg("Failed to publish generate job")
		return echo.ErrInternalServerError.WithInternal(err)
	}

	return c.JSON(http.StatusOK, map[string]any{"id": jobID})
}

// validateProtoSchema validates the proto schema
func (m *controller) validateProtoSchema(u *auth.ExtendedUserData, proto string, others map[string]any) error {
	m.App.Logger().Debug().Str("uid", u.ForUser).Str("proto", proto).
		Msg("Getting plugin schema for proto")

	plugin, ok := registry.GetByProvides(proto)
	if !ok {
		return fmt.Errorf("plugin '%s' not found", proto)
	}

	schemas := plugin.JSONSchema()
	if len(schemas) == 0 {
		m.App.Logger().Debug().Str("uid", u.ForUser).Str("proto", proto).
			Msg("Got zero schemas for proto, skip validation")
		return nil
	}

	protoParams := plugin.Parameters()

	if len(schemas) != protoParams.Len() {
		m.App.Logger().Error().Str("uid", u.ForUser).Str("proto", proto).
			Int("schemas", len(schemas)).Int("params", protoParams.Len()).
			Msg("Proto provided incorrect amount of schemas to validate")
		return fmt.Errorf("proto provided incorrect amount of schemas to validate")
	}

	m.App.Logger().Debug().Str("uid", u.ForUser).Str("proto", proto).Int("schemas", len(schemas)).
		Msg("Validating proto schema")

	for i := range protoParams.Len() {
		pp := protoParams.At(i)
		m.App.Logger().Debug().Str("uid", u.ForUser).Str("proto", proto).Str("property", pp.PropName).
			Msg("Validating property")

		rawParamData, ok := others[pp.PropName]
		if !ok {
			return fmt.Errorf("property '%s' not present on request", pp.PropName)
		}

		dataAsMap, ok := rawParamData.(map[string]any)
		if !ok {
			m.App.Logger().Error().Str("uid", u.ForUser).Str("proto", proto).Str("property", pp.PropName).
				Msgf("Property isn't JSON object, got: %T", rawParamData)
			return fmt.Errorf("property '%s' isn't JSON object", pp.PropName)
		}

		schema, err := defaultJSONSchemaCompiler.Compile(schemas[i])
		if err != nil {
			return fmt.Errorf("failed to compile validation schema: %w", err)
		}

		result := schema.ValidateMap(dataAsMap)
		if !result.IsValid() {
			result.InstanceLocation = pp.PropName
			return result
		}
	}

	return nil
}

func (m *controller) validateSchemaForLoadedServer(d *schemas.GenerateJSON) error {
	coaSchema := variables.COA.Schema.([]j.RawMessage)[0]
	coaCompiled, err := defaultJSONSchemaCompiler.Compile(coaSchema)
	if err != nil {
		return fmt.Errorf("failed to compile validation schema: %w", err)
	}

	coa, ok := d.Other["coa"].(map[string]any)
	if ok {
		result := coaCompiled.ValidateMap(coa)
		if !result.IsValid() {
			result.InstanceLocation = "coa"
			return result
		}
	}

	guestSchema := variables.Guest.Schema.([]j.RawMessage)[0]
	guestCompiled, err := defaultJSONSchemaCompiler.Compile(guestSchema)
	if err != nil {
		return fmt.Errorf("failed to compile validation schema: %w", err)
	}

	guest, ok := d.Other["guest"].(map[string]any)
	if ok {
		result := guestCompiled.ValidateMap(guest)
		if !result.IsValid() {
			result.InstanceLocation = "guest"
			return result
		}
	}

	return nil
}
