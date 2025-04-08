package frontend

import (
	"embed"

	"github.com/labstack/echo/v4"

	"github.com/cisco-open/sprt/frontend-svc/handlers"
	"github.com/cisco-open/sprt/frontend-svc/internal/config"
	"github.com/cisco-open/sprt/frontend-svc/internal/middleware"
	"github.com/cisco-open/sprt/frontend-svc/internal/templates"
)

var (
	//go:embed dist/*
	dist embed.FS

	//go:embed dist/index.html
	indexHTML embed.FS

	distDirFS     = echo.MustSubFS(dist, "dist")
	distIndexHTML = echo.MustSubFS(indexHTML, "dist")
	assetsFS      = echo.MustSubFS(dist, "dist/assets")
)

func Register(app *config.AppConfig, e *echo.Echo) {
	e.Renderer = templates.NewTemplates(app,
		templates.WithIndexFS(distIndexHTML), templates.WithOverwriteDefault(),
	)

	if !app.InProduction() {
		app.Logger().Debug().Msg("Running frontend in dev mode")
		middleware.SetupDevProxy(e)
		return
	}

	// Use the static assets from the dist directory
	e.GET("/index.html", handlers.Default)
	// e.FileFS("/", "index.html", distIndexHTML)
	e.FileFS("/favicon.ico", "favicon.png", distDirFS)
	e.FileFS("/favicon.png", "favicon.png", distDirFS)
	e.StaticFS("/assets/*", assetsFS)
	e.GET("/*", handlers.Default)
}
