package handlers

import (
	"fmt"
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/volatiletech/null/v8"

	"github.com/cisco-open/sprt/frontend-svc/internal/auth"
	"github.com/cisco-open/sprt/frontend-svc/internal/certificates"
	apierrors "github.com/cisco-open/sprt/frontend-svc/internal/errors"
	"github.com/cisco-open/sprt/go-generator/sdk/db"
	"github.com/cisco-open/sprt/go-generator/sdk/db/models"
)

// @Summary Get certificates of a certain type
// @Description Returns certificates of a certain type
// @ID get-certificates-of-type
// @Tags certificates
// @Accept json
// @Produce json
// @Param page query int false "Page number"
// @Param per_page query int false "Number of items per page"
// @Success 200 {object} map[string]interface{} "certificates"
// @Failure 400 {object} map[string]interface{} "bad request"
// @Failure 500 {object} map[string]interface{} "internal error"
// @Router /certificates/identity [get]
// @Router /certificates/trusted [get]
// @Router /certificates/signer [get]
func (m *controller) GetCertificatesOfType(t models.CertType) echo.HandlerFunc {
	return func(c echo.Context) error {
		u, ctx, err := auth.GetUserDataAndContext(c)
		if err != nil {
			return err
		}

		total, err := db.Exec(m.App).GetCertificatesOfTypeTotal(ctx, t, u.ForUser)
		if err != nil {
			return echo.ErrInternalServerError.WithInternal(err)
		}

		if total == 0 && t == models.CertTypeSigner {
			err := certificates.AddDefaultSelfSignedSigningCertificate(ctx, m.App, u.ForUser)
			if err != nil {
				return echo.ErrInternalServerError.WithInternal(err)
			}
		}

		pagination := getPagination(c)
		sort := getSort(c, &db.Sort{SortBy: models.CertificateColumns.FriendlyName, SortDirection: db.OrderByAsc})

		certs, err := db.Exec(m.App).WithPagination(pagination.DBPagination()).WithSort(&sort).
			GetCertificatesOfType(ctx, t, u.ForUser)
		if err != nil {
			return echo.ErrInternalServerError.WithInternal(err)
		}

		if certs == nil {
			return c.JSON(http.StatusOK, map[string]any{
				"certificates": []string{},
				"_pagination":  pagination.MapWithTotal(total),
			})
		}

		return c.JSON(http.StatusOK, map[string]any{
			"certificates": certificates.FromModelsSlice(certs),
			"_pagination":  pagination.MapWithTotal(total),
		})
	}
}

// @Summary Get a certificate by its ID
// @Description Returns a certificate by its ID
// @ID get-certificate-by-id
// @Tags certificates
// @Accept json
// @Produce json
// @Param id path string true "ID of the certificate to get"
// @Param include_chain query bool false "Include the certificate chain"
// @Success 200 {object} certificates.Certificate "certificate"
// @Failure 400 {object} map[string]interface{} "bad request"
// @Failure 404 {object} map[string]interface{} "not found"
// @Failure 500 {object} map[string]interface{} "internal error"
// @Router /certificates/identity/{id} [get]
// @Router /certificates/trusted/{id} [get]
// @Router /certificates/signer/{id} [get]
func (m *controller) GetCertificateByID(c echo.Context) error {
	u, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	req := new(struct {
		ID           string `param:"id" validate:"required"`
		IncludeChain bool   `query:"include_chain" validate:"omitempty"`
	})
	if err := m.bindAndValidate(c, req); err != nil {
		return echo.ErrBadRequest.WithInternal(err)
	}

	certRaw, err := db.Exec(m.App).GetCertificate(ctx, u.ForUser, req.ID)
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}
	if certRaw == nil {
		return echo.ErrNotFound
	}

	cert := certificates.FromModels(*certRaw)

	if req.IncludeChain {
		err = cert.LoadChain(ctx, m.App)
		if err != nil {
			return echo.ErrInternalServerError.WithInternal(err)
		}
	}

	ca := &cert
	for ca != nil {
		_ = ca.Decode()
		ca = ca.Chain
	}

	return c.JSON(http.StatusOK, cert)
}

type ExportOptions struct {
	What         string `json:"what" validate:"required,oneof=cert cert-with-key"`
	Pass         string `json:"pass,omitempty" validate:"omitempty"`
	IncludeChain bool   `json:"include_chain,omitempty" validate:"omitempty"`
}

type FullCertID struct {
	ID   string `json:"id" validate:"required"`
	Type string `json:"type" validate:"required,oneof=identity trusted signer"`
}

// ExportCertificate exports a certificate by its ID in a tar file
// @Summary Export a certificate
// @Description Exports a certificate by its ID in a tar file
// @ID export-certificate
// @Tags certificates
// @Accept json
// @Produce json
// @Param ids body []FullCertID true "IDs of the certificates to export"
// @Param options body ExportOptions true "Export options"
// @Success 200 {object} application/x-tar "tar file"
// @Failure 400 {object} map[string]interface{} "bad request"
// @Failure 500 {object} map[string]interface{} "internal error"
// @Router /certificates/export [post]
func (m *controller) ExportCertificate(c echo.Context) error {
	u, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	req := new(struct {
		Options ExportOptions `json:"options"`
		IDs     []FullCertID  `json:"ids" validate:"required,dive"`
	})
	if err := m.bindAndValidate(c, req); err != nil {
		return echo.ErrBadRequest.WithInternal(err)
	}

	ids := make([]string, 0, len(req.IDs))
	for _, id := range req.IDs {
		ids = append(ids, id.ID)
	}

	certRaw, err := db.Exec(m.App).GetCertificates(ctx, u.ForUser, ids...)
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}
	if certRaw == nil {
		return echo.ErrNotFound
	}

	certs := certificates.FromModelsSlice(certRaw)
	if req.Options.IncludeChain {
		for _, c := range certs {
			m.App.Logger().Debug().Str("cert_id", c.ID).Msg("loading chain")
			err = c.LoadChain(ctx, m.App)
			if err != nil {
				return echo.ErrInternalServerError.WithInternal(err)
			}

			ca := c
			for ca != nil {
				_ = ca.Decode()
				ca = ca.Chain
			}
		}
	}

	m.App.Logger().Debug().Str("owner", u.ForUser).Str("requester", u.UserID).
		Msg("exporting certificates")

	packer := certificates.NewPacker(certs)
	tar, err := packer.PrepareTarFile(req.Options.What == "cert-with-key", req.Options.Pass)
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	c.Response().Header().Set(echo.HeaderContentDisposition, "attachment; filename=certificates.tar")
	return c.Stream(http.StatusOK, "application/x-tar", tar)
}

// @Summary Rename a certificate
// @Description Renames a certificate by its ID
// @ID rename-certificate
// @Tags certificates
// @Accept json
// @Produce json
// @Param id path string true "ID of the certificate to rename"
// @Param name body string true "New name for the certificate"
// @Success 200 {object} nil "renamed"
// @Failure 400 {object} map[string]interface{} "bad request"
// @Failure 500 {object} map[string]interface{} "internal error"
// @Router /certificates/identity/{id} [put]
// @Router /certificates/trusted/{id} [put]
// @Router /certificates/signer/{id} [put]
func (m *controller) RenameCertificate(c echo.Context) error {
	u, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	req := new(struct {
		ID   string `param:"id" validate:"required"`
		Name string `json:"name" validate:"required"`
	})
	if err := m.bindAndValidate(c, req); err != nil {
		return echo.ErrBadRequest.WithInternal(err)
	}

	m.App.Logger().Debug().Str("id", req.ID).Str("name", req.Name).
		Str("owner", u.ForUser).Str("requester", u.UserID).Msg("renaming certificate")

	err = db.Exec(m.App).RenameCertificate(ctx, u.ForUser, req.ID, req.Name)
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	return c.NoContent(http.StatusOK)
}

// @Summary Delete a certificate
// @Description Deletes a certificate by its ID
// @ID delete-certificate
// @Tags certificates
// @Accept json
// @Produce json
// @Param id path string true "ID of the certificate to delete"
// @Success 200 {object} nil "deleted"
// @Failure 400 {object} map[string]interface{} "bad request"
// @Failure 500 {object} map[string]interface{} "internal error"
// @Router /certificates/identity/{id} [delete]
// @Router /certificates/trusted/{id} [delete]
// @Router /certificates/signer/{id} [delete]
func (m *controller) DeleteCertificate(c echo.Context) error {
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

	cert, err := db.Exec(m.App).GetCertificate(ctx, u.ForUser, req.ID)
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}
	if cert == nil {
		return echo.ErrNotFound
	}

	if cert.Type == models.CertTypeSigner {
		servers, err := db.Exec(m.App).GetScepServersForSigner(ctx, u.ForUser, req.ID)
		if err != nil {
			return echo.ErrInternalServerError.WithInternal(err)
		}
		if len(servers) > 0 {
			return apierrors.NewHTTPError(http.StatusBadRequest).SetInternal(fmt.Errorf("certificate is used in SCEP servers"))
		}
	}

	m.App.Logger().Debug().Str("id", req.ID).Str("owner", u.ForUser).
		Str("requester", u.UserID).Msg("deleting certificate")

	err = db.Exec(m.App).DeleteCertificate(ctx, u.ForUser, req.ID)
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	return c.NoContent(http.StatusOK)
}

// @Summary Delete multiple certificates
// @Description Deletes multiple certificates by their IDs
// @ID delete-multiple-certificates
// @Tags certificates
// @Accept json
// @Produce json
// @Param ids body []string true "IDs of the certificates to delete"
// @Success 200 {object} map[string]interface{} "deleted"
// @Failure 400 {object} map[string]interface{} "bad request"
// @Failure 500 {object} map[string]interface{} "internal error"
// @Router /certificates/identity [delete]
// @Router /certificates/trusted [delete]
func (m *controller) DeleteMultipleCertificates(c echo.Context) error {
	u, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	req := new(struct {
		IDs []string `json:"ids" validate:"required,dive,required"`
	})
	if err := m.bindAndValidate(c, req); err != nil {
		return echo.ErrBadRequest.WithInternal(err)
	}

	m.App.Logger().Debug().Strs("ids", req.IDs).Str("owner", u.ForUser).
		Str("requester", u.UserID).Msg("deleting multiple certificates")

	deleted, err := db.Exec(m.App).DeleteMultipleCertificates(ctx, u.ForUser, req.IDs...)
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	return c.JSON(http.StatusOK, map[string]any{"deleted": deleted})
}

// @Summary Import trusted certificates
// @Description Imports trusted certificates
// @ID import-trusted-certificates
// @Tags certificates
// @Accept json multipart/form-data
// @Produce json
// @Param pem body string true "PEM-encoded certificates"
// @Param file formData file true "File with certificates"
// @Param options body certificates.ImportOptions true "Import options"
// @Success 200 {object} map[string]interface{} "imported"
// @Failure 400 {object} map[string]interface{} "bad request"
// @Failure 500 {object} map[string]interface{} "internal error"
// @Router /certificates/trusted [post]
func (m *controller) ImportTrustedCertificates(c echo.Context) error {
	u, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	var cts []*models.Certificate

	m.App.Logger().Debug().Str("content_type", c.Request().Header.Get(echo.HeaderContentType)).
		Msg("importing trusted certificates")
	if isMultipartFormData(c) {
		cts, err = m.searchCertificatesInFile(c, u, models.CertTypeTrusted)
	} else {
		cts, err = m.searchCertificatesInPEM(c, u, models.CertTypeTrusted)
	}
	if err != nil {
		return err
	}

	var importOptions certificates.ImportOptions
	if err = importOptions.BindFromEcho(c); err != nil {
		m.App.Logger().Debug().Err(err).Msg("failed to bind import options")
		return echo.ErrBadRequest.WithInternal(err)
	}

	m.App.Logger().Debug().Interface("import_options", importOptions).Msg("validating certificates")

	validated, invalid, err := certificates.Importer(cts).ValidateWithOptions(ctx, m.App, importOptions)
	if err != nil {
		return echo.ErrBadRequest.WithInternal(err)
	}

	if len(validated) == 0 {
		internal := fmt.Errorf("no valid certificates found")
		if len(invalid) > 0 {
			return apierrors.NewHTTPError(http.StatusBadRequest).SetInternal(internal).
				SetCustomMember("invalid", certificates.FromInvalidCertificateSlice(invalid))
		}
		return echo.ErrBadRequest.WithInternal(internal)
	}

	imported, err := validated.StoreCertificates(ctx, m.App, importOptions.IsAsFile())
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}
	ids := make([]string, 0, len(validated))
	for _, c := range validated {
		ids = append(ids, c.ID)
	}

	response := map[string]any{"imported": imported, "ids": ids}
	if len(invalid) > 0 {
		response["invalid"] = certificates.FromInvalidCertificateSlice(invalid)
	}

	return c.JSON(http.StatusOK, response)
}

func (m *controller) searchCertificatesInPEM(c echo.Context, u *auth.ExtendedUserData, t models.CertType) ([]*models.Certificate, error) {
	req := new(struct {
		PEM string `json:"pem" validate:"required"`
	})
	if err := m.bindAndValidate(c, req); err != nil {
		return nil, echo.ErrBadRequest.WithInternal(err)
	}

	m.App.Logger().Debug().Str("owner", u.ForUser).Str("requester", u.UserID).
		Msg("importing trusted certificates from PEM")

	cts, err := certificates.SearchCertificatesInPEM(req.PEM, u.ForUser, t)
	if err != nil {
		return nil, echo.ErrBadRequest.WithInternal(err)
	}

	return cts, nil
}

func (m *controller) searchCertificatesInFile(c echo.Context, u *auth.ExtendedUserData, t models.CertType) ([]*models.Certificate, error) {
	file, err := c.FormFile("file")
	if err != nil {
		return nil, echo.ErrBadRequest.WithInternal(err)
	}

	m.App.Logger().Debug().Str("owner", u.ForUser).Str("requester", u.UserID).Str("file", file.Filename).
		Msg("importing trusted certificates from file")

	cts, err := certificates.SearchCertificatesInFile(file, u.ForUser, t)
	if err != nil {
		return nil, echo.ErrBadRequest.WithInternal(err)
	}

	return cts, nil
}

// @Summary Import identity certificate
// @Description Imports an identity certificate
// @ID import-identity-certificate
// @Tags certificates
// @Accept json multipart/form-data
// @Produce json
// @Param pem body string true "PEM-encoded certificate"
// @Param key body string true "PEM-encoded private key"
// @Param password body string false "Password for the private key"
// @Success 200 {object} map[string]interface{} "imported"
// @Failure 400 {object} map[string]interface{} "bad request"
// @Failure 500 {object} map[string]interface{} "internal error"
// @Router /certificates/identity [post]
func (m *controller) ImportIdentityCertificate(c echo.Context) error {
	u, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	req := new(struct {
		FriendlyName string `json:"friendly_name" form:"friendly_name" validate:"omitempty"`
		PEM          string `json:"pem" form:"pem" validate:"required"`
		Key          string `json:"key" form:"key" validate:"required"`
		Password     string `json:"password" form:"password" validate:"omitempty"`
	})
	if err := m.bindAndValidate(c, req); err != nil {
		return echo.ErrBadRequest.WithInternal(err)
	}

	m.App.Logger().Debug().Str("owner", u.ForUser).Str("requester", u.UserID).
		Msg("importing identity certificate")

	var importOptions certificates.ImportOptions
	if err = importOptions.BindFromEcho(c); err != nil {
		return echo.ErrBadRequest.WithInternal(err)
	}

	cts, err := certificates.SearchCertificatesInPEM(req.PEM, u.ForUser, models.CertTypeIdentity,
		certificates.WithPrivateKey([]byte(req.Key)), certificates.WithPrivateKeyPassword(req.Password))
	if err != nil {
		return echo.ErrBadRequest.WithInternal(err)
	}
	validated, invalid, err := certificates.Importer(cts).ValidateWithOptions(ctx, m.App, importOptions)
	if err != nil {
		return echo.ErrBadRequest.WithInternal(err)
	}
	if len(validated) != 1 {
		internal := fmt.Errorf("expected 1 certificate, got %d", len(validated))
		if len(invalid) > 0 {
			return apierrors.NewHTTPError(http.StatusBadRequest).SetInternal(internal).
				SetCustomMember("invalid", certificates.FromInvalidCertificateSlice(invalid))
		}
		return echo.ErrBadRequest.WithInternal(internal)
	}

	if req.FriendlyName != "" {
		validated[0].FriendlyName = null.StringFrom(req.FriendlyName)
	}

	imported, err := validated.StoreCertificates(ctx, m.App, importOptions.IsAsFile())
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}
	id := validated[0].ID

	return c.JSON(http.StatusOK, map[string]any{"imported": imported, "id": id})
}

// @Summary Get certificate templates
// @Description Returns certificate templates
// @ID get-cert-templates
// @Tags certificates, templates
// @Accept json
// @Produce json
// @Param page query int false "Page number"
// @Param per_page query int false "Number of items per page"
// @Success 200 {object} map[string]interface{} "templates"
// @Failure 400 {object} map[string]interface{} "bad request"
// @Failure 500 {object} map[string]interface{} "internal error"
// @Router /certificates/templates [get]
func (m *controller) GetCertTemplates(c echo.Context) error {
	u, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	pagination := getPagination(c)
	sort := getSort(c, &db.Sort{SortBy: models.TemplateColumns.FriendlyName, SortDirection: db.OrderByAsc})
	templates, err := db.Exec(m.App).WithPagination(pagination.DBPagination()).WithSort(&sort).
		GetTemplatesOfUser(ctx, u.ForUser, false)
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	if templates == nil {
		templates = []*models.Template{}
	}

	return c.JSON(http.StatusOK, map[string]any{
		"templates":   templates,
		"_pagination": pagination.MapWithTotal(int64(len(templates))),
	})
}

// @Summary Get a certificate template by its ID
// @Description Returns a certificate template by its ID
// @ID get-cert-template-by-id
// @Tags certificates, templates
// @Accept json
// @Produce json
// @Param id path string true "ID of the certificate template to get"
// @Success 200 {object} models.Template "template"
// @Failure 400 {object} map[string]interface{} "bad request"
// @Failure 404 {object} map[string]interface{} "not found"
// @Failure 500 {object} map[string]interface{} "internal error"
// @Router /certificates/templates/{id} [get]
func (m *controller) GetCertTemplateByID(c echo.Context) error {
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

	template, err := db.Exec(m.App).GetTemplateByID(ctx, u.ForUser, req.ID)
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}
	if template == nil {
		return echo.ErrNotFound
	}

	return c.JSON(http.StatusOK, template)
}

// @Summary Delete a certificate template
// @Description Deletes a certificate template by its ID
// @ID delete-cert-template
// @Tags certificates
// @Accept json
// @Produce json
// @Param id path string true "ID of the certificate template to delete"
// @Success 200 {object} nil "deleted"
// @Failure 400 {object} map[string]interface{} "bad request"
// @Failure 500 {object} map[string]interface{} "internal error"
// @Router /certificates/templates/{id} [delete]
func (m *controller) DeleteCertTemplate(c echo.Context) error {
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

	err = db.Exec(m.App).DeleteTemplate(ctx, u.ForUser, req.ID)
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	return c.NoContent(http.StatusOK)
}

func (m *controller) DeleteMultipleCertTemplates(c echo.Context) error {
	u, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	req := new(struct {
		IDs []string `json:"ids" validate:"required,dive,required"`
	})
	if err := m.bindAndValidate(c, req); err != nil {
		return echo.ErrBadRequest.WithInternal(err)
	}

	deleted, err := db.Exec(m.App).DeleteMultipleTemplates(ctx, u.ForUser, req.IDs...)
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	return c.JSON(http.StatusOK, map[string]any{"deleted": deleted})
}

type CertTemplateUpsertRequest struct {
	FriendlyName string                           `json:"friendly_name" validate:"required"`
	Content      certificates.CertTemplateContent `json:"content" validate:"required"`
}

// @Summary Add a certificate template
// @Description Adds a certificate template
// @ID add-cert-template
// @Tags certificates
// @Accept json
// @Produce json
// @Param request body CertTemplateUpsertRequest true "Request"
// @Success 200 {object} map[string]interface{} "added"
// @Failure 400 {object} map[string]interface{} "bad request"
// @Failure 500 {object} map[string]interface{} "internal error"
// @Router /certificates/templates [post]
func (m *controller) AddCertTemplate(c echo.Context) error {
	u, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	req := new(CertTemplateUpsertRequest)
	if err := m.bindAndValidate(c, req); err != nil {
		return echo.ErrBadRequest.WithInternal(err)
	}

	template := &models.Template{
		Owner:        null.StringFrom(u.ForUser),
		FriendlyName: null.StringFrom(req.FriendlyName),
	}
	if err = req.Content.PopulateModel(template); err != nil {
		return echo.ErrBadRequest.WithInternal(err)
	}

	if err = db.Exec(m.App).UpsertTemplate(ctx, template); err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	return c.JSON(http.StatusOK, map[string]any{"id": template.ID})
}

// @Summary Update a certificate template
// @Description Updates a certificate template
// @ID update-cert-template
// @Tags certificates
// @Accept json
// @Produce json
// @Param id path string true "ID of the certificate template to update"
// @Param request body CertTemplateUpsertRequest true "Request"
// @Success 200 {object} map[string]interface{} "updated"
// @Failure 400 {object} map[string]interface{} "bad request"
// @Failure 500 {object} map[string]interface{} "internal error"
// @Router /certificates/templates/{id} [put]
func (m *controller) UpdateCertTemplate(c echo.Context) error {
	u, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	req := new(struct {
		ID string `param:"id" validate:"required"`
		CertTemplateUpsertRequest
	})
	if err := m.bindAndValidate(c, req); err != nil {
		return echo.ErrBadRequest.WithInternal(err)
	}

	m.App.Logger().Debug().Str("id", req.ID).Str("owner", u.ForUser).Str("requester", u.UserID).
		Interface("content", req.Content).Msg("updating certificate template")

	template := &models.Template{
		ID:           req.ID,
		Owner:        null.StringFrom(u.ForUser),
		FriendlyName: null.StringFrom(req.FriendlyName),
	}
	if err = req.Content.PopulateModel(template); err != nil {
		return echo.ErrBadRequest.WithInternal(err)
	}

	if err = db.Exec(m.App).UpsertTemplate(ctx, template); err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	return c.JSON(http.StatusOK, map[string]any{"id": template.ID})
}
