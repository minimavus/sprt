package user

import (
	"context"
	"fmt"

	"github.com/cisco-open/sprt/frontend-svc/internal/auth"
	"github.com/cisco-open/sprt/go-generator/sdk/app"
	"github.com/cisco-open/sprt/go-generator/sdk/db/models"
)

func GetUserAttributes(ctx context.Context, app app.App, u auth.UserData) (map[string]any, error) {
	found, err := models.FindUser(ctx, app.DB(), u.UserID)
	if err != nil {
		return nil, fmt.Errorf("get user attributes: %w", err)
	}

	if !found.Attributes.Valid {
		return nil, nil
	}

	attrs := make(map[string]any)
	found.Attributes.Unmarshal(&attrs)

	return attrs, nil
}
