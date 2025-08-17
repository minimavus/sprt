package db

import (
	"context"

	"github.com/volatiletech/sqlboiler/v4/queries/qm"

	"github.com/cisco-open/sprt/go-generator/sdk/db/models"
	"github.com/cisco-open/sprt/go-generator/sdk/json"
)

type SmsGatewaySettingsManipulator interface {
	GetSmsGatewaySettings(ctx context.Context, u string) (SmsGatewaySettings, error)
	SetSmsGatewaySettings(ctx context.Context, u string, s any) (int64, error)
}

var _ SmsGatewaySettingsManipulator = (*execute)(nil)

type SmsGatewaySettings struct {
	Method          string `json:"method"`
	Password        string `json:"password"`
	Username        string `json:"username"`
	BasicAuth       int    `json:"basic_auth"`
	UrlPostfix      string `json:"url_postfix"`
	ContentType     string `json:"content_type"`
	BodyTemplate    string `json:"body_template"`
	MessageTemplate string `json:"message_template"`
}

func (e *execute) GetSmsGatewaySettings(ctx context.Context, u string) (SmsGatewaySettings, error) {
	js, err := e.getUserSettingsJSON(ctx, u, "sms")
	if err != nil {
		return SmsGatewaySettings{}, err
	}

	result := SmsGatewaySettings{}
	err = js.Unmarshal(&result)
	if err != nil {
		return SmsGatewaySettings{}, err
	}

	return result, nil
}

func (e *execute) SetSmsGatewaySettings(ctx context.Context, u string, s any) (int64, error) {
	if _, err := models.FindUser(ctx, e.db, u, models.UserColumns.Attributes); err != nil {
		return 0, err
	}

	bts, err := json.Marshal(s)
	if err != nil {
		return 0, err
	}

	r, err := models.NewQuery(
		qm.SQL(
			`UPDATE `+models.TableNames.Users+` SET "attributes"=jsonb_set("attributes", '{"sms"}', $1::jsonb, true) WHERE uid=$2`,
			string(bts),
			u,
		),
	).ExecContext(ctx, e.db)
	if err != nil {
		return 0, err
	}

	return r.RowsAffected()
}
