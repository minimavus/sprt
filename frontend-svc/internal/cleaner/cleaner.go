package cleaner

import (
	"fmt"
	"time"

	"github.com/cisco-open/sprt/go-generator/sdk/app"
	"github.com/cisco-open/sprt/go-generator/specs"
	"github.com/go-co-op/gocron/v2"
)

type (
	Cleaner interface {
		Toggle(enabled bool) error
		RemoveSessionCleanupJob() error
		SetSessionCleanupJob(cron string) error
		Status() CleanerStatus
	}

	CleanerRuns struct {
		LastRun time.Time `json:"last_run"`
		NextRun time.Time `json:"next_run"`
	}

	CleanerStatus struct {
		Config specs.CleanerSpecs `json:"config"`
		Runs   CleanerRuns        `json:"runs"`
	}

	cleaner struct {
		app app.App
		s   gocron.Scheduler
		j   gocron.Job
		cfg specs.CleanerSpecs
	}
)

const sessionCleanupTag = "session-cleanup"

func NewCleaner(app app.App, cfg specs.CleanerSpecs) (*cleaner, error) {
	s, err := gocron.NewScheduler(
		gocron.WithLogger(&cronLogger{app.Logger()}),
	)
	if err != nil {
		return nil, err
	}

	c := cleaner{app, s, nil, cfg}

	app.(specs.SpecNotifier).OnSpecChange("cleaner.enabled", c.onEnabledChange)
	app.(specs.SpecNotifier).OnSpecChange("cleaner.cron", c.onCronChange)
	app.(specs.SpecNotifier).OnSpecChange("cleaner.older_than", c.onOlderThanChange)

	c.Toggle(c.cfg.Enabled)

	c.s.Start()

	return &c, nil
}

func (c *cleaner) Toggle(enabled bool) error {
	if !enabled {
		return c.RemoveSessionCleanupJob()
	}

	return c.SetSessionCleanupJob(c.cfg.Cron)
}

func (c *cleaner) doCleanup() {
	c.app.Logger().Debug().Msg("Cleaner: perform cleanup")
	return
}

func (c *cleaner) RemoveSessionCleanupJob() error {
	if c.j == nil {
		return nil
	}

	if err := c.s.RemoveJob(c.j.ID()); err != nil {
		return err
	}

	c.j = nil

	return nil
}

func (c *cleaner) SetSessionCleanupJob(cron string) error {
	if err := c.RemoveSessionCleanupJob(); err != nil {
		return err
	}

	if cron == "" {
		c.app.Logger().Info().Msg("No cron provided - dropped cleaner job")
		return nil
	}

	if !c.cfg.Enabled {
		c.app.Logger().Info().Msg("Won't set cleaner job - disabled")
		return nil
	}

	j, err := c.s.NewJob(
		gocron.CronJob(cron, false),
		gocron.NewTask(func() { c.doCleanup() }),
		gocron.WithSingletonMode(gocron.LimitModeReschedule),
		gocron.WithTags(sessionCleanupTag),
	)
	if err != nil {
		return err
	}
	c.j = j

	return nil
}

func (c *cleaner) onEnabledChange(_ string, value any) {
	c.app.Logger().Debug().Interface("enabled", value).Msg("Cleaner: processing enabled change")
	oldValue := c.cfg.Enabled
	switch value := value.(type) {
	case bool:
		c.cfg.Enabled = value
	case *bool:
		if value != nil {
			c.cfg.Enabled = *value
		}
	default:
		c.app.Logger().Warn().Interface("value", value).Msg("Bad value for onCronChange")
		return
	}

	if oldValue == c.cfg.Enabled {
		c.app.Logger().Debug().Msg("Cleaner status didn't change, skip")
		return
	}

	if err := c.Toggle(c.cfg.Enabled); err != nil {
		c.app.Logger().Error().Err(err).Msg("Failed to toggle cleaner")
	}
}

func (c *cleaner) onCronChange(_ string, value any) {
	c.app.Logger().Debug().Interface("cron", value).Msg("Cleaner: processing cron change")
	switch value := value.(type) {
	case string:
		c.cfg.Cron = value
	case *string:
		if value != nil {
			c.cfg.Cron = *value
		}
	case []byte:
		c.cfg.Cron = string(value)
	case *[]byte:
		if value != nil {
			c.cfg.Cron = string(*value)
		}
	default:
		c.app.Logger().Warn().Interface("value", value).Msg("Bad value for onCronChange")
		return
	}

	if err := c.SetSessionCleanupJob(c.cfg.Cron); err != nil {
		c.app.Logger().Error().Err(err).Msg("Failed to update cleaner schedule")
	}
}

func (c *cleaner) onOlderThanChange(_ string, value any) {
	c.app.Logger().Debug().Interface("cron", value).Msg("Cleaner: processing older_than change")
	switch value := value.(type) {
	case time.Duration:
		c.cfg.OlderThan = value
	case *time.Duration:
		if value != nil {
			c.cfg.OlderThan = *value
		}
	case int:
		c.cfg.OlderThan = time.Duration(value)
	case int64:
		c.cfg.OlderThan = time.Duration(value)
	case int32:
		c.cfg.OlderThan = time.Duration(value)
	case int16:
		c.cfg.OlderThan = time.Duration(value)
	case uint:
		c.cfg.OlderThan = time.Duration(value)
	case uint64:
		c.cfg.OlderThan = time.Duration(value)
	case uint32:
		c.cfg.OlderThan = time.Duration(value)
	case uint16:
		c.cfg.OlderThan = time.Duration(value)
	case float64:
		c.cfg.OlderThan = time.Duration(value)
	case float32:
		c.cfg.OlderThan = time.Duration(value)
	default:
		c.app.Logger().Warn().Interface("value", value).Str("type", fmt.Sprintf("%T", value)).Msg("Bad value for onOlderThanChange")
		return
	}
}

func (c *cleaner) Status() CleanerStatus {
	var response CleanerStatus

	response.Config = c.cfg

	if c.j != nil {
		response.Runs.LastRun, _ = c.j.LastRun()
		response.Runs.NextRun, _ = c.j.NextRun()
	}

	return response
}
