package middleware

import (
	"encoding/json"
	"net/http"

	"github.com/labstack/echo/v4"

	"github.com/cisco-open/sprt/frontend-svc/internal/errors"
	"github.com/cisco-open/sprt/frontend-svc/shared"
)

type ProblemJSON map[string]interface{}

func NewProblemJSON() ProblemJSON {
	return ProblemJSON{}
}

func (p *ProblemJSON) SetType(t string) {
	(*p)["type"] = t
}

func (p *ProblemJSON) SetTitle(t string) {
	(*p)["title"] = t
}

func (p *ProblemJSON) SetStatus(s int) {
	(*p)["status"] = s
}

func (p *ProblemJSON) SetDetail(d any) {
	(*p)["detail"] = d
}

func (p *ProblemJSON) SetInstance(i string) {
	(*p)["instance"] = i
}

func (p *ProblemJSON) SetCustomMembers(m map[string]any) {
	if m == nil {
		return
	}

	for k, v := range m {
		(*p)[k] = v
	}
}

func (p *ProblemJSON) AddField(key string, value any) {
	(*p)[key] = value
}

func NewErrorHandler(app shared.Logger) echo.HTTPErrorHandler {
	return func(err error, c echo.Context) {
		if c.Response().Committed {
			return
		}

		var (
			he            *echo.HTTPError
			customMembers map[string]any
		)
		switch err := err.(type) {
		case *echo.HTTPError:
			he = err
			if he.Internal != nil {
				if herr, ok := he.Internal.(*echo.HTTPError); ok {
					he = herr
				}
			}
		case *errors.HTTPError:
			he = &echo.HTTPError{
				Code:     err.Code,
				Message:  err.Message,
				Internal: err.Internal,
			}
			customMembers = err.CustomMembers
		default:
			he = &echo.HTTPError{
				Code:    http.StatusInternalServerError,
				Message: http.StatusText(http.StatusInternalServerError),
			}
		}

		message := NewProblemJSON()
		message.SetTitle(http.StatusText(he.Code))
		message.SetStatus(he.Code)
		message.SetInstance(c.Request().URL.Path)
		message.SetCustomMembers(customMembers)

		switch m := he.Message.(type) {
		case string:
			message.SetDetail(m)
			message.AddField("error", err.Error())
		case json.Marshaler:
			b, _ := m.MarshalJSON()
			message.SetDetail(string(b))
		case error:
			message.SetDetail(m.Error())
		}

		if he.Internal != nil {
			message.AddField("reason", he.Internal.Error())
		}

		if c.Request().Method == http.MethodHead { // Issue #608
			err = c.NoContent(he.Code)
		} else {
			err = c.JSON(he.Code, message)
		}
		if err != nil {
			app.Logger().Err(err).Send()
		}
	}
}
