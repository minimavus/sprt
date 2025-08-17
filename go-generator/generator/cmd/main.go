package main

import (
	"context"
	"os"
	"os/signal"
	"runtime"
	"syscall"

	"github.com/cisco-open/sprt/go-generator/generator/internal/service"
	_ "github.com/cisco-open/sprt/go-generator/generator/plugins_gen"
	"github.com/cisco-open/sprt/go-generator/sdk/registry"
)

func main() {
	svc := service.Build(context.Background())

	var plugins []string
	for _, p := range registry.Registered() {
		plugins = append(plugins, p.Name())
	}
	svc.Logger().Debug().Strs("plugins", plugins).Msg("Loaded plugins")

	defer func() {
		svc.Logger().Debug().Msg("Closing queue")
		svc.Close()

		svc.Logger().Debug().Int("goroutines", runtime.NumGoroutine()).Msg("Close stats")
	}()

	if err := svc.StartListeningOnQueues(); err != nil {
		panic(err)
	}

	waitFotInterruption(svc)
}

func waitFotInterruption(svc *service.Service) {
	done := make(chan os.Signal, 1)
	signal.Notify(done, syscall.SIGINT, syscall.SIGTERM)
	svc.Logger().Info().Str("id", svc.ID()).
		Str("build_stamp", svc.Specs.Version.BuildStamp).
		Str("v", svc.Specs.Version.V).
		Msg("Generator started")
	<-done
}
