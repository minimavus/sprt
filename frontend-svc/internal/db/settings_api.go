package db

import (
	"context"

	"github.com/cisco-open/sprt/frontend-svc/models"
	"github.com/volatiletech/sqlboiler/v4/queries/qm"
)

type APISettingsManipulator interface {
	GetAPISettingsOfUser(ctx context.Context, u string) (APISettings, error)
	SetAPISettingsOfUser(ctx context.Context, u string, s any) (int64, error)
	GetUserByAPIToken(ctx context.Context, token string) (string, error)
}

var _ APISettingsManipulator = (*execute)(nil)

type APISettings struct {
	Token string `json:"token"`
}

func (e *execute) GetAPISettingsOfUser(ctx context.Context, u string) (APISettings, error) {
	js, err := e.getUserSettingsJSON(ctx, u, "api")
	if err != nil {
		return APISettings{}, err
	}

	result := APISettings{}
	err = js.Unmarshal(&result)
	if err != nil {
		return APISettings{}, err
	}

	return result, nil
}

func (e *execute) GetUserByAPIToken(ctx context.Context, token string) (string, error) {
	u, err := models.Users(
		qm.Select(models.UserColumns.UID),
		qm.Where(`"`+models.UserColumns.Attributes+`"#>>'{api,token}' = $1`, token),
	).One(ctx, e.db)
	if err != nil {
		return "", noErrorIfNoRows(err)
	}

	return u.UID, nil
}

func (e *execute) SetAPISettingsOfUser(ctx context.Context, u string, s any) (int64, error) {
	return e.setUserSettingsJSON(ctx, u, "api", s)
}
