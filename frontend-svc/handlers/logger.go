package handlers

import (
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/rs/zerolog"

	"github.com/cisco-open/sprt/frontend-svc/internal/auth"
)

// LogMessage describes log message received from UI
type LogMessage struct {
	Level      string `json:"level" validate:"required,oneof=trace debug info warn error"`
	Logger     string `json:"logger"`
	Msg        string `json:"message" validate:"required"`
	StackTrace string `json:"stacktrace"`
	Timestamp  string `json:"timestamp" validate:"datetime=2006-01-02T15:04:05.999Z07:00"`
}

const timeFormat = "2006-01-02T15:04:05.999Z07:00"

// LogsBody is a body of a request received from UI
type LogsBody struct {
	Logs []*LogMessage `json:"logs" validate:"required,dive,required"`
}

func StoreUILogs(c echo.Context) error {
	return rest.storeUILogs(c)
}

// StoreUILogs is a handler which receives logs from UI and stores them
func (m *controller) storeUILogs(c echo.Context) error {
	session, _, _ := auth.GetUserDataAndContext(c)

	logs := new(LogsBody)
	if err := c.Bind(logs); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error()).SetInternal(err)
	}
	if err := c.Validate(logs); err != nil {
		return err
	}

	for _, l := range logs.Logs {
		var ev *zerolog.Event
		switch l.Level {
		case "trace":
			ev = m.App.Logger().Trace()
		case "debug":
			ev = m.App.Logger().Debug()
		case "info":
			ev = m.App.Logger().Info()
		case "warn":
			ev = m.App.Logger().Warn()
		case "error":
			ev = m.App.Logger().Error()
		default:
			return echo.ErrBadRequest
		}

		ev = ev.Str("logger", l.Logger).Str("user", session.Email)
		if t, err := time.Parse(timeFormat, l.Timestamp); err == nil {
			ev = ev.Time("ui_timestamp", t).Str("ui_timestamp_str", l.Timestamp)
		}

		if l.StackTrace != "" {
			ev = ev.Str("trace", l.StackTrace)
		}

		ev.Msg(l.Msg)
	}

	return c.JSON(http.StatusOK, "ok")
}
