package rpc

import "encoding/json"

type (
	RPCMethod string

	RPCGenerateParams struct {
		Job  json.RawMessage `json:"job"`
		User string          `json:"user"`
	}

	RPCJob struct {
		ID          string  `json:"id"`
		GeneratorID string  `json:"generator_id"`
		Status      string  `json:"status"`
		Progress    float64 `json:"progress"`
		User        string  `json:"user"`
	}

	RPCGetRunningJobsResponseParams struct {
		Jobs []RPCJob `json:"jobs"`
	}
)

const (
	RPCMethodGenerate       RPCMethod = "generate"
	RPCMethodGetRunningJobs RPCMethod = "get_running_jobs"
)
