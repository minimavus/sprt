package jobs

import (
	"context"
	"database/sql"
	"errors"
	"net/http"
	"net/url"
	"os"
	"syscall"
	"time"

	"github.com/cisco-open/sprt/frontend-svc/internal/db"
	"github.com/cisco-open/sprt/frontend-svc/shared"
	"github.com/cisco-open/sprt/go-generator/sdk/json"
)

var (
	ErrJobNotFound      = errors.New("job not found")
	ErrJobNotRepeatable = errors.New("job not repeatable")
)

func FindRunning(jobs []*db.JobWithCLI) []string {
	var result []string
	for _, j := range jobs {
		if j.Pid > 0 {
			if proc, err := os.FindProcess(j.Pid); err == nil {
				if err := proc.Signal(syscall.Signal(0)); err == nil {
					result = append(result, j.ID)
				}
			}
		}
	}
	return result
}

func GetJobStats(app shared.LogDB, ctx context.Context, job, user string) (any, error) {
	// FIXME: get it from file, not API

	api := `/jobs/id/` + job + `/charts/`
	u, err := url.ParseRequestURI(api)
	if err != nil {
		return nil, err
	}
	q := url.Values{}
	q.Add("user", user)
	u.RawQuery = q.Encode()
	u.ForceQuery = true

	c := http.Client{Timeout: 20 * time.Second}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u.String(), nil)
	if err != nil {
		return nil, err
	}
	cookie := ""
	req.Header.Set("Cookie", cookie)
	req.Header.Set("Accept", "application/json")

	app.Logger().Debug().Str("job_id", job).Str("user", user).Str("url", u.String()).Msg("Getting job stats")

	res, err := c.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	var stats any
	if err = json.NewDecoder(res.Body).Decode(&stats); err != nil {
		return nil, err
	}

	return stats, nil
}

func DeleteJob(app shared.LogDB, ctx context.Context, job, user string, noRollbackOnFileErr bool) error {
	tx, err := app.DB().BeginTx(ctx, &sql.TxOptions{})
	if err != nil {
		return err
	}
	defer tx.Rollback()

	j, err := db.Exec(app).Tx(tx).GetJobByID(ctx, job, user)
	if err != nil {
		return err
	}

	err = db.Exec(app).Tx(tx).DeleteJob(ctx, job, user)
	if err != nil {
		return err
	}

	decodedAttributes := struct {
		StatsFile string `json:"stats"`
	}{}
	if err = j.Attributes.Unmarshal(&decodedAttributes); err != nil {
		if !noRollbackOnFileErr {
			return err
		}
	}

	if decodedAttributes.StatsFile != "" {
		if err = os.Remove(decodedAttributes.StatsFile); err != nil {
			if !noRollbackOnFileErr {
				return err
			}
		}
	}

	return tx.Commit()
}

func RepeatJob(app shared.LogDB, ctx context.Context, job, user string) error {
	j, err := db.Exec(app).GetJobByID(ctx, job, user)
	if err != nil {
		return err
	}

	if j == nil {
		return ErrJobNotFound
	}

	return errors.New("FIXME: not implemented")
}
