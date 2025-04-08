package validator

import (
	"fmt"
	"time"

	"github.com/rickb777/date/period"
	"github.com/spf13/cast"
)

// ValidationOptions describes additional validation options
type ValidationOptions struct {
	AllOptional   bool
	SpecificRules map[string]any
	Body          map[string]any
	PathPrefix    string
}

func toDuration(v any) (time.Duration, error) {
	var t time.Duration
	var d struct {
		Years   int
		Months  int
		Weeks   int
		Days    int
		Hours   int
		Minutes int
		Seconds int
	}

	if v, ok := v.(map[string]interface{}); ok {
		for comp, muchAny := range v {
			much, err := cast.ToIntE(muchAny)
			if err != nil {
				return t, err
			}

			switch comp {
			case "years":
				d.Years = much
			case "months":
				d.Months = much
			case "weeks":
				d.Weeks = much
			case "days":
				d.Days = much
			case "hours":
				d.Hours = much
			case "minutes":
				d.Minutes = much
			case "seconds":
				d.Seconds = much
			}
		}

		t, _ = period.New(d.Years, d.Months, d.Days, d.Hours, d.Minutes, d.Seconds).Duration()
		return t, nil
	}

	return t, fmt.Errorf("unknown type: %T", v)
}

// func collectError(errs map[string]any, prefix string, app shared.Logger) error {
// 	for k, e := range errs {
// 		switch e := e.(type) {
// 		case gpv.ValidationErrors:
// 			if len(e) > 0 {
// 				if prefix != "" {
// 					k = prefix + "." + k
// 				}
// 				fe := e[0]
// 				return errors.NewHTTPError(http.StatusBadRequest, fe.Error()).SetField("path", k).SetField("tag", fe.Tag())
// 			}
// 		case map[string]any:
// 			return collectError(e, k, app)
// 		default:
// 			app.Logger().Warn().Msgf("Err: %[1]v of type: %[1]T", e)
// 		}
// 		return errors.NewHTTPError(http.StatusBadRequest, "Incorrect value").SetField("path", k)
// 	}
// 	return nil
// }
