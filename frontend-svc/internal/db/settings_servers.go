package db

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"slices"

	"github.com/cisco-open/sprt/frontend-svc/models"
	"github.com/cisco-open/sprt/go-generator/sdk/json"
	"github.com/mitchellh/mapstructure"
	"github.com/volatiletech/sqlboiler/v4/boil"
)

type ServersSettingsManipulator interface {
	GetServersSettingsOfUser(ctx context.Context, u string, order ...ServersOrderBy) ([]ServerWithAttributes, error)
	GetServerSettingsOfUser(ctx context.Context, user, id string) (ServerWithAttributes, error)
	DeleteServerSettingsOfUser(ctx context.Context, user, id string) (int64, error)
	UpdateServerSettingsOfUser(ctx context.Context, s models.Server) (int64, error)
	CreateServerSettingsOfUser(ctx context.Context, s models.Server) error
}

var _ ServersSettingsManipulator = (*execute)(nil)

type ServersOrderBy struct {
	Column string
	How    OrderByDirection
}

type ServerAttributes struct {
	DNS    string `mapstructure:"dns" json:"dns" validate:"omitempty,ip"`
	Tacacs struct {
		Ports  []int  `mapstructure:"ports" json:"ports" validate:"omitempty,dive,number,lte=65535,gt=0"`
		Shared string `mapstructure:"shared" json:"shared" validate:"omitempty"`
	} `mapstructure:"tac" json:"tac" validate:"omitempty"`
	IsRadius          bool   `mapstructure:"radius" json:"radius" validate:"omitempty"`
	Shared            string `mapstructure:"shared" json:"shared" validate:"omitempty"`
	IsTacacs          bool   `mapstructure:"tacacs" json:"tacacs" validate:"omitempty"`
	Resolved          string `mapstructure:"resolved" json:"resolved" validate:"omitempty"`
	V6Address         string `mapstructure:"v6_address" json:"v6_address" validate:"omitempty,ipv6"`
	DmErrCause        string `mapstructure:"dm_err_cause" json:"dm_err_cause" validate:"omitempty"`
	FriendlyName      string `mapstructure:"friendly_name" json:"friendly_name" validate:"omitempty"`
	CoaNakErrCause    string `mapstructure:"coa_nak_err_cause" json:"coa_nak_err_cause" validate:"omitempty"`
	NoSessionAction   string `mapstructure:"no_session_action" json:"no_session_action" validate:"omitempty,oneof=coa-ack coa-nak drop"`
	NoSessionDmAction string `mapstructure:"no_session_dm_action" json:"no_session_dm_action" validate:"omitempty,oneof=disconnect-ack disconnect-nak"`

	Other map[string]interface{} `mapstructure:",remain"`
}

type ServerWithAttributes struct {
	models.Server
	Attributes ServerAttributes `json:"-"`
}

func (e *execute) GetServersSettingsOfUser(ctx context.Context, u string, order ...ServersOrderBy) ([]ServerWithAttributes, error) {
	o := ServersOrderBy{
		Column: "friendly_name",
		How:    OrderByAsc,
	}

	if len(order) > 0 {
		o = order[0]
	}

	q := mods{models.ServerWhere.Owner.EQ(u)}
	if o.Column != "friendly_name" {
		e.s = &Sort{SortBy: o.Column, SortDirection: o.How}
	}

	fromDb, err := models.Servers(q.fromExec(e, nil)...).All(ctx, e.db)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("read servers settings: %w", err)
	}

	res, err := unmarshalServers(fromDb)
	if err != nil {
		return nil, fmt.Errorf("unmarshal servers settings: %w", err)
	}

	if o.Column == "friendly_name" {
		slices.SortFunc(res, func(a, b ServerWithAttributes) int {
			if a.Attributes.FriendlyName < b.Attributes.FriendlyName {
				return -1
			}
			if a.Attributes.FriendlyName > b.Attributes.FriendlyName {
				return 1
			}
			return 0
		})
		if o.How == OrderByDesc {
			slices.Reverse(res)
		}
	}

	return res, nil
}

func (e *execute) GetServerSettingsOfUser(ctx context.Context, user, id string) (ServerWithAttributes, error) {
	q := mods{models.ServerWhere.ID.EQ(id), models.ServerWhere.Owner.EQ(user)}
	s, err := models.Servers(q.fromExec(e, nil)...).One(ctx, e.db)
	if err != nil {
		return ServerWithAttributes{}, err
	}
	r, err := unmarshalServer(*s)
	if err != nil {
		return ServerWithAttributes{}, err
	}
	return r, nil
}

func (e *execute) DeleteServerSettingsOfUser(ctx context.Context, user, id string) (int64, error) {
	s, err := models.Servers(
		models.ServerWhere.ID.EQ(id), models.ServerWhere.Owner.EQ(user),
	).One(ctx, e.db)
	if err != nil {
		return 0, err
	}
	return s.Delete(ctx, e.db)
}

func (e *execute) UpdateServerSettingsOfUser(ctx context.Context, s models.Server) (int64, error) {
	_, err := models.Servers(
		models.ServerWhere.ID.EQ(s.ID), models.ServerWhere.Owner.EQ(s.Owner),
	).One(ctx, e.db)
	if err != nil {
		return 0, err
	}
	return s.Update(ctx, e.db, boil.Infer())
}

func (e *execute) CreateServerSettingsOfUser(ctx context.Context, s models.Server) error {
	return s.Insert(ctx, e.db, boil.Infer())
}

func unmarshalServer(in models.Server) (ServerWithAttributes, error) {
	var (
		s ServerAttributes
		j map[string]any
	)

	if !in.Attributes.Valid {
		return ServerWithAttributes{in, ServerAttributes{}}, nil
	}

	err := json.Unmarshal(in.Attributes.JSON, &j)
	if err != nil {
		return ServerWithAttributes{}, err
	}

	err = mapstructure.Decode(j, &s)
	if err != nil {
		return ServerWithAttributes{}, err
	}

	return ServerWithAttributes{in, s}, nil
}

func unmarshalServers(in models.ServerSlice) ([]ServerWithAttributes, error) {
	res := make([]ServerWithAttributes, 0, len(in))
	for _, v := range in {
		t, err := unmarshalServer(*v)
		if err != nil {
			return nil, err
		}
		res = append(res, t)
	}
	return res, nil
}
