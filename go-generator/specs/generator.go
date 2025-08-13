package specs

type (
	Matcher func(string) bool

	SourceIP struct {
		Allowed         []string  `env:"SOURCE_IPS_ALLOWED"`
		Exclude         []string  `env:"SOURCE_IPS_EXCLUDE"`
		AutoDetect      bool      `env:"SOURCE_IPS_AUTO_DETECT" default:"true"`
		ExplicitSources []string  `env:"SOURCE_IPS_EXPLICIT"`
		ExcludeMatchers []Matcher `ignored:"true"`
		AllowedMatchers []Matcher `ignored:"true"`
	}

	Patterns struct {
		SessionID string `env:"PATTERNS_SESSION_ID" default:"uc(hex(rand(4096..65535)))/uc($MAC$)/uc(hex(rand(4096..65535)))"`
	}

	Jobs struct {
		MaxConc           int `env:"JOBS_MAX_CONC" default:"4"`
		MaxThreads        int `env:"JOBS_MAX_THREADS" default:"16"`
		MaxSessionsPerJob int `env:"JOBS_MAX_SESSIONS_PER_JOB" default:"100000"`
	}

	Radius struct {
		MaxRetransmits int `env:"RADIUS_MAX_RETRANSMITS" default:"5"`
		MaxTimeout     int `env:"RADIUS_MAX_TIMEOUT" default:"60"`
	}

	GeneratorSpecs struct {
		FreeRadiusDictionariesPath string `env:"FREE_RADIUS_DICTIONARIES_PATH"`
		SourceIP                   SourceIP
		MaxVarTries                int `env:"MAX_VAR_TRIES" default:"10000"`
		Patterns                   Patterns
		WatcherLifetime            int `env:"WATCHER_LIFETIME" default:"86400"`
		Jobs                       Jobs
		Radius                     Radius
	}
)
