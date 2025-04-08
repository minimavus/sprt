package middleware

import (
	"github.com/aohorodnyk/mimeheader"
	"github.com/labstack/echo/v4"
)

var serveKey = "serve"

func Serve() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			accept := c.Request().Header.Get(echo.HeaderAccept)
			ah := mimeheader.ParseAcceptHeader(accept)

			if _, t, matched := ah.Negotiate([]string{echo.MIMETextHTML, echo.MIMEApplicationJSON}, ""); matched {
				if t == echo.MIMEApplicationJSON {
					c.Set(serveKey, "json")
				} else {
					c.Set(serveKey, "html")
				}
			}

			return next(c)
		}
	}
}

func ServeJSON(c echo.Context) bool {
	v := c.Get(serveKey)
	s, ok := v.(string)
	if !ok {
		return false
	}

	return s == "json"
}
