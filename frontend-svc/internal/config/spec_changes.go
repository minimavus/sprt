package config

import (
	"context"
	"fmt"
	"reflect"
	"sync"

	"github.com/cisco-open/sprt/frontend-svc/internal/db"
	"github.com/cisco-open/sprt/frontend-svc/shared"
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

func (app *AppConfig) SetSpec(ctx context.Context, key string, value any) (err error) {
	shouldRevert := true
	defer func(oldValue any) {
		if !shouldRevert {
			return
		}
		err = app.Specs.setSpec(key, oldValue)
	}(app.Specs.getSpec(key))

	err = app.Specs.setSpec(key, value)
	if err != nil {
		return
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

func (app *AppConfig) OnSpecChange(key string, cb shared.SpecChangeCallback) {
	app.n.add(key, cb)
}

func (app *AppConfig) OffSpecChange(key string, cb shared.SpecChangeCallback) {
	app.n.remove(key, cb)
}
