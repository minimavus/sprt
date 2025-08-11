GOPATH := $(shell go env GOPATH)
PATH := $(PATH):$(GOPATH)/bin

dev:
	@echo "🔧 Starting development environment..."
	@cd ./go-generator && make build
	@cd ./frontend-svc && make dev