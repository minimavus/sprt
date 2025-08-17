GOPATH := $(shell go env GOPATH)
PATH := $(PATH):$(GOPATH)/bin
BOIL_VER := v4.18.0
BOIL_EXT_VER := v0.9.0

build:
	cd frontend && pnpm run build
	ENV=production go build -ldflags "\
    -X github.com/cisco-open/sprt/frontend-svc/internal/config.BuildStamp=`date -u '+%Y-%m-%d_%I:%M:%S%p'` \
    -X github.com/cisco-open/sprt/frontend-svc/internal/config.GitHash=`git rev-parse HEAD` \
    -X github.com/cisco-open/sprt/frontend-svc/internal/config.V=`git describe --always --tags --dirty`\
  " -buildvcs=false -o ./bin/sprt-ui ./cmd/web/*.go

dev:
	cd frontend && pnpm run dev & air

local-prod:
	ENV=production ./bin/sprt-ui --config config.local.yml

wipe-models:
	@sqlboiler psql --wipe

prepare:
	@go get -u github.com/tiendc/sqlboiler-extensions@$(BOIL_EXT_VER)
	@go install github.com/volatiletech/sqlboiler/v4@$(BOIL_VER)
	@go install github.com/volatiletech/sqlboiler/v4/drivers/sqlboiler-psql@$(BOIL_VER)
	@go install github.com/glerchundi/sqlboiler-crdb/v4@latest

gen-models:
	@sqlboiler psql -c sqlboiler.toml \
 		--templates $(GOPATH)/pkg/mod/github.com/volatiletech/sqlboiler/v4@$(BOIL_VER)/templates/main \
 		--templates $(GOPATH)/pkg/mod/github.com/tiendc/sqlboiler-extensions@$(BOIL_EXT_VER)/templates/boilv4/postgres