package db

import (
	"context"
	"database/sql"
	"errors"

	"github.com/cisco-open/sprt/frontend-svc/models"
	"github.com/google/uuid"
	"github.com/volatiletech/null/v8"
	"github.com/volatiletech/sqlboiler/v4/boil"
)

type ScepManipulator interface {
	GetScepServers(ctx context.Context, owner string) (models.ScepServerSlice, error)
	GetScepServer(ctx context.Context, owner, id string) (*models.ScepServer, error)
	GetScepServersForSigner(ctx context.Context, owner, signerID string) (models.ScepServerSlice, error)
	DeleteScepServer(ctx context.Context, owner, id string) error
	DeleteMultipleScepServers(ctx context.Context, owner string, ids []string) error
	CreateScepServer(ctx context.Context, owner string, s *models.ScepServer) (string, error)
	UpdateScepServer(ctx context.Context, owner, id string, s *models.ScepServer) (int64, error)
}

var _ ScepManipulator = (*execute)(nil)

// GetScepServers returns SCEP servers
func (e *execute) GetScepServers(ctx context.Context, owner string) (models.ScepServerSlice, error) {
	q := mods{models.ScepServerWhere.Owner.EQ(owner)}.
		withOrder(e.order(&Sort{
			SortBy:        models.ScepServerColumns.ID,
			SortDirection: OrderByAsc,
		})).
		withPagination(e.pagination(nil))

	c, err := models.ScepServers(q...).All(ctx, e.db)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	return c, nil
}

// CreateScepServer creates SCEP server
func (e *execute) CreateScepServer(ctx context.Context, owner string, s *models.ScepServer) (string, error) {
	id, err := uuid.NewV7()
	if err != nil {
		return "", err
	}

	s.ID = id.String()
	s.Owner = owner

	err = s.Insert(ctx, e.db, boil.Infer())

	return s.ID, err
}

// GetScepServer returns SCEP server
func (e *execute) GetScepServer(ctx context.Context, owner, id string) (*models.ScepServer, error) {
	q := mods{
		models.ScepServerWhere.ID.EQ(id),
		models.ScepServerWhere.Owner.EQ(owner),
	}

	c, err := models.ScepServers(q...).One(ctx, e.db)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	return c, nil
}

// DeleteScepServer deletes SCEP server
func (e *execute) DeleteScepServer(ctx context.Context, owner, id string) error {
	q := mods{
		models.ScepServerWhere.ID.EQ(id),
		models.ScepServerWhere.Owner.EQ(owner),
	}

	_, err := models.ScepServers(q...).DeleteAll(ctx, e.db)
	return err
}

// DeleteMultipleScepServers deletes multiple SCEP servers
func (e *execute) DeleteMultipleScepServers(ctx context.Context, owner string, ids []string) error {
	q := mods{
		models.ScepServerWhere.ID.IN(ids),
		models.ScepServerWhere.Owner.EQ(owner),
	}

	_, err := models.ScepServers(q...).DeleteAll(ctx, e.db)
	return err
}

// UpdateScepServer updates SCEP server
func (e *execute) UpdateScepServer(ctx context.Context, owner, id string, s *models.ScepServer) (int64, error) {
	_, err := models.ScepServers(
		models.ScepServerWhere.ID.EQ(id), models.ScepServerWhere.Owner.EQ(owner),
	).One(ctx, e.db)
	if err != nil {
		return 0, err
	}

	return s.Update(ctx, e.db, boil.Infer())
}

// GetScepServersForSigner returns SCEP servers for signer
func (e *execute) GetScepServersForSigner(ctx context.Context, owner, signerID string) (models.ScepServerSlice, error) {
	q := mods{
		models.ScepServerWhere.Owner.EQ(owner),
		models.ScepServerWhere.Signer.EQ(null.StringFrom(signerID)),
	}

	c, err := models.ScepServers(q...).All(ctx, e.db)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	return c, nil
}
