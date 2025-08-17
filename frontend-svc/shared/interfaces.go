package shared

import (
	"io/fs"

	"github.com/labstack/echo/v4"
)

type (
	EchoRouter interface {
		Add(method string, path string, handler echo.HandlerFunc, middleware ...echo.MiddlewareFunc) *echo.Route
		Any(path string, handler echo.HandlerFunc, middleware ...echo.MiddlewareFunc) []*echo.Route
		CONNECT(path string, h echo.HandlerFunc, m ...echo.MiddlewareFunc) *echo.Route
		DELETE(path string, h echo.HandlerFunc, m ...echo.MiddlewareFunc) *echo.Route
		File(path string, file string)
		FileFS(path string, file string, filesystem fs.FS, m ...echo.MiddlewareFunc) *echo.Route
		GET(path string, h echo.HandlerFunc, m ...echo.MiddlewareFunc) *echo.Route
		Group(prefix string, middleware ...echo.MiddlewareFunc) (sg *echo.Group)
		HEAD(path string, h echo.HandlerFunc, m ...echo.MiddlewareFunc) *echo.Route
		Match(methods []string, path string, handler echo.HandlerFunc, middleware ...echo.MiddlewareFunc) []*echo.Route
		OPTIONS(path string, h echo.HandlerFunc, m ...echo.MiddlewareFunc) *echo.Route
		PATCH(path string, h echo.HandlerFunc, m ...echo.MiddlewareFunc) *echo.Route
		POST(path string, h echo.HandlerFunc, m ...echo.MiddlewareFunc) *echo.Route
		PUT(path string, h echo.HandlerFunc, m ...echo.MiddlewareFunc) *echo.Route
		RouteNotFound(path string, h echo.HandlerFunc, m ...echo.MiddlewareFunc) *echo.Route
		Static(pathPrefix string, fsRoot string)
		StaticFS(pathPrefix string, filesystem fs.FS)
		TRACE(path string, h echo.HandlerFunc, m ...echo.MiddlewareFunc) *echo.Route
		Use(middleware ...echo.MiddlewareFunc)
	}
)
