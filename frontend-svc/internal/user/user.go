package user

import (
	"context"
	"fmt"

	"github.com/cisco-open/sprt/frontend-svc/internal/auth"
	"github.com/cisco-open/sprt/frontend-svc/models"
	"github.com/cisco-open/sprt/frontend-svc/shared"
)

func GetUserAttributes(ctx context.Context, app shared.LogDB, u auth.UserData) (map[string]any, error) {
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
