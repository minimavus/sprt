package generator

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

	Specs struct {
		FreeRadiusDictionariesPath string `env:"FREE_RADIUS_DICTIONARIES_PATH"`
		SourceIP                   SourceIP
	}
)
