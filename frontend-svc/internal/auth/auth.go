package auth

import (
	"context"
	"errors"
	"net/http"
	"slices"

	"github.com/labstack/echo/v4"
)

type AuthContext struct {
	echo.Context
	Data AuthData
}

func (c *AuthContext) SetAuthData(a AuthData) {
	c.Data = a
}

func (c *AuthContext) GetAuthData() AuthData {
	return c.Data
}

type (
	NormalizedAuthData struct {
		User string `json:"user"`
	}

	AuthType int8

	AuthData struct {
		AuthType   AuthType           `json:"auth_type"`
		Normalized NormalizedAuthData `json:"normalized"`
		Meta       map[string]any     `json:"meta"`
		RawData    any                `json:"auth_data,omitempty"`
	}
)

const (
	AuthTypeUnknown AuthType = iota
	AuthTypeUser
	AuthTypeToken
)

const AdminRole = "role::admin"

type UserData struct {
	AccessLevel int      `json:"AccessLevel"`
	Email       string   `json:"Email"`
	Name        string   `json:"Name"`
	FirstName   string   `json:"FirstName"`
	LastName    string   `json:"LastName"`
	UserID      string   `json:"UserID"`
	Roles       []string `json:"Roles"`
}

type ExtendedUserData struct {
	UserData
	ForUser string `json:"ForUser"`
}

func (u *UserData) IsAdmin() bool {
	return slices.Contains(u.Roles, AdminRole)
}

var (
	ErrAuthRequired      = echo.NewHTTPError(http.StatusForbidden, "Authentication required")
	ErrCiscoAuthRequired = echo.NewHTTPError(http.StatusForbidden, "Authentication required")
	ErrNoSession         = echo.NewHTTPError(http.StatusInternalServerError, "Couldn't find session")

	ErrUserDataNotFound  = errors.New("user data not found")
	ErrNotAuthThroughSSO = errors.New("user not authenticated")
)

func GetBasicUserData(c echo.Context) (*UserData, error) {
	cc, ok := c.(*AuthContext)

	if !ok {
		return &UserData{}, ErrUserDataNotFound
	}

	d, ok := cc.Data.RawData.(*UserData)
	if !ok {
		return &UserData{}, ErrUserDataNotFound
	}

	return d, nil
}

func GetUserDataAndContext(c echo.Context) (*ExtendedUserData, context.Context, error) {
	d, err := GetBasicUserData(c)
	if err != nil {
		return nil, c.Request().Context(), ErrNoSession.WithInternal(ErrUserDataNotFound)
	}

	// if cc.Data.AuthType != AuthTypeUser {
	// 	return &UserData{}, c.Request().Context(), ErrNoSession.WithInternal(ErrNotAuthThroughSSO)
	// }

	e := &ExtendedUserData{
		UserData: *d,
		ForUser:  getQueryUser(c),
	}
	return e, ContextWithUser(c, d.Email), nil
}

func MustUserDataAndContext(c echo.Context) (*ExtendedUserData, context.Context) {
	u, ctx, err := GetUserDataAndContext(c)
	if err != nil {
		panic(err)
	}
	return u, ctx
}
