package templates

import (
	"context"
	"fmt"
	"html/template"
	"io"

	"github.com/labstack/echo/v4"

	"github.com/cisco-open/sprt/frontend-svc/internal/config"
	"github.com/cisco-open/sprt/frontend-svc/internal/json"
	"github.com/cisco-open/sprt/frontend-svc/internal/user"
	"github.com/cisco-open/sprt/frontend-svc/internal/utils"
	"github.com/cisco-open/sprt/frontend-svc/shared"
)

type TemplateRegistry struct {
	app       *config.AppConfig
	templates map[string]*template.Template
}

var _ echo.Renderer = (*TemplateRegistry)(nil)

var DefaultRenderer *TemplateRegistry

var CustomFuncs = template.FuncMap{
	"marshal": func(v any) template.JS {
		a, _ := json.Marshal(v)
		return template.JS(a)
	},
}

// Render Implement e.Renderer interface
func (t *TemplateRegistry) Render(w io.Writer, name string, data any, c echo.Context) error {
	return t.RenderCtx(c.Request().Context(), w, name, data)
}

func (t *TemplateRegistry) RenderCtx(c context.Context, w io.Writer, name string, data any) error {
	tmpl, ok := t.templates[name]
	if !ok {
		return fmt.Errorf("template not found: %s", name)
	}

	data, err := t.fillMissing(c, data)
	if err != nil {
		return fmt.Errorf("loading template data: %w", err)
	}

	return tmpl.ExecuteTemplate(w, "index.html", data)
}

func (t *TemplateRegistry) RenderStringCtx(c context.Context, w io.Writer, templateString string, data any) error {
	tpl := template.Must(template.New("base").Funcs(CustomFuncs).Parse(templateString))

	data, err := t.fillMissing(c, data)
	if err != nil {
		return fmt.Errorf("loading template data: %w", err)
	}

	return tpl.Execute(w, data)
}

func (t *TemplateRegistry) fillMissing(c context.Context, data any) (any, error) {
	rd, ok := data.(shared.RenderData)
	if !ok {
		t.app.Logger().Warn().Msg("Template rendered w/ unknown data")
		return data, nil
	}

	if rd.Theme == "" {
		rd.Theme = "light"
	}

	if rd.Environment == "" {
		switch t.app.InProduction() {
		case true:
			rd.Environment = "production"
		case false:
			rd.Environment = "dev"
		}
	}

	if rd.Session.UserID == "" {
		return rd, nil
	}

	attributes, err := user.GetUserAttributes(c, t.app, rd.Session.UserData)
	if err != nil {
		t.app.Logger().Error().Err(err).Msg("Failed to get user attributes")
	} else {
		rd.Attributes = attributes

		if th, err := utils.NestedMapLookup[string](attributes, "ui", "theme"); err != nil {
			t.app.Logger().Error().Err(err).Msg("Failed to get user preferred theme")
		} else {
			if th == "default" {
				th = "light"
			}

			rd.Theme = th
		}
	}

	if rd.Session.UIDHashed == "" {
		rd.Session.UIDHashed = utils.Sha1Hash(rd.Session.Email)
	}

	return rd, nil
}

func NewTemplates(app *config.AppConfig, opts ...TemplatesOption) echo.Renderer {
	app.Logger().Debug().Msg("Applying templates")

	o := &options{}
	applyOptions(o, opts...)

	tmpls := make(map[string]*template.Template)

	if app.InProduction() {
		tmpls["index"] = template.Must(
			template.New("index.html").Funcs(CustomFuncs).ParseFS(o.indexFS, "index.html"),
		)
	}

	tmpls["logout"] = template.Must(
		template.New("index.html").Funcs(CustomFuncs).Parse("You were logged out"),
	)

	// templates["logout"] = template.Must(
	// 	template.New("logout.gohtml").Funcs(customFuncs).ParseFiles(
	// 		path.Join(app.Specs.BaseDir, "view/base.gohtml"),
	// 		path.Join(app.Specs.BaseDir, "view/logout.gohtml"),
	// 	),
	// )

	t := &TemplateRegistry{
		app:       app,
		templates: tmpls,
	}

	if o.overwriteDefault {
		DefaultRenderer = t
	}

	return t
}
