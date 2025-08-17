GOPATH := $(shell go env GOPATH)
PATH := $(PATH):$(GOPATH)/bin

dev:
	@echo "🔧 Starting development environment..."
	@trap 'trap - TERM; kill 0; wait' INT TERM
	(cd ./go-generator && make dev) & \
	(cd ./frontend-svc && make dev) & \
	wait
