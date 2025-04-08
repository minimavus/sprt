package db

import (
	"context"

	"github.com/cisco-open/sprt/frontend-svc/models"
	"github.com/volatiletech/sqlboiler/v4/boil"
)

type AppConfigManipulator interface {
	GetAllAppConfig(ctx context.Context) (models.ConfigSlice, error)
	SetAppConfig(ctx context.Context, key string, val any) error
}

var _ AppConfigManipulator = (*execute)(nil)

func (e *execute) GetAllAppConfig(ctx context.Context) (models.ConfigSlice, error) {
	c, err := models.Configs().All(ctx, e.db)
	if err != nil {
		return nil, noErrorIfNoRows(err)
	}

	return c, nil
}

func (e *execute) SetAppConfig(ctx context.Context, key string, val any) error {
	var c models.Config
	c.Key = key
	err := c.Value.Marshal(val)
	if err != nil {
		return err
	}

	return c.Upsert(ctx, e.db, true, []string{models.ConfigColumns.Key}, boil.Whitelist(models.ConfigColumns.Value), boil.Infer())
}
