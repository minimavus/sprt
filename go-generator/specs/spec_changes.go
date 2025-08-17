package specs

import (
	"context"
	"fmt"
	"reflect"
	"sync"
)

type (
	SetSpecOptions struct {
		AllowDbOnly bool
	}

	SpecSetter interface {
		SetSpec(ctx context.Context, key string, value any, opts ...SetSpecOptions) error
	}

	SpecChangeCallback func(key string, value any)

	SpecNotifier interface {
		OnSpecChange(key string, cb SpecChangeCallback)
		OffSpecChange(key string, cb SpecChangeCallback)
	}

	SpecNotify struct {
		sync.RWMutex
		m map[string][]SpecChangeCallback
	}
)

func NewSpecNotifier() *SpecNotify {
	return &SpecNotify{
		m: make(map[string][]SpecChangeCallback),
	}
}

func (n *SpecNotify) Exec(key string, value any) (err error) {
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

func (n *SpecNotify) On(key string, cb SpecChangeCallback) {
	n.Lock()
	defer n.Unlock()

	n.m[key] = append(n.m[key], cb)
}

func (n *SpecNotify) Off(key string, cb SpecChangeCallback) {
	n.Lock()
	defer n.Unlock()

	l, ok := n.m[key]
	if !ok || len(l) == 0 {
		return
	}

	newslice := make([]SpecChangeCallback, 0)

	for _, v := range l {
		if reflect.ValueOf(v).Pointer() != reflect.ValueOf(cb).Pointer() {
			continue
		}
		newslice = append(newslice, v)
	}

	n.m[key] = newslice
}
