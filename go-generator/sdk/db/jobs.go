package db

import (
	"context"

	"github.com/aarondl/null/v8"
	"github.com/aarondl/sqlboiler/v4/queries/qm"
	"github.com/cisco-open/sprt/go-generator/sdk/db/models"
	"github.com/lib/pq"
)

type JobWithCLI struct {
	models.Job `boil:",bind"`
	CLI        null.String `boil:"line" json:"line,omitempty" toml:"line" yaml:"line,omitempty"`
}

type JobsManipulator interface {
	GetAllUsersWithJobs(ctx context.Context) ([]string, error)
	GetJobsOfUserWithOptions(ctx context.Context, user string, opts ...JobsLoadOption) ([]*JobWithCLI, error)
	GetJobByID(ctx context.Context, id, user string) (*JobWithCLI, error)
	DeleteJob(ctx context.Context, id, user string) error
}

var _ JobsManipulator = (*execute)(nil)

var filterableJobsColumns = []string{
	models.JobColumns.ID,
	models.JobColumns.Owner,
	models.JobColumns.Name,
	models.JobColumns.Percentage,
}

func (e *execute) GetAllUsersWithJobs(ctx context.Context) ([]string, error) {
	q := mods{
		qm.Select("DISTINCT " + pq.QuoteIdentifier(models.JobColumns.Owner)),
		qm.OrderBy(pq.QuoteIdentifier(models.JobColumns.Owner) + " ASC"),
	}

	type userRow struct {
		Owner string `boil:"owner"`
	}

	users := []userRow{}
	err := models.Jobs(q.fromExec(e, nil)...).Bind(ctx, e.db, &users)
	if err != nil {
		return nil, noErrorIfNoRows(err)
	}

	var result []string
	for _, u := range users {
		result = append(result, u.Owner)
	}

	return result, nil
}

type jobsLoadOnly int

const (
	onlyAll jobsLoadOnly = iota
	onlyIDs
	onlyFinished
	onlyRunning
	onlyRepeatable
	onlyNotRepeatable
)

type jobsLoadOptions struct {
	withCLI bool
	only    jobsLoadOnly
	ids     []string
}

type JobsLoadOption func(*jobsLoadOptions)

func JobsWithLoadCLI(v bool) JobsLoadOption {
	return func(o *jobsLoadOptions) {
		o.withCLI = v
	}
}

func JobsWithIDs(ids ...string) JobsLoadOption {
	return func(o *jobsLoadOptions) {
		o.only = onlyIDs
		o.ids = ids
	}
}

func JobsWithOnlyFinished() JobsLoadOption {
	return func(o *jobsLoadOptions) {
		o.only = onlyFinished
	}
}

func JobsWithOnlyRunning() JobsLoadOption {
	return func(o *jobsLoadOptions) {
		o.only = onlyRunning
	}
}

func JobsWithOnlyRepeatable() JobsLoadOption {
	return func(o *jobsLoadOptions) {
		o.only = onlyRepeatable
	}
}

func JobsWithOnlyNotRepeatable() JobsLoadOption {
	return func(o *jobsLoadOptions) {
		o.only = onlyNotRepeatable
	}
}

func (e *execute) GetJobsOfUserWithOptions(ctx context.Context, user string, opts ...JobsLoadOption) ([]*JobWithCLI, error) {
	var options jobsLoadOptions
	for _, o := range opts {
		o(&options)
	}

	var additional mods
	switch options.only {
	case onlyIDs:
		additional = append(additional, models.JobWhere.ID.IN(options.ids))
	case onlyFinished:
		additional = append(additional, models.JobWhere.Percentage.EQ(null.Int16From(100)))
	case onlyRunning:
		additional = append(additional, models.JobWhere.Pid.GT(0), models.JobWhere.Percentage.LT(null.Int16From(100)))
	case onlyRepeatable:
		additional = append(additional, models.JobWhere.Cli.IsNotNull())
	case onlyNotRepeatable:
		additional = append(additional, models.JobWhere.Cli.IsNull())
	}

	if options.withCLI {
		return e.getJobsOfUserWithCli(ctx, user, additional...)
	}

	q := mods{models.JobWhere.Owner.EQ(null.StringFrom(user))}
	q = append(q, additional...)

	result := []*JobWithCLI{}
	err := models.Jobs(q.fromExec(e, filterableJobsColumns)...).Bind(ctx, e.db, &result)
	return result, noErrorIfNoRows(err)
}

func (e *execute) GetJobByID(ctx context.Context, id, user string) (*JobWithCLI, error) {
	q := mods{
		models.JobWhere.ID.EQ(id),
		models.JobWhere.Owner.EQ(null.StringFrom(user)),
	}

	result := &JobWithCLI{}
	err := models.Jobs(q.fromExec(e, filterableJobsColumns)...).Bind(ctx, e.db, result)
	return result, noErrorIfNoRows(err)
}

func (e *execute) DeleteJob(ctx context.Context, id, user string) error {
	_, err := models.Jobs(models.JobWhere.ID.EQ(id), models.JobWhere.Owner.EQ(null.StringFrom(user))).
		DeleteAll(ctx, e.db)
	return err
}

func (e *execute) getJobsOfUserWithCli(ctx context.Context, user string, additional ...qm.QueryMod) ([]*JobWithCLI, error) {
	q := mods{
		qm.Select("jobs.*", "cli.line as line"),
		qm.From(models.TableNames.Jobs),
		qm.InnerJoin("cli ON jobs.cli = cli.id"),
		models.JobWhere.Owner.EQ(null.StringFrom(user)),
	}
	q = append(q, additional...)

	result := []*JobWithCLI{}
	err := models.NewQuery(q.fromExec(e, filterableJobsColumns)...).Bind(ctx, e.db, &result)
	return result, noErrorIfNoRows(err)
}
