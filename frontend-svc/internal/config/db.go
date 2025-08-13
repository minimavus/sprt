package config

import (
	"context"
	"database/sql"

	"github.com/spf13/viper"

	"github.com/cisco-open/sprt/frontend-svc/internal/db"
	"github.com/cisco-open/sprt/frontend-svc/shared"
	"github.com/cisco-open/sprt/go-generator/specs"
)

var _ shared.DBer = (*AppConfig)(nil)

func (app *AppConfig) mustInitDB() *AppConfig {
	dbConnection, err := db.NewSQL(context.Background(), app.Specs.DB)
	if err != nil {
		panic(err)
	}

	app.db = dbConnection

	err = db.Migrate(context.Background(), app, app.Specs.DB)
	if err != nil {
		panic(err)
	}

	return app
}

func (app *AppConfig) DB() *sql.DB {
	return app.db
}

func (app *AppConfig) DBSpec() specs.DBSpecs {
	s := app.Specs.DB
	return s
}

func (app *AppConfig) syncWithDb(ctx context.Context) error {
	cfg, err := db.Exec(app).GetAllAppConfig(ctx)
	if err != nil {
		return err
	}
	if len(cfg) == 0 {
		return nil
	}

	for _, v := range cfg {
		if !v.Value.Valid {
			viper.Set(v.Key, nil)
			continue
		}

		val := new(any)
		if err = v.Value.Unmarshal(val); err != nil {
			return err
		}
		viper.Set(v.Key, *val)

		app.n.exec(v.Key, *val)
	}

	app.Specs.Lock()
	defer app.Specs.Unlock()
	viper.Unmarshal(&app.Specs)

	return nil
}
