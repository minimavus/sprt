package app

import (
	"database/sql"

	gonanoid "github.com/matoous/go-nanoid"
	"github.com/rs/zerolog"
)

type (
	Logger interface {
		Logger() *zerolog.Logger
	}

	DBer interface {
		DB() *sql.DB
	}

	IDer interface {
		ID() string
	}

	App interface {
		Logger
		DBer
		IDer
	}
)

const (
	IDLength = 16
)

func GetNewServiceID() string {
	return gonanoid.MustID(IDLength)
}
