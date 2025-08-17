package db

import (
	"context"
)

type UserDefaultsManipulator interface {
	GetUserDefaultSettings(ctx context.Context, user string) (UserDefaultSettings, error)
	SetUserDefaultSettings(ctx context.Context, user string, settings UserDefaultSettings) (int64, error)
}

type UserDefaultSettings any

var _ UserDefaultsManipulator = (*execute)(nil)

func (e *execute) GetUserDefaultSettings(ctx context.Context, user string) (UserDefaultSettings, error) {
	js, err := e.getUserSettingsJSON(ctx, user, "generate")
	if err != nil {
		return APISettings{}, err
	}

	settings := new(UserDefaultSettings)
	if err = js.Unmarshal(settings); err != nil {
		return nil, err
	}

	return *settings, nil
}

func (e *execute) SetUserDefaultSettings(ctx context.Context, user string, settings UserDefaultSettings) (int64, error) {
	return e.setUserSettingsJSON(ctx, user, "generate", settings)
}
