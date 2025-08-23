module github.com/cisco-open/sprt/go-generator/generator

go 1.25

require (
	github.com/cisco-open/sprt/go-generator/generator/plugins/eaptls v0.0.0-00010101000000-000000000000
	github.com/cisco-open/sprt/go-generator/generator/plugins/mab v0.0.0-00010101000000-000000000000
	github.com/cisco-open/sprt/go-generator/generator/plugins/pap v0.0.0-00010101000000-000000000000
	github.com/cisco-open/sprt/go-generator/generator/plugins/peap v0.0.0-00010101000000-000000000000
	github.com/cisco-open/sprt/go-generator/sdk v0.0.0-00010101000000-000000000000
	github.com/cisco-open/sprt/go-generator/specs v0.0.0-00010101000000-000000000000
	github.com/google/uuid v1.6.0
	github.com/joho/godotenv v1.5.1
	github.com/nats-io/nats.go v1.45.0
	github.com/rs/zerolog v1.34.0
	github.com/sourcegraph/jsonrpc2 v0.2.1
	github.com/spf13/viper v1.20.1
)

require (
	github.com/aarondl/inflect v0.0.2 // indirect
	github.com/aarondl/null/v8 v8.1.3 // indirect
	github.com/aarondl/randomize v0.0.2 // indirect
	github.com/aarondl/sqlboiler/v4 v4.19.5 // indirect
	github.com/aarondl/strmangle v0.0.9 // indirect
	github.com/ericlagergren/decimal v0.0.0-20190420051523-6335edbaa640 // indirect
	github.com/friendsofgo/errors v0.9.2 // indirect
	github.com/fsnotify/fsnotify v1.8.0 // indirect
	github.com/go-gorp/gorp/v3 v3.1.0 // indirect
	github.com/go-viper/mapstructure/v2 v2.4.0 // indirect
	github.com/goccy/go-json v0.10.5 // indirect
	github.com/goccy/go-yaml v1.18.0 // indirect
	github.com/gofrs/uuid v4.2.0+incompatible // indirect
	github.com/gotnospirit/makeplural v0.0.0-20180622080156-a5f48d94d976 // indirect
	github.com/gotnospirit/messageformat v0.0.0-20221001023931-dfe49f1eb092 // indirect
	github.com/iancoleman/strcase v0.3.0 // indirect
	github.com/json-iterator/go v1.1.12 // indirect
	github.com/kaptinlin/go-i18n v0.1.4 // indirect
	github.com/kaptinlin/jsonschema v0.4.6 // indirect
	github.com/klauspost/compress v1.18.0 // indirect
	github.com/lib/pq v1.10.9 // indirect
	github.com/lucasjones/reggen v0.0.0-20200904144131-37ba4fa293bb // indirect
	github.com/matoous/go-nanoid v1.5.1 // indirect
	github.com/mattn/go-colorable v0.1.13 // indirect
	github.com/mattn/go-isatty v0.0.19 // indirect
	github.com/mitchellh/mapstructure v1.5.0 // indirect
	github.com/modern-go/concurrent v0.0.0-20180306012644-bacd9c7ef1dd // indirect
	github.com/modern-go/reflect2 v1.0.2 // indirect
	github.com/nats-io/nkeys v0.4.11 // indirect
	github.com/nats-io/nuid v1.0.1 // indirect
	github.com/pelletier/go-toml/v2 v2.2.4 // indirect
	github.com/pkg/errors v0.9.1 // indirect
	github.com/rubenv/sql-migrate v1.8.0 // indirect
	github.com/sagikazarmark/locafero v0.10.0 // indirect
	github.com/samber/lo v1.51.0 // indirect
	github.com/sourcegraph/conc v0.3.1-0.20240121214520-5f936abd7ae8 // indirect
	github.com/spf13/afero v1.14.0 // indirect
	github.com/spf13/cast v1.7.1 // indirect
	github.com/spf13/pflag v1.0.6 // indirect
	github.com/subosito/gotenv v1.6.0 // indirect
	go.uber.org/atomic v1.9.0 // indirect
	go.uber.org/multierr v1.9.0 // indirect
	golang.org/x/crypto v0.38.0 // indirect
	golang.org/x/sys v0.33.0 // indirect
	golang.org/x/text v0.27.0 // indirect
	golang.org/x/xerrors v0.0.0-20220609144429-65e65417b02f // indirect
	gopkg.in/yaml.v3 v3.0.1 // indirect
	layeh.com/radius v0.0.0-20231213012653-1006025d24f8 // indirect
)

replace (
	github.com/cisco-open/sprt/go-generator/generator/plugins/eaptls => ../plugins/eaptls
	github.com/cisco-open/sprt/go-generator/generator/plugins/mab => ../plugins/mab
	github.com/cisco-open/sprt/go-generator/generator/plugins/pap => ../plugins/pap
	github.com/cisco-open/sprt/go-generator/generator/plugins/peap => ../plugins/peap
	github.com/cisco-open/sprt/go-generator/sdk => ../sdk
	github.com/cisco-open/sprt/go-generator/specs => ../specs
)
