package db

import (
	"context"

	"github.com/volatiletech/sqlboiler/v4/boil"

	"github.com/cisco-open/sprt/frontend-svc/models"
)

type UsersManipulator interface {
	CreateRecordForUser(ctx context.Context, u string) error
}

var _ UsersManipulator = (*execute)(nil)

func (e *execute) CreateRecordForUser(ctx context.Context, u string) error {
	newUser := &models.User{UID: u}
	return newUser.Insert(ctx, e.db, boil.Infer())
}
