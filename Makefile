GOPATH := $(shell go env GOPATH)
PATH := $(PATH):$(GOPATH)/bin

dev:
	cd frontend-svc && make dev