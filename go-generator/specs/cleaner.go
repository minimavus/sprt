package specs

import "time"

type (
	CleanerSpecs struct {
		Enabled   bool          `json:"enabled"`
		Cron      string        `json:"cron"`
		OlderThan time.Duration `json:"older_than"`
	}
)
