package db

import (
	"context"

	"github.com/volatiletech/null/v8"
	"github.com/volatiletech/sqlboiler/v4/queries/qm"

	"github.com/cisco-open/sprt/frontend-svc/models"
)

func (e *execute) getUserSettingsJSON(ctx context.Context, user, propertyName string) (null.JSON, error) {
	queryResult := new(struct {
		Settings null.JSON `boil:"settings"`
	})
	err := models.NewQuery(
		qm.Select(`"attributes"#>'{`+propertyName+`}' as settings`),
		qm.From(models.TableNames.Users),
		models.UserWhere.UID.EQ(user),
	).Bind(ctx, e.db, queryResult)
	if err != nil {
		return null.JSON{}, err
	}
	return queryResult.Settings, nil
}
