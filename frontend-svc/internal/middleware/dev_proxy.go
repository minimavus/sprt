package middleware

import (
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"

	"github.com/cisco-open/sprt/frontend-svc/internal/templates"
	"github.com/cisco-open/sprt/frontend-svc/shared"
	"github.com/labstack/echo/v4"
	em "github.com/labstack/echo/v4/middleware"
	"github.com/rs/zerolog/log"
)

func modifyResponse(r *http.Response) (err error) {
	ct := r.Header.Get(echo.HeaderContentType)
	if ct == "" || !strings.Contains(ct, echo.MIMETextHTML) {
		return nil
	}

	b, err := io.ReadAll(r.Body) //Read html
	if err != nil {
		return
	}
	err = r.Body.Close()
	if err != nil {
		return
	}

	session, err := repo.App.SessionStore.Get(r.Request, repo.App.Specs.Session.CookieName)
	if err != nil {
		return
	}
	user, err := repo.currentAuthProvider().Session(session, r.Request, nil)

	buf := new(strings.Builder)
	err = templates.DefaultRenderer.RenderStringCtx(r.Request.Context(), buf, string(b), shared.RenderData{
		Session: shared.SessionData{UserData: user},
	})
	if err != nil {
		return
	}
	body := io.NopCloser(strings.NewReader(buf.String()))

	l := len(buf.String())
	r.Body = body
	r.ContentLength = int64(l)
	r.Header.Set("Content-Length", strconv.Itoa(l))

	return
}

func SetupDevProxy(e *echo.Echo) {
	url, err := url.Parse("http://localhost:5173")
	if err != nil {
		log.Panic().Err(err).Send()
	}

	// Setup a proxy to the vite dev server on localhost:5173
	balancer := em.NewRoundRobinBalancer([]*em.ProxyTarget{{URL: url}})
	e.Use(em.ProxyWithConfig(em.ProxyConfig{
		ModifyResponse: modifyResponse,
		ContextKey:     "proxified",
		Balancer:       balancer,
		Skipper: func(c echo.Context) bool {
			return (len(c.Path()) >= 4 && c.Path()[:4] == "/api") || repo.IsAuthPathSpecific(c, "/logout")
		},
	}))
}
