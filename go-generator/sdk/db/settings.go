package db

import (
	"context"

	"github.com/aarondl/null/v8"
	"github.com/aarondl/sqlboiler/v4/queries/qm"

	"github.com/cisco-open/sprt/go-generator/sdk/db/models"
	"github.com/cisco-open/sprt/go-generator/sdk/json"
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

func (e *execute) setUserSettingsJSON(ctx context.Context, user, propertyName string, settings any) (int64, error) {
	_, err := models.FindUser(ctx, e.db, user, models.UserColumns.Attributes)
	if err != nil {
		return 0, err
	}

	var bts []byte

	switch settings := settings.(type) {
	case null.JSON:
		bts = settings.JSON
	case []byte:
		bts = settings
	default:
		bts, err = json.Marshal(settings)
		if err != nil {
			return 0, err
		}
	}

	r, err := models.NewQuery(
		qm.SQL(
			`UPDATE `+models.TableNames.Users+` SET "attributes"=jsonb_set("attributes", '{"`+propertyName+`"}', $1::jsonb, true) WHERE uid=$2`,
			string(bts),
			user,
		),
	).ExecContext(ctx, e.db)
	if err != nil {
		return 0, err
	}

	return r.RowsAffected()
}
