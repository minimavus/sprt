package specs

import (
	"errors"
	"fmt"
	"reflect"
	"strings"
	"sync"
	"time"

	"github.com/iancoleman/strcase"
	"github.com/spf13/viper"
)

var (
	ErrFieldNotFound  = errors.New("field not found")
	ErrFieldNotStruct = errors.New("field not struct")
)

type (
	ServerSpecs struct {
		TLS         bool          `env:"USE_HTTPS" default:"false"`
		Port        string        `env:"PORT" default:"3000"`
		Certificate string        `env:"HTTPS_CERTIFICATE_FILE"`
		PrivateKey  string        `env:"HTTPS_PRIVATE_KEY_FILE"`
		ReadTimeout time.Duration `env:"HTTP_READ_TIMEOUT"`
		WithPprof   bool          `env:"WITH_PPROF" default:"false"`
	}

	SessionSpecs struct {
		RedisURL             string   `env:"SESSION_REDIS_URL"`
		RedisCluster         []string `env:"SESSION_REDIS_CLUSTER"`
		RedisClusterUsername string   `env:"SESSION_REDIS_CLUSTER_USERNAME"`
		RedisClusterPassword string   `env:"SESSION_REDIS_CLUSTER_PASSWORD"`
		CookieName           string   `env:"SESSION_COOKIE_NAME" default:"sprt-session"`
		InsecureCookies      bool     `default:"false"`
	}

	SsoSupersSpecs struct {
		Emails []string
		Groups []string
	}

	SsoSpecs struct {
		Redirect string `env:"SSO_REDIRECT_URL"`
		Client   string `env:"SSO_CLIENT_ID"`
		Secret   string `env:"SSO_SECRET"`
		MinLevel int    `env:"SSO_MIN_ACCESS_LEVEL" default:"0"`
		Supers   SsoSupersSpecs
	}

	SingleUserSpecs struct {
		UID       string `env:"USER_UID"`
		GivenName string `env:"USER_GIVEN"`
		Password  string `env:"USER_SUPER_PASSWORD"`
	}

	VersionSpecs struct {
		BuildStamp string `ignored:"true"`
		GitHash    string `ignored:"true"`
		GitVersion string `ignored:"true"`
		V          string `ignored:"true"`
	}

	AuthSpecs struct {
		Enabled      bool   `default:"true"`
		Provider     string `default:"duo"`
		DuoConfig    SsoSpecs
		SingleConfig SingleUserSpecs
	}

	StoreSpecs struct {
		CertificatesDirectory string `env:"CERTIFICATES_DIRECTORY" default:""`
		User                  string `env:"STORE_USER" default:"nobody"`
	}

	ServicesSpecs struct {
		PXGrider PXGriderSpecs
	}

	Specs struct {
		sync.Mutex
		Env       string `env:"ENV"`
		Server    ServerSpecs
		Session   SessionSpecs
		Auth      AuthSpecs
		DB        DBSpecs
		Cleaner   CleanerSpecs
		Store     StoreSpecs
		Services  ServicesSpecs
		Generator GeneratorSpecs
		Queue     QueueSpecs
		Version   VersionSpecs `ignored:"true"`
	}
)

func traverseStruct(prefix string, rt reflect.Type, rv reflect.Value) {
	for i := range rt.NumField() {
		rf := rt.Field(i)
		ymlName := prefixed(prefix, getFieldName(rf))
		if rf.Type.Kind() == reflect.Struct {
			traverseStruct(ymlName, rf.Type, rv.FieldByName(rf.Name))
			continue
		}

		def := rf.Tag.Get("default")
		if def != "" {
			viper.SetDefault(ymlName, def)
		}

		if env := rf.Tag.Get("env"); env != "" {
			viper.BindEnv(ymlName, env)
		}

		lower := strings.ReplaceAll(ymlName, "-", "")
		if lower != ymlName {
			viper.RegisterAlias(lower, ymlName)
		}
	}
}

func prefixed(prefix, name string) string {
	if prefix == "" {
		return name
	}

	return prefix + "." + name
}

func getFieldName(rf reflect.StructField) string {
	name := rf.Name
	if tag := rf.Tag.Get("yaml"); tag != "" {
		name = tag
	}

	return strcase.ToKebab(name)
}

func (s *Specs) PrepareViper() {
	traverseStruct("", reflect.TypeOf(*s), reflect.ValueOf(s).Elem())
}

func (s *Specs) LoadFromViper() error {
	s.Lock()
	defer s.Unlock()

	return viper.Unmarshal(s)
}

func (s *Specs) SetSpec(key string, value any) (err error) {
	s.Lock()
	defer s.Unlock()

	rv := reflect.ValueOf(s)
	parts := strings.Split(key, ".")
	for i, part := range parts {
		if rv.Kind() != reflect.Ptr {
			return fmt.Errorf("object must be a pointer")
		}
		rv = rv.Elem()
		if rv.Kind() != reflect.Struct {
			err = newFieldError(ErrFieldNotStruct, strings.Join(parts[:i], "."), strings.Join(parts[i:], "."))
			return
		}

		fieldName := strcase.ToCamel(part)
		rv = rv.FieldByName(fieldName)
		if !rv.IsValid() {
			err = newFieldError(ErrFieldNotFound, strings.Join(parts[:i], "."), strings.Join(parts[i:], "."))
			return
		}
		rv = rv.Addr()
		if i == len(parts)-1 {
			break
		}
	}

	defer func() {
		if r := recover(); r != nil {
			err = fmt.Errorf("unable to update value: %v", r)
		}
	}()
	rv.Elem().Set(reflect.ValueOf(value))
	viper.Set(key, value)

	return
}

func (s *Specs) GetSpec(key string) any {
	return viper.Get(key)
}

func (s *Specs) QuerySpec(key string) (any, bool) {
	if !viper.IsSet(key) {
		return nil, false
	}

	return viper.Get(key), true
}
