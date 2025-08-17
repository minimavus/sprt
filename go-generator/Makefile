# Get workspace root directory (parent of go.work)
WORKSPACE_ROOT := $(shell dirname $$(go env GOWORK))/go-generator
CONFIG := $(WORKSPACE_ROOT)/../frontend-svc/config.local.yml

# Default target
.PHONY: build
build:
	@echo "🔍 Workspace root: $(WORKSPACE_ROOT)"
	@cd $(WORKSPACE_ROOT)/generator && go run ../tools/plugin-builder
	@cd $(WORKSPACE_ROOT)/generator && go build -o $(WORKSPACE_ROOT)/bin/app ./cmd/**.go
	@echo "✅ Build completed at $(WORKSPACE_ROOT)/bin/app"

# Clean build artifacts
.PHONY: clean
clean:
	@rm -rf $(WORKSPACE_ROOT)/bin
	@echo "🧹 Cleaned build artifacts"

# Run the app
.PHONY: run
run: build
	@$(WORKSPACE_ROOT)/bin/app --config $(CONFIG)

.PHONY: dev
dev: 
	air