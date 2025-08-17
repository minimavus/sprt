package service

import (
	"context"
	"errors"

	"github.com/cisco-open/sprt/go-generator/sdk/db"
	"github.com/cisco-open/sprt/go-generator/specs"
)

var _ specs.SpecSetter = (*Service)(nil)
var _ specs.SpecNotifier = (*Service)(nil)

func (app *Service) mustInitSpecNotifier() *Service {
	app.n = specs.NewSpecNotifier()
	return app
}

func getSetSpecOptions(opts ...specs.SetSpecOptions) specs.SetSpecOptions {
	if len(opts) == 0 {
		return specs.SetSpecOptions{}
	}
	return opts[0]
}

func (app *Service) SetSpec(ctx context.Context, key string, value any, opts ...specs.SetSpecOptions) (err error) {
	o := getSetSpecOptions(opts...)

	shouldRevert := true
	defer func(oldValue any) {
		if !shouldRevert {
			return
		}
		err = app.Specs.SetSpec(key, oldValue)
	}(app.Specs.GetSpec(key))

	err = app.Specs.SetSpec(key, value)
	if err != nil {
		if !o.AllowDbOnly || !errors.Is(err, specs.ErrFieldNotFound) {
			return
		}
	}

	err = db.Exec(app).SetAppConfig(ctx, key, value)
	if err != nil {
		return
	}
	shouldRevert = false

	err = app.n.Exec(key, value)
	if err != nil {
		app.Logger().Warn().Err(err).Msg("Failed to execute OnSpecChange")
		err = nil
	}

	return nil
}

func (app *Service) GetSpec(ctx context.Context, key string) (any, bool) {
	v, ok := app.Specs.QuerySpec(key)
	if ok {
		return v, true
	}

	mp, err := db.Exec(app).GetAppConfig(ctx, key)
	if err != nil {
		app.Logger().Error().Err(err).Msg("Failed to get app config")
		return nil, false
	}
	if len(mp) == 0 {
		return nil, false
	}

	v, ok = mp[key]
	return v, ok
}

func (app *Service) GetSpecs(_ context.Context, keys ...string) (map[string]any, bool) {
	if len(keys) == 0 {
		return nil, false
	}

	missingKeys := make([]string, 0)
	configs := make(map[string]any, len(keys))
	for _, k := range keys {
		v, ok := app.Specs.QuerySpec(k)
		if ok {
			configs[k] = v
			continue
		}
		missingKeys = append(missingKeys, k)
	}

	if len(missingKeys) == 0 {
		return configs, true
	}

	mp, err := db.Exec(app).GetAppConfig(context.Background(), missingKeys...)
	if err != nil {
		app.Logger().Error().Err(err).Msg("Failed to get app config")
		return nil, false
	}

	for k, v := range mp {
		configs[k] = v
	}

	return configs, true
}

func (app *Service) OnSpecChange(key string, cb specs.SpecChangeCallback) {
	app.n.On(key, cb)
}

func (app *Service) OffSpecChange(key string, cb specs.SpecChangeCallback) {
	app.n.Off(key, cb)
}
