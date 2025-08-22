package db

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/aarondl/null/v8"
	"github.com/aarondl/sqlboiler/v4/boil"
	"github.com/aarondl/sqlboiler/v4/queries/qm"
	"github.com/samber/lo"

	"github.com/cisco-open/sprt/go-generator/sdk/conc"
	"github.com/cisco-open/sprt/go-generator/sdk/db/models"
)

type Cleanuper interface {
	GetOrphanFlowsByProto(ctx context.Context, proto models.Protos) ([]int, error)
	GetOrphanFlows(ctx context.Context) ([]int, error)
	DeleteFlows(ctx context.Context, ids ...int) (int64, error)

	GetOldSessionsPerOwnerPerProto(ctx context.Context, proto models.Protos, olderThan time.Duration) ([]ProtoSessionPerOwner, error)
	GetOldSessionsPerOwner(ctx context.Context, olderThan time.Duration) (map[models.Protos][]ProtoSessionPerOwner, error)
	GetOldSessionIdsPerProto(ctx context.Context, proto models.Protos, d time.Duration, limit ...int) ([]int, error)
	GetOldSessionIds(ctx context.Context, d time.Duration, limit ...int) (map[models.Protos][]int, error)
	DeleteOldSessions(ctx context.Context, proto models.Protos, d time.Duration) (int64, error)

	GetOrphanedCLIs(ctx context.Context) ([]string, error)
	DeleteCLIs(ctx context.Context, ids ...string) (int64, error)
}

var _ Cleanuper = (*execute)(nil)

func (e *execute) GetOrphanFlowsByProto(ctx context.Context, proto models.Protos) ([]int, error) {
	flows := models.FlowSlice{}
	err := models.NewQuery(
		qm.Select(`DISTINCT "session_id"`),
		qm.From(models.TableNames.Flows),
		models.FlowWhere.Proto.EQ(proto),
	).Bind(ctx, e.db, &flows)
	if err != nil {
		return nil, noErrorIfNoRows(err)
	}

	idsFromFlows := make([]int, 0, len(flows))
	for _, f := range flows {
		idsFromFlows = append(idsFromFlows, int(f.SessionID))
	}

	type sessID struct {
		ID int64 `boil:"id" json:"id" toml:"id" yaml:"id"`
	}

	distIDsStruct := []*sessID{}
	err = models.NewQuery(
		qm.Select(`DISTINCT "id"`),
		qm.From(sessionsTable(proto)),
	).Bind(ctx, e.db, &distIDsStruct)
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		return nil, err
	}

	distIDs := make([]int, 0, len(distIDsStruct))
	for _, f := range distIDsStruct {
		distIDs = append(distIDs, int(f.ID))
	}

	orph, _ := lo.Difference(idsFromFlows, distIDs)

	return orph, nil
}

func (e *execute) GetOrphanFlows(ctx context.Context) ([]int, error) {
	type result struct {
		proto    models.Protos
		sessions []int
	}

	p := conc.NewResultPool[result](ctx)

	p.Go(func(ctx context.Context) (result, error) {
		sess, err := e.GetOrphanFlowsByProto(ctx, models.ProtosRadius)
		if err != nil {
			return result{proto: models.ProtosRadius}, fmt.Errorf("get radius flows: %w", err)
		}
		return result{models.ProtosRadius, sess}, nil
	})

	p.Go(func(ctx context.Context) (result, error) {
		sess, err := e.GetOrphanFlowsByProto(ctx, models.ProtosTacacs)
		if err != nil {
			return result{proto: models.ProtosTacacs}, fmt.Errorf("get tacacs flows: %w", err)
		}
		return result{models.ProtosTacacs, sess}, nil
	})

	t, err := p.Wait()
	if err != nil {
		return nil, err
	}

	var results []int
	for _, v := range t {
		results = append(results, v.sessions...)
	}

	return results, nil
}

func (e *execute) DeleteFlows(ctx context.Context, ids ...int) (int64, error) {
	var (
		i     int
		total int64
	)

	step := e.getMaxParamsPerStatement()
	for i < len(ids) {
		var chunkIDs []int
		if i+step < len(ids) {
			chunkIDs = ids[i : i+step]
		} else {
			chunkIDs = ids[i:]
		}

		chunkDeleted, err := models.Flows(models.FlowWhere.SessionID.IN(chunkIDs)).DeleteAll(ctx, e.db)
		if err != nil {
			return total, err
		}
		total += chunkDeleted

		i += step
	}

	return total, nil
}

type ProtoSessionPerOwner struct {
	Count int    `boil:"count" json:"count"`
	Owner string `boil:"owner" json:"owner"`
}

func (e *execute) GetOldSessionsPerOwnerPerProto(ctx context.Context, proto models.Protos, d time.Duration) ([]ProtoSessionPerOwner, error) {
	from := time.Now().Add(-d)

	q := mods{qm.Select("owner", `COUNT(id) as "count"`), qm.From(sessionsTable(proto))}
	if proto == models.ProtosTacacs {
		q = append(q, models.TacacsSessionWhere.Changed.LT(null.TimeFrom(from)))
	} else {
		q = append(q, models.SessionWhere.Changed.LT(null.IntFrom(int(from.Unix()))))
	}
	q = append(q, qm.GroupBy("owner"))

	result := []ProtoSessionPerOwner{}
	err := models.NewQuery(q.withOrder(&Sort{SortBy: "count", SortDirection: OrderByDesc})...).Bind(ctx, e.db, &result)
	if err != nil {
		return nil, noErrorIfNoRows(err)
	}

	return result, nil
}

func (e *execute) GetOldSessionIdsPerProto(ctx context.Context, proto models.Protos, d time.Duration, limit ...int) ([]int, error) {
	from := time.Now().Add(-d)

	q := mods{qm.Select("id"), qm.From(sessionsTable(proto))}
	if proto == models.ProtosTacacs {
		q = append(q, models.TacacsSessionWhere.Changed.LT(null.TimeFrom(from)))
	} else {
		q = append(q, models.SessionWhere.Changed.LT(null.IntFrom(int(from.Unix()))))
	}
	if len(limit) > 0 && limit[0] > 0 {
		q = append(q, qm.Limit(limit[0]))
	}

	type protoSessionID struct {
		ID int `boil:"id" json:"id"`
	}
	result := []protoSessionID{}
	err := models.NewQuery(q...).Bind(ctx, e.db, &result)

	if err != nil {
		return nil, noErrorIfNoRows(err)
	}

	return lo.Map(result, func(v protoSessionID, _ int) int { return v.ID }), nil
}

func (e *execute) GetOldSessionsPerOwner(ctx context.Context, d time.Duration) (map[models.Protos][]ProtoSessionPerOwner, error) {
	type result struct {
		proto models.Protos
		sess  []ProtoSessionPerOwner
	}

	p := conc.NewResultPool[result](ctx)

	p.Go(func(ctx context.Context) (result, error) {
		r, err := e.GetOldSessionsPerOwnerPerProto(ctx, models.ProtosRadius, d)
		if err != nil {
			return result{}, err
		}
		return result{models.ProtosRadius, r}, nil
	})

	p.Go(func(ctx context.Context) (result, error) {
		r, err := e.GetOldSessionsPerOwnerPerProto(ctx, models.ProtosTacacs, d)
		if err != nil {
			return result{}, err
		}
		return result{models.ProtosTacacs, r}, nil
	})

	got, err := p.Wait()
	if err != nil {
		return nil, err
	}

	combined := make(map[models.Protos][]ProtoSessionPerOwner)
	for _, v := range got {
		combined[v.proto] = v.sess
	}

	return combined, nil
}

func (e *execute) GetOldSessionIds(ctx context.Context, d time.Duration, limit ...int) (map[models.Protos][]int, error) {
	type result struct {
		proto models.Protos
		sess  []int
	}

	p := conc.NewResultPool[result](ctx)

	p.Go(func(ctx context.Context) (result, error) {
		r, err := e.GetOldSessionIdsPerProto(ctx, models.ProtosRadius, d, limit...)
		if err != nil {
			return result{}, err
		}
		return result{models.ProtosRadius, r}, nil
	})

	p.Go(func(ctx context.Context) (result, error) {
		r, err := e.GetOldSessionIdsPerProto(ctx, models.ProtosTacacs, d, limit...)
		if err != nil {
			return result{}, err
		}
		return result{models.ProtosTacacs, r}, nil
	})

	got, err := p.Wait()
	if err != nil {
		return nil, err
	}

	combined := make(map[models.Protos][]int)
	for _, v := range got {
		combined[v.proto] = v.sess
	}

	return combined, nil
}

func (e *execute) DeleteOldSessions(ctx context.Context, proto models.Protos, d time.Duration) (int64, error) {
	from := time.Now().Add(-d)

	q := mods{}
	if proto == models.ProtosTacacs {
		q = append(q, models.TacacsSessionWhere.Changed.LT(null.TimeFrom(from)))
	} else {
		q = append(q, models.SessionWhere.Changed.LT(null.IntFrom(int(from.Unix()))))
	}

	var deleter interface {
		DeleteAll(ctx context.Context, exec boil.ContextExecutor) (int64, error)
	}

	switch proto {
	case models.ProtosRadius:
		deleter = models.Sessions(q.fromExec(e, nil)...)
	case models.ProtosTacacs:
		deleter = models.TacacsSessions(q.fromExec(e, nil)...)
	}

	return deleter.DeleteAll(ctx, e.db)
}

func (e *execute) GetOrphanedCLIs(ctx context.Context) ([]string, error) {
	clis, err := models.Clis(qm.Select(models.CliColumns.ID)).All(ctx, e.db)
	if err != nil {
		return nil, noErrorIfNoRows(err)
	}

	jobs, err := models.Jobs(
		qm.Distinct(models.JobColumns.Cli),
		models.JobWhere.Cli.IsNotNull(),
	).All(ctx, e.db)
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		return nil, err
	}

	idsFromClis := lo.Map(clis, func(c *models.Cli, _ int) string { return c.ID })
	idsFromJobs := lo.Map(jobs, func(c *models.Job, _ int) string { return c.Cli.String })
	orph, _ := lo.Difference(idsFromClis, idsFromJobs)
	return orph, nil
}

func (e *execute) DeleteCLIs(ctx context.Context, ids ...string) (int64, error) {
	var (
		i     int
		total int64
	)

	step := e.getMaxParamsPerStatement()
	for i < len(ids) {
		var chunkIDs []string
		if i+step < len(ids) {
			chunkIDs = ids[i : i+step]
		} else {
			chunkIDs = ids[i:]
		}

		chunkDeleted, err := models.Clis(models.CliWhere.ID.IN(chunkIDs)).DeleteAll(ctx, e.db)
		if err != nil {
			return total, err
		}
		total += chunkDeleted

		i += step
	}

	return total, nil
}
