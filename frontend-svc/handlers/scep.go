package handlers

import (
	"fmt"
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/volatiletech/null/v8"
	"github.com/volatiletech/sqlboiler/v4/types"

	"github.com/cisco-open/sprt/frontend-svc/internal/auth"
	"github.com/cisco-open/sprt/frontend-svc/internal/certificates"
	"github.com/cisco-open/sprt/frontend-svc/internal/db"
	"github.com/cisco-open/sprt/frontend-svc/internal/scep"
	"github.com/cisco-open/sprt/frontend-svc/models"
)

func (m *controller) GetScepServers(c echo.Context) error {
	u, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	scepServers, err := db.Exec(m.App).GetScepServers(ctx, u.ForUser)
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	if scepServers == nil {
		scepServers = []*models.ScepServer{}
	}

	return c.JSON(http.StatusOK, map[string]any{
		"servers": scepServers,
	})
}

func (m *controller) CreateScepServer(c echo.Context) error {
	u, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	req := new(struct {
		Name           string   `json:"name" validate:"required"`
		URL            string   `json:"url" validate:"required"`
		SigningCert    string   `json:"signer" validate:"required"`
		CaCertificates []string `json:"ca_certificates" validate:"required,gt=0"`
		Challenge      string   `json:"challenge"`
	})
	if err := m.bindAndValidate(c, req); err != nil {
		return echo.ErrBadRequest.WithInternal(err)
	}

	_, err = db.Exec(m.App).GetCertificate(ctx, u.ForUser, req.SigningCert)
	if err != nil {
		return echo.ErrBadRequest.WithInternal(err)
	}

	var certs types.JSON
	if err = certs.Marshal(req.CaCertificates); err != nil {
		return echo.ErrBadRequest.WithInternal(err)
	}

	scepServer := &models.ScepServer{
		Name:           null.StringFrom(req.Name),
		URL:            req.URL,
		Signer:         null.StringFrom(req.SigningCert),
		CaCertificates: certs,
	}
	if req.Challenge != "" {
		scepServer.Challenge = null.StringFrom(req.Challenge)
	}

	id, err := db.Exec(m.App).CreateScepServer(ctx, u.ForUser, scepServer)
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	return c.JSON(http.StatusCreated, map[string]any{
		"id": id,
	})
}

func (m *controller) GetScepServer(c echo.Context) error {
	u, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	req := new(struct {
		ID string `param:"id" validate:"required"`
	})
	if err := m.bindAndValidate(c, req); err != nil {
		return echo.ErrBadRequest.WithInternal(err)
	}

	scepServer, err := db.Exec(m.App).GetScepServer(ctx, u.ForUser, req.ID)
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	if scepServer == nil {
		return echo.ErrNotFound
	}

	var parsed []*certificates.Certificate
	if len(scepServer.CaCertificates) != 0 {
		var caCerts []string
		err = scepServer.CaCertificates.Unmarshal(&caCerts)
		if err != nil {
			m.App.Logger().Error().Err(err).
				Str("id", scepServer.ID).Str("owner", scepServer.Owner).
				Msg("failed to unmarshal ca certificates")
			return echo.ErrInternalServerError.WithInternal(err)
		}

		parsed = make([]*certificates.Certificate, 0, len(caCerts))
		for _, v := range caCerts {
			pc, err := certificates.ParseCertificate([]byte(v))
			if err != nil {
				m.App.Logger().Error().Err(err).
					Str("id", scepServer.ID).Str("owner", scepServer.Owner).
					Msg("failed to parse ca certificate")
				return echo.ErrInternalServerError.WithInternal(err)
			}
			pc.Owner = scepServer.Owner
			pc.Type = models.CertType("scep_ca")
			c := certificates.FromModels(*pc)
			c.KeepBody(true)
			parsed = append(parsed, &c)
		}
	}

	type response struct {
		*models.ScepServer
		CaCertificates []*certificates.Certificate `json:"ca_certificates"`
	}

	res := response{
		ScepServer:     scepServer,
		CaCertificates: parsed,
	}
	res.ScepServer.CaCertificates = nil

	return c.JSON(http.StatusOK, map[string]any{
		"server": res,
	})
}

func (m *controller) DeleteScepServer(c echo.Context) error {
	u, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	req := new(struct {
		ID string `param:"id" validate:"required"`
	})
	if err := m.bindAndValidate(c, req); err != nil {
		return echo.ErrBadRequest.WithInternal(err)
	}

	if err := db.Exec(m.App).DeleteScepServer(ctx, u.ForUser, req.ID); err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	return c.NoContent(http.StatusNoContent)
}

func (m *controller) UpdateScepServer(c echo.Context) error {
	u, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	req := new(struct {
		ID             string    `param:"id" validate:"required"`
		Name           *string   `json:"name"`
		URL            *string   `json:"url"`
		CaCertificates *[]string `json:"ca_certificates"`
		Challenge      *string   `json:"challenge"`
		SigningCert    *string   `json:"signer"`
	})
	if err := m.bindAndValidate(c, req); err != nil {
		return echo.ErrBadRequest.WithInternal(err)
	}

	scepServer, err := db.Exec(m.App).GetScepServer(ctx, u.ForUser, req.ID)
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}
	if scepServer == nil {
		return echo.ErrNotFound
	}

	if req.Name != nil {
		scepServer.Name = null.StringFromPtr(req.Name)
	}
	if req.URL != nil {
		scepServer.URL = *req.URL
	}
	if req.CaCertificates != nil {
		var certs types.JSON
		if err = certs.Marshal(*req.CaCertificates); err != nil {
			return echo.ErrBadRequest.WithInternal(err)
		}
		scepServer.CaCertificates = certs
	}
	if req.Challenge != nil {
		scepServer.Challenge = null.StringFromPtr(req.Challenge)
	}
	if req.SigningCert != nil {
		_, err = db.Exec(m.App).GetCertificate(ctx, u.ForUser, *req.SigningCert)
		if err != nil {
			return echo.ErrBadRequest.WithInternal(err)
		}
		scepServer.Signer = null.StringFromPtr(req.SigningCert)
	}

	if _, err := db.Exec(m.App).UpdateScepServer(ctx, u.ForUser, req.ID, scepServer); err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	return c.JSON(http.StatusOK, map[string]any{
		"id": scepServer.ID,
	})
}

func (m *controller) TestScepConnection(c echo.Context) error {
	u, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	req := new(struct {
		Name string `json:"name" validate:"required"`
		URL  string `json:"url" validate:"required"`
	})
	if err := m.bindAndValidate(c, req); err != nil {
		return echo.ErrBadRequest.WithInternal(err)
	}

	m.App.Logger().Debug().Str("id", req.Name).Str("url", req.URL).Str("owner", u.ForUser).
		Ctx(ctx).Msg("Testing scep connection")

	cl, err := scep.NewClient(m.App, req.URL)
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	caps, err := cl.GetCACaps(ctx)
	if err != nil {
		m.App.Logger().Error().Err(err).
			Str("id", req.Name).Str("owner", u.ForUser).
			Msg("failed to get ca capabilities")
		return echo.ErrInternalServerError.WithInternal(err)
	}

	certs, err := cl.GetParsedCACert(ctx, "SPRT SCEP for "+req.Name)
	if err != nil {
		m.App.Logger().Error().Err(err).
			Str("id", req.Name).Str("owner", u.ForUser).
			Msg("failed to get ca certificates")
		return echo.ErrInternalServerError.WithInternal(err)
	}

	caCertificates := make([]*certificates.Certificate, 0, len(certs))
	for _, v := range certs {
		c, err := certificates.FromX509(v)
		if err != nil {
			m.App.Logger().Error().Err(err).
				Str("id", req.Name).Str("owner", u.ForUser).
				Msg("failed to parse ca certificate")
			return echo.ErrInternalServerError.WithInternal(err)
		}
		c.Owner = u.ForUser
		c.Type = models.CertType("scep_ca")
		c.KeepBody(true)
		caCertificates = append(caCertificates, &c)
	}

	return c.JSON(http.StatusOK, map[string]any{
		"ca_certificates": caCertificates,
		"capabilities":    string(caps),
	})
}

func (m *controller) TestScepEnroll(c echo.Context) error {
	u, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	req := new(struct {
		Name           string                    `json:"name" validate:"required"`
		URL            string                    `json:"url" validate:"required"`
		SigningCert    string                    `json:"signer" validate:"required"`
		CsrTemplate    CertTemplateUpsertRequest `json:"csr_template" validate:"required"`
		CaCertificates []string                  `json:"ca_certificates" validate:"required"`
		Challenge      string                    `json:"challenge"`
	})
	if err := m.bindAndValidate(c, req); err != nil {
		return echo.ErrBadRequest.WithInternal(err)
	}

	m.App.Logger().Debug().Str("id", req.Name).Str("url", req.URL).Str("owner", u.ForUser).
		Ctx(ctx).Msg("Testing scep enroll")

	signCertRaw, err := db.Exec(m.App).GetCertificate(ctx, u.ForUser, req.SigningCert)
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}
	if signCertRaw == nil {
		return echo.ErrNotFound.WithInternal(fmt.Errorf("signing certificate not found"))
	}
	signCert := certificates.FromModels(*signCertRaw)
	if err := signCert.Decode(); err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}
	signPriv, err := signCert.GetPrivateKey()
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	client, err := scep.NewClient(m.App, req.URL)
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	com, err := certificates.ZToCommon(signCert.Decoded)
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	m.App.Logger().Debug().Str("id", req.Name).Str("owner", u.ForUser).
		Ctx(ctx).Msg("Enrolling with scep")
	newCert, _, err := client.Enroll(ctx, req.CsrTemplate.Content,
		scep.WithSignerCertificate(com, signPriv), scep.WithChallenge(req.Challenge))
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	parsed, err := certificates.FromX509(newCert)
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}
	parsed.KeepBody(true)
	parsed.Owner = u.ForUser
	parsed.Type = models.CertTypeIdentity

	return c.JSON(http.StatusOK, map[string]any{
		"certificate": parsed,
	})
}
