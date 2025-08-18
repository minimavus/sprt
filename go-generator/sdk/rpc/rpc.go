package rpc

import "encoding/json"

type (
	RPCMethod string

	RPCGenerateParams struct {
		Job  json.RawMessage `json:"job"`
		User string          `json:"user"`
	}

	RPCGenerateResponseParams struct {
		JobID       string `json:"job_id"`
		GeneratorID string `json:"generator_id"`
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

	RPCStopJobParams struct {
		JobID string `json:"job_id"`
		User  string `json:"user"`
	}

	RPCStopJobResponseParams struct {
		Success bool `json:"success"`
	}
)

const (
	RPCMethodGenerate RPCMethod = "generate"

	RPCMethodGetRunningJobs RPCMethod = "get_running_jobs"
	RPCMethodStopJob        RPCMethod = "stop_job"
)
