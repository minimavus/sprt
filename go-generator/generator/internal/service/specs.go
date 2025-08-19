package service

import (
	"fmt"
	"strings"

	"github.com/cisco-open/sprt/go-generator/specs"
	"github.com/spf13/viper"
)

var (
	BuildStamp = "undefined"
	GitHash    = "undefined"
	V          = "undefined"
)

func (a *Service) mustLoadSpecs(cfgFile *string) *Service {
	viper.SetConfigName("config")
	viper.SetConfigType("yaml")
	viper.SetEnvPrefix("sprt")
	viper.SetEnvKeyReplacer(strings.NewReplacer("sprt", "sprt_generator"))

	if cfgFile != nil && *cfgFile != "" {
		viper.SetConfigFile(*cfgFile)
	} else {
		viper.AddConfigPath(".")
		viper.AddConfigPath("./config")
	}
	viper.AutomaticEnv()

	a.Specs.PrepareViper()

	if err := viper.ReadInConfig(); err != nil {
		panic(fmt.Errorf("fatal error config file: %w", err))
	}

	if err := a.Specs.LoadFromViper(); err != nil {
		panic(err)
	}

	a.Specs.Lock()
	defer a.Specs.Unlock()

	a.Specs.Version.BuildStamp = BuildStamp
	a.Specs.Version.GitHash = GitHash
	a.Specs.Version.GitVersion = V
	a.Specs.Version.V = specs.Version

	return a
}
