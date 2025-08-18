package rpc

import (
	"fmt"

	j "encoding/json"

	"github.com/cisco-open/sprt/go-generator/sdk/json"
	"github.com/cisco-open/sprt/go-generator/sdk/utils"
	"github.com/rs/zerolog"
	"github.com/sourcegraph/jsonrpc2"
)

func DecodeJSONRPCResponse(data []byte) (*jsonrpc2.Response, error) {
	var resp jsonrpc2.Response
	if err := json.Unmarshal(data, &resp); err != nil {
		return nil, err
	}
	return &resp, nil
}

func GetJSONRPCResult[T any](resp *jsonrpc2.Response, l *zerolog.Logger) (*T, error) {
	if resp.Error != nil {
		l.Error().
			Str("error", resp.Error.Message).
			Int64("code", resp.Error.Code).
			Interface("data", resp.Error.Data).
			Msg("Failed to get running jobs of generator")
		return nil, fmt.Errorf("failed to get running jobs of generator: %s", resp.Error.Message)
	}

	if resp.Result == nil {
		return nil, fmt.Errorf("got empty response from generator")
	}

	var jobsResponse T
	if err := json.Unmarshal(*resp.Result, &jobsResponse); err != nil {
		return nil, err
	}

	return &jobsResponse, nil
}

type ResponseBuilder struct {
	r jsonrpc2.Response
}

func Response(id jsonrpc2.ID) *ResponseBuilder {
	return &ResponseBuilder{
		r: jsonrpc2.Response{
			ID: id,
		},
	}
}

func ResponseWithStringID(id string) *ResponseBuilder {
	return &ResponseBuilder{
		r: jsonrpc2.Response{
			ID: jsonrpc2.ID{Str: id},
		},
	}
}

func ResponseWithNumID(id int64) *ResponseBuilder {
	return &ResponseBuilder{
		r: jsonrpc2.Response{
			ID: jsonrpc2.ID{Num: uint64(id)},
		},
	}
}

func BuildFromResponse(resp *jsonrpc2.Response) *ResponseBuilder {
	return &ResponseBuilder{
		r: *resp,
	}
}

func BuildResponseFromError(err *jsonrpc2.Error) *ResponseBuilder {
	return &ResponseBuilder{
		r: jsonrpc2.Response{
			Error: err,
		},
	}
}

func (b *ResponseBuilder) Error(code int64, err error, data ...j.RawMessage) *ResponseBuilder {
	var dataPtr *j.RawMessage
	if len(data) > 0 {
		dataPtr = &data[0]
	}

	b.r.Error = &jsonrpc2.Error{
		Code:    code,
		Message: err.Error(),
		Data:    dataPtr,
	}
	return b
}

func (b *ResponseBuilder) Result(result any) *ResponseBuilder {
	switch v := result.(type) {
	case j.RawMessage:
		b.r.Result = utils.PtrOf(v)
	case *j.RawMessage:
		b.r.Result = v
	default:
		bt, err := json.Marshal(result)
		if err != nil {
			return b.Error(jsonrpc2.CodeInternalError, err)
		}
		b.r.Result = utils.PtrOf(j.RawMessage(bt))
	}
	return b
}

func (b *ResponseBuilder) Build() jsonrpc2.Response {
	return b.r
}

func (b *ResponseBuilder) Bytes() ([]byte, error) {
	data, err := json.Marshal(b.Build())
	if err != nil {
		return nil, fmt.Errorf("failed to marshal response: %w", err)
	}
	return data, nil
}

type RequestBuilder struct {
	r        jsonrpc2.Request
	buildErr error
}

func Request(method RPCMethod) *RequestBuilder {
	return &RequestBuilder{
		r: jsonrpc2.Request{
			Method: string(method),
		},
	}
}

func BuildFromRequest(req *jsonrpc2.Request) *RequestBuilder {
	return &RequestBuilder{
		r: *req,
	}
}

func (b *RequestBuilder) ID(id jsonrpc2.ID) *RequestBuilder {
	b.r.ID = id
	return b
}

func (b *RequestBuilder) IDStr(id string) *RequestBuilder {
	b.r.ID = jsonrpc2.ID{Str: id}
	return b
}

func (b *RequestBuilder) IDNum(id int64) *RequestBuilder {
	b.r.ID = jsonrpc2.ID{Num: uint64(id)}
	return b
}

func (b *RequestBuilder) Params(params any) *RequestBuilder {
	switch v := params.(type) {
	case j.RawMessage:
		b.r.Params = utils.PtrOf(v)
	case *j.RawMessage:
		b.r.Params = v
	default:
		bt, err := json.Marshal(params)
		if err != nil {
			b.buildErr = fmt.Errorf("failed to marshal params: %w", err)
			return b
		}
		b.r.Params = utils.PtrOf(j.RawMessage(bt))
	}
	return b
}

func (b *RequestBuilder) Build() (jsonrpc2.Request, error) {
	return b.r, b.buildErr
}

func (b *RequestBuilder) Bytes() ([]byte, error) {
	built, err := b.Build()
	if err != nil {
		return nil, err
	}
	data, err := json.Marshal(built)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}
	return data, nil
}
