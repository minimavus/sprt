package config

import (
	"context"
	"errors"
	"fmt"
	"reflect"
	"sync"

	"github.com/cisco-open/sprt/frontend-svc/internal/db"
	"github.com/cisco-open/sprt/frontend-svc/shared"
	"github.com/cisco-open/sprt/go-generator/specs"
)

var _ shared.SpecSetter = (*AppConfig)(nil)
var _ shared.SpecNotifier = (*AppConfig)(nil)

type notifier struct {
	sync.RWMutex
	m map[string][]shared.SpecChangeCallback
}

func (n *notifier) exec(key string, value any) (err error) {
	defer func() {
		if r := recover(); r != nil {
			err = fmt.Errorf("OnSpecChange recover for key '%s': %v", key, r)
			return
		}
	}()

	n.RLock()
	defer n.RUnlock()

	l, ok := n.m[key]
	if !ok || len(l) == 0 {
		return
	}

	for _, v := range l {
		v(key, value)
	}

	return
}

func (n *notifier) add(key string, cb shared.SpecChangeCallback) {
	n.Lock()
	defer n.Unlock()

	n.m[key] = append(n.m[key], cb)
}

func (n *notifier) remove(key string, cb shared.SpecChangeCallback) {
	n.Lock()
	defer n.Unlock()

	l, ok := n.m[key]
	if !ok || len(l) == 0 {
		return
	}

	newslice := make([]shared.SpecChangeCallback, 0)

	for _, v := range l {
		if reflect.ValueOf(v).Pointer() != reflect.ValueOf(cb).Pointer() {
			continue
		}
		newslice = append(newslice, v)
	}

	n.m[key] = newslice
}

func (app *AppConfig) mustInitSpecNotifier() *AppConfig {
	app.n = &notifier{
		m: make(map[string][]shared.SpecChangeCallback),
	}
	return app
}

func getSetSpecOptions(opts ...shared.SetSpecOptions) shared.SetSpecOptions {
	if len(opts) == 0 {
		return shared.SetSpecOptions{}
	}
	return opts[0]
}

func (app *AppConfig) SetSpec(ctx context.Context, key string, value any, opts ...shared.SetSpecOptions) (err error) {
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

	err = app.n.exec(key, value)
	if err != nil {
		app.Logger().Warn().Err(err).Msg("Failed to execute OnSpecChange")
		err = nil
	}

	return nil
}

func (app *AppConfig) GetSpec(ctx context.Context, key string) (any, bool) {
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

func (app *AppConfig) GetSpecs(_ context.Context, keys ...string) (map[string]any, bool) {
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

func (app *AppConfig) OnSpecChange(key string, cb shared.SpecChangeCallback) {
	app.n.add(key, cb)
}

func (app *AppConfig) OffSpecChange(key string, cb shared.SpecChangeCallback) {
	app.n.remove(key, cb)
}
