package rpc

import (
	"context"
	"fmt"
	"reflect"
	"sync"

	"github.com/cisco-open/sprt/go-generator/sdk/json"
	"github.com/rs/zerolog"
	"github.com/sourcegraph/jsonrpc2"
)

type (
	RPCMethodHandler func(ctx context.Context, req *jsonrpc2.Request, data any) (*jsonrpc2.Response, error)

	methodHandler struct {
		handler RPCMethodHandler
		params  any
	}

	RPCMethodsMap struct {
		mux     sync.RWMutex
		methods map[string]map[RPCMethod]methodHandler
		l       *zerolog.Logger
	}
)

func MethodsMap(l *zerolog.Logger) *RPCMethodsMap {
	return &RPCMethodsMap{
		l:       l,
		methods: make(map[string]map[RPCMethod]methodHandler),
	}
}

func (m *RPCMethodsMap) On(queue string, method RPCMethod, handler RPCMethodHandler, expectedParams any) {
	m.mux.Lock()
	defer m.mux.Unlock()

	if _, ok := m.methods[queue]; !ok {
		m.methods[queue] = make(map[RPCMethod]methodHandler)
	}

	m.methods[queue][method] = methodHandler{
		handler: handler,
		params:  expectedParams,
	}
}

func (m *RPCMethodsMap) Handle(ctx context.Context, queue string, data []byte) (*jsonrpc2.Response, *jsonrpc2.Error) {
	var req jsonrpc2.Request
	if err := json.Unmarshal(data, &req); err != nil {
		return nil, &jsonrpc2.Error{
			Code:    jsonrpc2.CodeParseError,
			Message: err.Error(),
		}
	}

	var result *jsonrpc2.Response
	var errRaw error

	m.mux.RLock()
	handler, ok := m.methods[queue][RPCMethod(req.Method)]
	m.mux.RUnlock()

	if ok {
		if handler.params == nil {
			result, errRaw = handler.handler(ctx, &req, nil)
			if errRaw != nil {
				return nil, &jsonrpc2.Error{
					Code:    jsonrpc2.CodeInternalError,
					Message: errRaw.Error(),
				}
			}
		} else {
			if req.Params == nil {
				return nil, &jsonrpc2.Error{
					Code:    jsonrpc2.CodeInvalidParams,
					Message: fmt.Sprintf("params cannot be nil for method %s", req.Method),
				}
			}
			t := reflect.TypeOf(handler.params)
			var holderIf any
			if t.Kind() == reflect.Ptr {
				holderIf = reflect.New(t.Elem()).Interface()
			} else {
				holderIf = reflect.New(t).Interface()
			}

			if err := json.Unmarshal(*req.Params, holderIf); err != nil {
				return nil, &jsonrpc2.Error{
					Code:    jsonrpc2.CodeInvalidParams,
					Message: err.Error(),
				}
			}

			result, errRaw = handler.handler(ctx, &req, holderIf)
			if errRaw != nil {
				return nil, &jsonrpc2.Error{
					Code:    jsonrpc2.CodeInternalError,
					Message: errRaw.Error(),
				}
			}
		}
	} else {
		return nil, &jsonrpc2.Error{
			Code:    jsonrpc2.CodeMethodNotFound,
			Message: fmt.Sprintf("method %s not found", req.Method),
		}
	}

	return result, nil
}
