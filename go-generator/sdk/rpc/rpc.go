package rpc

import "encoding/json"

type (
	RPCMethod string

	RPCGenerateParams struct {
		Job  json.RawMessage `json:"job"`
		User string          `json:"user"`
	}
)

const (
	RPCMethodGenerate RPCMethod = "generate"
)
