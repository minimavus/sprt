package handlers

import (
	"net/http"

	"github.com/labstack/echo/v4"

	"github.com/cisco-open/sprt/frontend-svc/internal/auth"
	"github.com/cisco-open/sprt/frontend-svc/internal/db"
)

func (m *controller) GetSmsGatewayConfig(c echo.Context) error {
	u, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	sts, err := db.Exec(m.App).GetSmsGatewaySettings(ctx, u.ForUser)
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	return c.JSON(http.StatusOK, sts)
}

func (m *controller) UpdateSmsGatewayConfig(c echo.Context) error {
	u, ctx, err := auth.GetUserDataAndContext(c)
	if err != nil {
		return err
	}

	var sts db.SmsGatewaySettings
	if err = m.bindAndValidate(c, &sts); err != nil {
		return err
	}

	m.App.Logger().Debug().Interface("sts", sts).Str("requestor", u.UserID).Str("user", u.ForUser).
		Msg("Saving sms gateway settings")

	aff, err := db.Exec(m.App).SetSmsGatewaySettings(ctx, u.ForUser, sts)
	if err != nil {
		return echo.ErrInternalServerError.WithInternal(err)
	}

	return c.JSON(http.StatusOK, map[string]int64{"affected": aff})
}

func (m *controller) GetSmsGatewayConfigExamples(c echo.Context) error {
	examples := []map[string]any{
		{
			"title": "Like \"Inmobile\"",
			"value": map[string]any{
				"url":              "Api/V2/Get/SendMessages?apiKey=111&sendername=SPRT&recipients=$phone$&flash=false&text=$message$",
				"method":           "get",
				"message_template": "Your account details: Username: $username$ Password: $password$",
				"content_type":     "text/plain",
			},
		},
		{
			"title": "Like \"Global Default\"",
			"value": map[string]any{
				"url":              "http/sendmsg?user=USER&password=PASS&api_id=123456&to=$phone$&MO=0&from=654321&text=$message$",
				"method":           "get",
				"message_template": "Your account details: Username: $username$ Password: $password$",
				"content_type":     "text/plain",
			},
		},
		{
			"title": "Default POST",
			"value": map[string]any{
				"url":              "sms.php",
				"method":           "post",
				"message_template": "Your account details: Username: $username$ Password: $password$",
				"body_template": `{
	"phone": "$phone$",
	"message": "$message$"
}`,
				"content_type": "application/json",
			},
		},
		{
			"title": "Default GET",
			"value": map[string]any{
				"url":              "sms.php?phone=$phone$&message=$message$",
				"method":           "get",
				"message_template": "Your account details: Username: $username$ Password: $password$",
				"body_template":    "",
				"content_type":     "application/json",
			},
		},
	}
	return c.JSON(200, examples)
}
