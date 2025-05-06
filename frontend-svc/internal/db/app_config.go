package db

import (
	"context"

	"github.com/cisco-open/sprt/frontend-svc/models"
	"github.com/volatiletech/sqlboiler/v4/boil"
)

type AppConfigManipulator interface {
	GetAllAppConfig(ctx context.Context) (models.ConfigSlice, error)
	GetAppConfig(ctx context.Context, keys ...string) (map[string]any, error)
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

func (e *execute) GetAppConfig(ctx context.Context, keys ...string) (map[string]any, error) {
	qm := mods{
		models.ConfigWhere.Key.IN(keys),
	}

	c, err := models.Configs(qm.fromExec(e, nil)...).All(ctx, e.db)
	if err != nil {
		return nil, err
	}

	configs := make(map[string]any, len(c))
	for _, v := range c {
		if v.Value.Valid {
			var val any
			err = v.Value.Unmarshal(&val)
			if err != nil {
				return nil, err
			}
			configs[v.Key] = val
		} else {
			configs[v.Key] = nil
		}
	}

	return configs, nil
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
