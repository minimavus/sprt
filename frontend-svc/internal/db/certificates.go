package db

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/volatiletech/null/v8"
	"github.com/volatiletech/sqlboiler/v4/boil"
	"github.com/volatiletech/sqlboiler/v4/queries/qm"

	"github.com/cisco-open/sprt/frontend-svc/models"
)

type CertificatesManipulator interface {
	GetCertificatesOfType(ctx context.Context, t models.CertType, owner string) (models.CertificateSlice, error)
	GetCertificatesOfTypeTotal(ctx context.Context, t models.CertType, owner string) (int64, error)
	GetCertificate(ctx context.Context, owner, id string) (*models.Certificate, error)
	GetCertificates(ctx context.Context, owner string, ids ...string) ([]*models.Certificate, error)
	GetCertificateBySubject(ctx context.Context, subject, owner string) (*models.Certificate, error)
	RenameCertificate(ctx context.Context, owner, id, newName string) error
	DeleteCertificate(ctx context.Context, owner, id string) error
	DeleteMultipleCertificates(ctx context.Context, owner string, ids ...string) (int64, error)
	CertificateExists(ctx context.Context, cert *models.Certificate) (bool, error)
	StoreCertificates(ctx context.Context, certs models.CertificateSlice) (int64, error)

	GetTemplatesOfUser(ctx context.Context, owner string, withContent bool) (models.TemplateSlice, error)
	GetTemplateByID(ctx context.Context, owner, id string) (*models.Template, error)
	DeleteTemplate(ctx context.Context, owner, id string) error
	DeleteMultipleTemplates(ctx context.Context, owner string, ids ...string) (int64, error)
	UpsertTemplate(ctx context.Context, template *models.Template) error
}

var _ CertificatesManipulator = (*execute)(nil)

// GetCertificatesOfType returns certificates of a certain type
func (e *execute) GetCertificatesOfType(ctx context.Context, t models.CertType, owner string) (models.CertificateSlice, error) {
	q := mods{
		models.CertificateWhere.Type.EQ(t),
		models.CertificateWhere.Owner.EQ(owner),
	}

	c, err := models.Certificates(mods(q).fromExec(e, nil)...).All(ctx, e.db)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	return c, nil
}

// GetCertificatesOfTypeTotal returns the total number of certificates of a certain type
func (e *execute) GetCertificatesOfTypeTotal(ctx context.Context, t models.CertType, owner string) (int64, error) {
	q := mods{
		models.CertificateWhere.Type.EQ(t),
		models.CertificateWhere.Owner.EQ(owner),
	}

	return models.Certificates(q...).Count(ctx, e.db)
}

// GetCertificate returns a certificate by its ID
func (e *execute) GetCertificate(ctx context.Context, owner, id string) (*models.Certificate, error) {
	q := mods{
		models.CertificateWhere.ID.EQ(id),
		models.CertificateWhere.Owner.EQ(owner),
	}

	c, err := models.Certificates(mods(q).fromExec(e, nil)...).One(ctx, e.db)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	return c, nil
}

// GetCertificates returns certificates by their IDs
func (e *execute) GetCertificates(ctx context.Context, owner string, ids ...string) ([]*models.Certificate, error) {
	q := mods{
		models.CertificateWhere.ID.IN(ids),
		models.CertificateWhere.Owner.EQ(owner),
	}

	c, err := models.Certificates(mods(q).fromExec(e, nil)...).All(ctx, e.db)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	return c, nil
}

// GetCertificateBySubject returns a certificate by its subject
func (e *execute) GetCertificateBySubject(ctx context.Context, subject, owner string) (*models.Certificate, error) {
	q := mods{
		models.CertificateWhere.Subject.EQ(null.StringFrom(subject)),
		models.CertificateWhere.Owner.EQ(owner),
	}

	c, err := models.Certificates(mods(q).fromExec(e, nil)...).One(ctx, e.db)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	return c, nil
}

// RenameCertificate updates the friendly name of a certificate
func (e *execute) RenameCertificate(ctx context.Context, owner, id, newName string) error {
	_, err := models.Certificates(
		models.CertificateWhere.ID.EQ(id),
		models.CertificateWhere.Owner.EQ(owner),
	).UpdateAll(ctx, e.db, models.M{models.CertificateColumns.FriendlyName: newName})

	return err
}

// DeleteCertificate removes a certificate from the database
func (e *execute) DeleteCertificate(ctx context.Context, owner, id string) error {
	_, err := models.Certificates(
		models.CertificateWhere.ID.EQ(id),
		models.CertificateWhere.Owner.EQ(owner),
		qm.Limit(1),
	).DeleteAll(ctx, e.db)

	return err
}

// DeleteMultipleCertificates removes multiple certificates from the database by their ID, returns the number of deleted certificates
func (e *execute) DeleteMultipleCertificates(ctx context.Context, owner string, ids ...string) (int64, error) {
	deleted, err := models.Certificates(
		models.CertificateWhere.ID.IN(ids),
		models.CertificateWhere.Owner.EQ(owner),
	).DeleteAll(ctx, e.db)

	return deleted, err
}

// CertificateExists checks if a certificate exists in the database
func (e *execute) CertificateExists(ctx context.Context, cert *models.Certificate) (bool, error) {
	return models.Certificates(
		models.CertificateWhere.Type.EQ(cert.Type),
		models.CertificateWhere.Thumbprint.EQ(cert.Thumbprint),
		models.CertificateWhere.Serial.EQ(cert.Serial),
		models.CertificateWhere.Owner.EQ(cert.Owner),
	).Exists(ctx, e.db)
}

// StoreCertificates inserts certificates into the database
func (e *execute) StoreCertificates(ctx context.Context, certs models.CertificateSlice) (int64, error) {
	return certs.InsertAll(ctx, e.db, boil.Infer())
}

// GetTemplatesOfUser returns templates of a user, optionally with content
func (e *execute) GetTemplatesOfUser(ctx context.Context, owner string, withContent bool) (models.TemplateSlice, error) {
	columns := []string{
		models.TemplateColumns.ID,
		models.TemplateColumns.FriendlyName,
		models.TemplateColumns.Owner,
		models.TemplateColumns.Subject,
	}
	if withContent {
		columns = append(columns, models.TemplateColumns.Content)
	}

	q := mods{
		qm.Select(columns...),
		models.TemplateWhere.Owner.EQ(null.StringFrom(owner)),
	}

	templates, err := models.Templates(q.fromExec(e, nil)...).All(ctx, e.db)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	return templates, nil
}

// GetTemplateByID returns a template by its ID
func (e *execute) GetTemplateByID(ctx context.Context, owner, id string) (*models.Template, error) {
	q := mods{
		models.TemplateWhere.ID.EQ(id),
		models.TemplateWhere.Owner.EQ(null.StringFrom(owner)),
	}

	template, err := models.Templates(mods(q).fromExec(e, nil)...).One(ctx, e.db)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	return template, nil
}

// DeleteTemplate removes a template from the database
func (e *execute) DeleteTemplate(ctx context.Context, owner, id string) error {
	_, err := models.Templates(
		models.TemplateWhere.ID.EQ(id),
		models.TemplateWhere.Owner.EQ(null.StringFrom(owner)),
	).DeleteAll(ctx, e.db)

	return err
}

func (e *execute) DeleteMultipleTemplates(ctx context.Context, owner string, ids ...string) (int64, error) {
	deleted, err := models.Templates(
		models.TemplateWhere.ID.IN(ids),
		models.TemplateWhere.Owner.EQ(null.StringFrom(owner)),
	).DeleteAll(ctx, e.db)

	return deleted, err
}

// UpsertTemplate inserts or updates a template in the database
func (e *execute) UpsertTemplate(ctx context.Context, template *models.Template) error {
	if template == nil {
		return errors.New("template is nil")
	}

	if template.ID == "" {
		newId, err := uuid.NewV7()
		if err != nil {
			return fmt.Errorf("failed to generate new ID: %w", err)
		}
		template.ID = newId.String()

		return template.Insert(ctx, e.db, boil.Infer())
	}

	t, err := models.Templates(mods{
		models.TemplateWhere.ID.EQ(template.ID),
		models.TemplateWhere.Owner.EQ(template.Owner),
	}...).One(ctx, e.db)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return fmt.Errorf("template with ID %s not found", template.ID)
		}
		return err
	}

	t.Content = template.Content
	t.FriendlyName = template.FriendlyName
	t.Subject = template.Subject
	_, err = t.Update(ctx, e.db, boil.Infer())
	return err
}
