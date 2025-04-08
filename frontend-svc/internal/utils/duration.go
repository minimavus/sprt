package utils

import (
	"fmt"
	"time"

	"github.com/cisco-open/sprt/frontend-svc/internal/json"
	d "github.com/sosodev/duration"
)

type Duration struct {
	time.Duration
}

func (duration *Duration) UnmarshalJSON(b []byte) error {
	var unmarshalledJSON interface{}

	err := json.Unmarshal(b, &unmarshalledJSON)
	if err != nil {
		return err
	}

	switch value := unmarshalledJSON.(type) {
	case float64:
		duration.Duration = time.Duration(value)
	case string:
		tmp, err := d.Parse(value)
		if err != nil {
			return err
		}
		duration.Duration = tmp.ToTimeDuration()
	default:
		return fmt.Errorf("invalid duration: %#v", unmarshalledJSON)
	}

	return nil
}

func (duration *Duration) MarshalJSON() ([]byte, error) {
	return json.Marshal(duration.Duration)
}

func FromDuration(t time.Duration) Duration {
	return Duration{t}
}
