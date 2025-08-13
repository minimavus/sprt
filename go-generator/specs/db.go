package specs

import (
	"net"
	"net/url"
	"strconv"
	"time"
)

type (
	DBSpecs struct {
		ConnRetry             int           `default:"1"`
		ConnTimeout           time.Duration `default:"1m"`
		SSLMode               string
		User                  string
		Password              string
		Host                  string
		Port                  string
		Name                  string
		MaxParamsPerStatement int    `default:"32767"`
		MigrationsDirectory   string `default:"migrations"`
	}
)

func (cfg DBSpecs) GetDSN() string {
	query := make(url.Values)
	if cfg.SSLMode != "" {
		query.Set("sslmode", cfg.SSLMode)
	}
	if cfg.ConnTimeout > 0 {
		query.Set("connect_timeout", strconv.Itoa(int(cfg.ConnTimeout/time.Second)))
	}
	dsn := url.URL{
		Scheme:   "postgres",
		User:     url.UserPassword(cfg.User, cfg.Password),
		Host:     net.JoinHostPort(cfg.Host, cfg.Port),
		Path:     cfg.Name,
		RawQuery: query.Encode(),
	}
	return dsn.String()
}
