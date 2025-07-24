package db

import (
	"github.com/lib/pq"
	"github.com/volatiletech/sqlboiler/v4/boil"
	"github.com/volatiletech/sqlboiler/v4/queries/qm"

	"github.com/cisco-open/sprt/frontend-svc/shared"
)

type (
	Pagination struct {
		Offset int
		Limit  int
	}

	Sort struct {
		SortBy        string           `json:"sort_by"`
		RawSortBy     string           `json:"-"`
		SortDirection OrderByDirection `json:"sort_direction"`
	}

	Filter struct {
		Value string `json:"filter_value"`
		Term  string `json:"filter_term"`
	}

	execute struct {
		db boil.ContextExecutor
		l  shared.Logger

		offset                *int
		limit                 *int
		s                     *Sort
		f                     *Filter
		maxParamsPerStatement int
	}

	PaginateSorter interface {
		WithPagination(p *Pagination) Executor
		WithSort(s *Sort) Executor
		WithOffset(offset *int) Executor
		WithLimit(limit *int) Executor
		WithFilter(f *Filter) Executor
	}

	Executor interface {
		PaginateSorter

		// Logs
		LogsManipulator

		// Cleanup
		Cleanuper

		// User Settings
		ServersSettingsManipulator
		APISettingsManipulator
		SmsGatewaySettingsManipulator
		DictionariesManipulator
		CertificatesManipulator
		ScepManipulator
		UserDefaultsManipulator
		UsersManipulator

		// App Config
		AppConfigManipulator

		// Sessions
		SessionsManipulator

		// Jobs
		JobsManipulator

		// Within transaction
		Tx(tx boil.ContextExecutor) Executor
	}
)

func Exec(app shared.LogDB) Executor {
	return &execute{
		db:                    app.DB(),
		l:                     app,
		maxParamsPerStatement: app.(interface{ DBSpec() Specs }).DBSpec().MaxParamsPerStatement,
	}
}

func (e *execute) Tx(tx boil.ContextExecutor) Executor {
	e.db = tx
	return e
}

func (e *execute) WithPagination(p *Pagination) Executor {
	if p == nil {
		return e
	}

	var pClone Pagination
	pClone = *p

	e.offset = &pClone.Offset
	e.limit = &pClone.Limit
	return e
}

func (e *execute) WithSort(s *Sort) Executor {
	if s == nil {
		return e
	}
	if s.SortBy == "" && s.RawSortBy == "" {
		return e
	}

	var sClone Sort
	sClone = *s

	e.s = &sClone
	return e
}

func (e *execute) WithOffset(offset *int) Executor {
	if offset == nil {
		return e
	}

	cloned := *offset
	e.offset = &cloned
	return e
}

func (e *execute) WithLimit(limit *int) Executor {
	if limit == nil {
		return e
	}

	cloned := *limit
	e.limit = &cloned
	return e
}

func (e *execute) WithFilter(f *Filter) Executor {
	if f == nil {
		return e
	}

	cloned := *f
	e.f = &cloned
	return e
}

func (e *execute) pagination(dflt *Pagination) *Pagination {
	if e.offset == nil && e.limit == nil {
		return dflt
	}

	return &Pagination{
		Offset: *e.offset,
		Limit:  *e.limit,
	}
}

func (e *execute) order(dflt *Sort) *Sort {
	if e.s == nil {
		return dflt
	}

	return e.s
}

type mods []qm.QueryMod

func (q mods) fromExec(e *execute, allFilterableColumns []string) mods {
	if e == nil {
		return q
	}

	return q.withFilter(e.f, allFilterableColumns).withOrder(e.s).withLimit(e.limit).withOffset(e.offset)
}

func (q mods) withPagination(p *Pagination) mods {
	if p == nil {
		return q
	}

	r := append(q, qm.Offset(p.Offset))
	if p.Limit > 0 {
		r = append(r, qm.Limit(p.Limit))
	}

	return r
}

func (q mods) withOffset(offset *int) mods {
	if offset == nil {
		return q
	}

	return append(q, qm.Offset(*offset))
}

func (q mods) withLimit(limit *int) mods {
	if limit == nil {
		return q
	}

	return append(q, qm.Limit(*limit))
}

func (q mods) withOrder(s *Sort) mods {
	if s == nil {
		return q
	}
	if s.SortBy == "" && s.RawSortBy == "" {
		return q
	}

	if s.RawSortBy != "" {
		return append(q, qm.OrderBy(s.RawSortBy+" "+s.SortDirection.String()))
	}

	return append(q, qm.OrderBy(pq.QuoteIdentifier(s.SortBy)+" "+s.SortDirection.String()))
}

func (q mods) withFilter(f *Filter, allFilterableColumns []string) mods {
	if f == nil {
		return q
	}

	if f.Term == "" {
		ors := []qm.QueryMod{}
		for _, column := range allFilterableColumns {
			if len(ors) == 0 {
				ors = append(ors, qm.Where(pq.QuoteIdentifier(column)+" ILIKE ?", "%"+f.Value+"%"))
				continue
			}
			ors = append(ors, qm.Or(pq.QuoteIdentifier(column)+" ILIKE ?", "%"+f.Value+"%"))
		}
		return append(q, qm.Expr(ors...))
	}

	return append(q, qm.Where(pq.QuoteIdentifier(f.Term)+" ILIKE ?", "%"+f.Value+"%"))
}
