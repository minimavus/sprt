package db

import (
	"database/sql"
	"errors"

	"github.com/cisco-open/sprt/go-generator/sdk/db/models"
)

type OrderByDirection string

var (
	OrderByAsc  OrderByDirection = "ASC"
	OrderByDesc OrderByDirection = "DESC"
)

func (o OrderByDirection) String() string {
	return string(o)
}

func (o OrderByDirection) Valid() bool {
	switch o {
	case OrderByAsc, OrderByDesc:
		return true
	default:
		return false
	}
}

func sessionsTable(pr models.Protos) string {
	if pr == models.ProtosTacacs {
		return models.TableNames.TacacsSessions
	}
	return models.TableNames.Sessions
}

func (e *execute) getMaxParamsPerStatement() int {
	return e.maxParamsPerStatement
}

func noErrorIfNoRows(err error) error {
	if errors.Is(err, sql.ErrNoRows) {
		return nil
	}
	return err
}
