package db

import (
	"context"
	"database/sql"
	"errors"

	"github.com/lib/pq"
	"github.com/volatiletech/null/v8"
	"github.com/volatiletech/sqlboiler/v4/queries"
	"github.com/volatiletech/sqlboiler/v4/queries/qm"

	"github.com/cisco-open/sprt/go-generator/sdk/db/models"
)

type (
	GetSessionsOptions struct {
		Bulk string
		IDs  []int64
	}

	SessionSummary struct {
		Server null.String `json:"server" boil:"server"`
		ID     int64       `json:"id" boil:"id"`
		Bulk   null.String `json:"bulk" boil:"bulk"`
		Owner  string      `json:"owner" boil:"owner"`
	}

	SessionWithFlow struct {
		models.Session `boil:",bind"`
		Flow           []*models.Flow `json:"-"`
	}

	TacacsSessionWithFlow struct {
		models.TacacsSession `boil:",bind"`
		Flow                 []*models.Flow `json:"-"`
	}
)

type SessionsManipulator interface {
	GetSessionsPerServerBulked(ctx context.Context, owners []string) (ServersWithSessionsPerProto, error)
	GetSessionsPerServerBulkedPerProto(ctx context.Context, owners []string, proto models.Protos) ([]*ServerWithSessions, error)
	GetServerBulks(ctx context.Context, server string, owners []string, proto models.Protos) ([]*SessionsInBulk, error)

	GetRadiusSessions(ctx context.Context, server string, owners []string, opts GetSessionsOptions) ([]*models.Session, error)
	GetRadiusSessionDetails(ctx context.Context, server string, owners []string, id int64) (*SessionWithFlow, error)
	GetTotalRadiusSessionsInBulk(ctx context.Context, server string, owners []string, bulk string) (int64, error)

	GetTacacsSessions(ctx context.Context, server string, owners []string, opts GetSessionsOptions) ([]*models.TacacsSession, error)
	GetTacacsSessionDetails(ctx context.Context, server string, owners []string, id int64) (*TacacsSessionWithFlow, error)
	GetTotalTacacsSessionsInBulk(ctx context.Context, server string, owners []string, bulk string) (int64, error)

	GetSessionSummary(ctx context.Context, id int64, owners []string, proto models.Protos) (*SessionSummary, error)
}

var _ SessionsManipulator = (*execute)(nil)

type ServerWithSessions struct {
	Server        string            `json:"server" boil:"server"`
	SessionsCount int               `json:"sessionscount" boil:"sessionscount"`
	FriendlyName  null.String       `json:"friendly_name" boil:"friendly_name"`
	Bulks         []*SessionsInBulk `json:"bulks" boil:"-"`
}

type ServersWithSessionsPerProto map[models.Protos][]*ServerWithSessions

// GetSessionsPerServerBulked returns sessions per server
func (e *execute) GetSessionsPerServerBulked(ctx context.Context, owners []string) (ServersWithSessionsPerProto, error) {
	type result struct {
		proto   models.Protos
		servers []*ServerWithSessions
	}

	p := newResultPool[result](ctx)

	p.Go(func(ctx context.Context) (result, error) {
		r, err := e.GetSessionsPerServerBulkedPerProto(ctx, owners, models.ProtosRadius)
		if err != nil {
			return result{}, err
		}
		return result{models.ProtosRadius, r}, nil
	})

	p.Go(func(ctx context.Context) (result, error) {
		r, err := e.GetSessionsPerServerBulkedPerProto(ctx, owners, models.ProtosTacacs)
		if err != nil {
			return result{}, err
		}
		return result{models.ProtosTacacs, r}, nil
	})

	results, err := p.Wait()
	if err != nil {
		return nil, err
	}

	d := make(ServersWithSessionsPerProto, 2)
	for _, r := range results {
		d[r.proto] = r.servers
	}

	return d, nil
}

func (e *execute) GetSessionsPerServerBulkedPerProto(ctx context.Context, owners []string, proto models.Protos) ([]*ServerWithSessions, error) {
	var (
		result       []*ServerWithSessions
		sessionTable string
	)

	if proto == models.ProtosRadius {
		sessionTable = models.TableNames.Sessions
	} else if proto == models.ProtosTacacs {
		sessionTable = models.TableNames.TacacsSessions
	}

	err := queries.Raw(`
	SELECT "t"."server" as "server", "t"."sessionscount" as "sessionscount", "m"."attributes"->>'friendly_name' as "friendly_name"
	FROM (
		SELECT rs."server", COUNT(rs."id") as sessionscount, rs."owner" 
		FROM `+pq.QuoteIdentifier(sessionTable)+` AS rs WHERE rs."owner" = ANY($1)
		GROUP BY rs."server", rs."owner"
	) AS t 
	LEFT JOIN `+pq.QuoteIdentifier(models.TableNames.Servers)+` m
		ON "t"."server"::text = "m"."attributes"->>'resolved' AND "t"."owner" = "m"."owner"`, pq.Array(owners),
	).Bind(ctx, e.db, &result)
	if err != nil {
		return nil, err
	}

	for _, r := range result {
		bulks, err := e.GetServerBulks(ctx, r.Server, owners, proto)
		if err != nil {
			return nil, err
		}
		r.Bulks = bulks
	}

	return result, nil
}

type SessionsInBulk struct {
	Sessions null.Int    `json:"sessions" boil:"count"`
	Name     null.String `json:"name" boil:"name"`
}

func (e *execute) GetServerBulks(ctx context.Context, server string, owners []string, proto models.Protos) ([]*SessionsInBulk, error) {
	var (
		result []*SessionsInBulk
	)

	q := mods{
		qm.Select(`COUNT(DISTINCT "id") AS "count", bulk AS "name"`),
	}

	if proto == models.ProtosRadius {
		q = append(q,
			qm.From(models.TableNames.Sessions),
			models.SessionWhere.Server.EQ(server),
			models.SessionWhere.Owner.IN(owners),
		)
	} else if proto == models.ProtosTacacs {
		q = append(q,
			qm.From(models.TableNames.TacacsSessions),
			models.TacacsSessionWhere.Server.EQ(null.StringFrom(server)),
			models.TacacsSessionWhere.Owner.IN(owners),
		)
	}

	q = append(q, qm.GroupBy("bulk"))

	err := models.NewQuery(q...).Bind(ctx, e.db, &result)
	if err != nil {
		return nil, noErrorIfNoRows(err)
	}

	return result, nil
}

func (e *execute) GetRadiusSessions(ctx context.Context, server string, owners []string, opts GetSessionsOptions) ([]*models.Session, error) {
	qm := mods{
		models.SessionWhere.Server.EQ(server),
		models.SessionWhere.Owner.IN(owners),
	}

	if opts.Bulk != "" {
		qm = append(qm, models.SessionWhere.Bulk.EQ(opts.Bulk))
	}
	if len(opts.IDs) > 0 {
		qm = append(qm, models.SessionWhere.ID.IN(opts.IDs))
	}

	filterableColumns := []string{
		models.SessionColumns.Mac,
		models.SessionColumns.User,
		models.SessionColumns.Sessid,
		models.SessionColumns.IpAddr,
	}

	result, err := models.Sessions(qm.fromExec(e, filterableColumns)...).All(ctx, e.db)
	if err != nil {
		return nil, noErrorIfNoRows(err)
	}

	return result, nil
}

func (e *execute) GetRadiusSessionDetails(ctx context.Context, server string, owners []string, id int64) (*SessionWithFlow, error) {
	var swf SessionWithFlow

	err := models.Sessions(
		models.SessionWhere.ID.EQ(id),
		models.SessionWhere.Owner.IN(owners),
		models.SessionWhere.Server.EQ(server),
	).Bind(ctx, e.db, &swf)
	if err != nil {
		return nil, noErrorIfNoRows(err)
	}

	q := mods{
		models.FlowWhere.SessionID.EQ(int(id)),
		models.FlowWhere.Proto.EQ(models.ProtosRadius),
	}.withOrder(&Sort{SortBy: models.FlowColumns.Order, SortDirection: OrderByAsc})

	err = models.Flows(q...).Bind(ctx, e.db, &swf.Flow)
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		return nil, err
	}

	return &swf, nil
}

func (e *execute) GetTotalRadiusSessionsInBulk(ctx context.Context, server string, owners []string, bulk string) (int64, error) {
	count, err := models.Sessions(
		models.SessionWhere.Server.EQ(server),
		models.SessionWhere.Owner.IN(owners),
		models.SessionWhere.Bulk.EQ(bulk),
	).Count(ctx, e.db)
	if err != nil {
		return 0, noErrorIfNoRows(err)
	}

	return count, nil
}

func (e *execute) GetTacacsSessions(ctx context.Context, server string, owners []string, opts GetSessionsOptions) ([]*models.TacacsSession, error) {
	qm := mods{
		models.TacacsSessionWhere.Server.EQ(null.StringFrom(server)),
		models.TacacsSessionWhere.Owner.IN(owners),
	}
	if opts.Bulk != "" {
		qm = append(qm, models.TacacsSessionWhere.Bulk.EQ(null.StringFrom(opts.Bulk)))
	}
	if len(opts.IDs) > 0 {
		qm = append(qm, models.TacacsSessionWhere.ID.IN(opts.IDs))
	}

	filterableColumns := []string{
		models.TacacsSessionColumns.Bulk,
		models.TacacsSessionColumns.IPAddr,
		models.TacacsSessionColumns.User,
	}

	result, err := models.TacacsSessions(qm.fromExec(e, filterableColumns)...).All(ctx, e.db)
	if err != nil {
		return nil, noErrorIfNoRows(err)
	}

	return result, nil
}

func (e *execute) GetTotalTacacsSessionsInBulk(ctx context.Context, server string, owners []string, bulk string) (int64, error) {
	count, err := models.TacacsSessions(
		models.TacacsSessionWhere.Server.EQ(null.StringFrom(server)),
		models.TacacsSessionWhere.Owner.IN(owners),
		models.TacacsSessionWhere.Bulk.EQ(null.StringFrom(bulk)),
	).Count(ctx, e.db)
	if err != nil {
		return 0, noErrorIfNoRows(err)
	}

	return count, nil
}

func (e *execute) GetSessionSummary(ctx context.Context, id int64, owners []string, proto models.Protos) (*SessionSummary, error) {
	var summary SessionSummary

	if proto == models.ProtosRadius {
		err := models.Sessions(
			models.SessionWhere.ID.EQ(id),
			models.SessionWhere.Owner.IN(owners),
		).Bind(ctx, e.db, &summary)
		if err != nil {
			return nil, noErrorIfNoRows(err)
		}
	} else if proto == models.ProtosTacacs {
		err := models.TacacsSessions(
			models.TacacsSessionWhere.ID.EQ(id),
			models.TacacsSessionWhere.Owner.IN(owners),
		).Bind(ctx, e.db, &summary)
		if err != nil {
			return nil, noErrorIfNoRows(err)
		}
	}

	return &summary, nil
}

func (e *execute) GetTacacsSessionDetails(ctx context.Context, server string, owners []string, id int64) (*TacacsSessionWithFlow, error) {
	var swf TacacsSessionWithFlow

	err := models.TacacsSessions(
		models.TacacsSessionWhere.ID.EQ(id),
		models.TacacsSessionWhere.Owner.IN(owners),
		models.TacacsSessionWhere.Server.EQ(null.StringFrom(server)),
	).Bind(ctx, e.db, &swf)
	if err != nil {
		return nil, noErrorIfNoRows(err)
	}

	q := mods{
		models.FlowWhere.SessionID.EQ(int(id)),
		models.FlowWhere.Proto.EQ(models.ProtosTacacs),
	}.withOrder(&Sort{SortBy: models.FlowColumns.Order, SortDirection: OrderByAsc})

	err = models.Flows(q...).Bind(ctx, e.db, &swf.Flow)
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		return nil, err
	}

	return &swf, nil
}
