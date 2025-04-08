package db

import (
	"context"

	"github.com/cisco-open/sprt/frontend-svc/models"
	"github.com/samber/lo"
	"github.com/volatiletech/null/v8"
	"github.com/volatiletech/sqlboiler/v4/queries/qm"
)

type LogsManipulator interface {
	GetLogOwners(ctx context.Context, orderBy, orderHow string) ([]LogOwnersRow, error)
	GetLogOwnerChunks(ctx context.Context, owners ...string) ([]LogOwnerChunkRow, error)
	GetLogsChunkOwner(ctx context.Context, chunk string) (string, error)
	GetLogsChunk(ctx context.Context, owner, chunk string, limit ...int) ([]*models.Log, error)
	GetLogsRelatedFiles(ctx context.Context, owner []string, chunks ...string) ([]string, error)
	DeleteLogs(ctx context.Context, owner []string, chunks ...string) (int64, error)
}

var _ LogsManipulator = (*execute)(nil)

type LogOwnerChunkRow struct {
	Owner   string    `boil:"owner" json:"owner"`
	Chunk   string    `boil:"chunk" json:"chunk"`
	Started null.Time `boil:"started" json:"started"`
	Count   int       `boil:"count" json:"count"`
}

func (e *execute) GetLogOwnerChunks(ctx context.Context, owners ...string) ([]LogOwnerChunkRow, error) {
	list := []LogOwnerChunkRow{}

	q := mods{
		qm.Select("chunk", "owner", `MIN(timestamp) AS "started"`, `COUNT(id) AS "count"`),
		qm.WhereIn("owner IN ?", lo.Map(owners, func(o string, _ int) any { return any(o) })...),
		qm.From(models.TableNames.Logs),
		qm.GroupBy("chunk, owner"),
	}

	if e.s == nil {
		e.s = &Sort{SortBy: "started", SortDirection: OrderByDesc}
	}

	err := models.NewQuery(q.fromExec(e, nil)...).Bind(ctx, e.db, &list)
	if err != nil {
		return nil, noErrorIfNoRows(err)
	}

	return list, nil
}

type LogOwnersRow struct {
	Owner      string    `boil:"owner" json:"owner"`
	LastUpdate null.Time `boil:"last_update" json:"last_update"`
}

func (e *execute) GetLogOwners(ctx context.Context, orderBy, orderHow string) ([]LogOwnersRow, error) {
	list := []LogOwnersRow{}

	q := mods{
		qm.Select("owner", `max(timestamp) as "last_update"`),
		qm.From(models.TableNames.Logs),
		qm.GroupBy(models.LogColumns.Owner),
	}

	if e.s == nil {
		e.s = &Sort{SortBy: orderBy, SortDirection: OrderByDirection(orderHow)}
	}

	err := models.NewQuery(q.fromExec(e, nil)...).Bind(ctx, e.db, &list)
	if err != nil {
		return nil, noErrorIfNoRows(err)
	}

	return list, nil
}

func (e *execute) GetLogsChunkOwner(ctx context.Context, chunk string) (string, error) {
	q := mods{
		qm.Select(models.LogColumns.Owner),
		models.LogWhere.Chunk.EQ(null.StringFrom(chunk)),
	}

	l, err := models.Logs(q.fromExec(e, nil)...).One(ctx, e.db)
	if err != nil {
		return "", noErrorIfNoRows(err)
	}

	return l.Owner.String, nil
}

func (e *execute) GetLogsChunk(ctx context.Context, owner, chunk string, limit ...int) ([]*models.Log, error) {
	q := mods{
		models.LogWhere.Chunk.EQ(null.StringFrom(chunk)),
		models.LogWhere.Owner.EQ(null.StringFrom(owner)),
	}

	if len(limit) > 0 && limit[0] > 0 {
		q = append(q, qm.Limit(limit[0]))
	}
	if e.s == nil {
		e.s = &Sort{SortBy: "timestamp", SortDirection: OrderByAsc}
	}

	m, err := models.Logs(q.fromExec(e, nil)...).All(ctx, e.db)
	if err != nil {
		return nil, noErrorIfNoRows(err)
	}
	return m, nil
}

func (e *execute) GetLogsRelatedFiles(ctx context.Context, owner []string, chunks ...string) ([]string, error) {
	q := mods{
		qm.Select(models.LogColumns.Message),
		models.LogWhere.Owner.IN(owner),
	}

	if len(chunks) > 0 {
		q = append(q, qm.WhereIn(models.LogColumns.Chunk+" IN ?",
			lo.Map(chunks, func(o string, _ int) any { return any(o) })...))
	}

	q = append(q, models.LogWhere.Message.ILIKE(null.StringFrom("file:%")))

	slice, err := models.Logs(q.fromExec(e, nil)...).All(ctx, e.db)
	if err != nil {
		return nil, noErrorIfNoRows(err)
	}

	return lo.Map(slice, func(i *models.Log, _ int) string { return i.Message.String }), nil
}

func (e *execute) DeleteLogs(ctx context.Context, owner []string, chunks ...string) (int64, error) {
	q := mods{
		models.LogWhere.Owner.IN(owner),
	}

	if len(chunks) > 0 {
		q = append(q, qm.WhereIn(models.LogColumns.Chunk+" IN ?",
			lo.Map(chunks, func(o string, _ int) any { return any(o) })...))
	}

	return models.Logs(q...).DeleteAll(ctx, e.db)
}
