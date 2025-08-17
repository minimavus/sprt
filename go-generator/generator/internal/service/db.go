package service

import (
	"context"
	"database/sql"

	"github.com/spf13/viper"

	interfaces "github.com/cisco-open/sprt/go-generator/sdk/app"
	"github.com/cisco-open/sprt/go-generator/sdk/db"
	"github.com/cisco-open/sprt/go-generator/specs"
)

var _ interfaces.DBer = (*Service)(nil)

func (app *Service) mustInitDB() *Service {
	dbConnection, err := db.NewSQL(context.Background(), app.Specs.DB)
	if err != nil {
		panic(err)
	}

	app.db = dbConnection

	return app
}

func (app *Service) DB() *sql.DB {
	return app.db
}

func (app *Service) DBSpec() specs.DBSpecs {
	s := app.Specs.DB
	return s
}

func (app *Service) syncWithDb(ctx context.Context) error {
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

		app.n.Exec(v.Key, *val)
	}

	app.Specs.Lock()
	defer app.Specs.Unlock()
	viper.Unmarshal(&app.Specs)

	return nil
}
