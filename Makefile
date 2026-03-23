# ==============================================================================
# EMSIST - Common Operations Makefile
#
# Safe commands for managing Docker environments and databases.
# These commands wrap scripts that include safety guards.
#
# Usage:
#   make help              Show all available commands
#   make dev-up            Start development environment
#   make staging-up        Start staging environment
#   make backup            Backup all databases (dev)
#   make backup-staging    Backup all databases (staging)
#   make upgrade           Safe upgrade with backup (dev)
#   make upgrade-staging   Safe upgrade with backup (staging)
#   make rollback          Rollback to latest backup (dev)
#   make rollback-staging  Rollback to latest backup (staging)
#   make health            Check all service health endpoints
# ==============================================================================

.PHONY: help dev-up dev-down dev-build staging-up staging-down staging-build \
        data-up data-down app-up app-down \
        data-up-staging data-down-staging app-up-staging app-down-staging \
        backup backup-staging backup-list restore upgrade upgrade-staging \
        rollback rollback-staging rollback-list health health-staging \
        logs logs-staging ps ps-staging clean-images

# Default environment
ENV ?= dev

# Colors
BLUE  := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[1;33m
RED   := \033[0;31m
NC    := \033[0m

# ==============================================================================
# HELP
# ==============================================================================

help: ## Show this help message
	@echo ""
	@echo "$(BLUE)EMSIST - Common Operations$(NC)"
	@echo "=========================="
	@echo ""
	@echo "$(GREEN)Development Environment:$(NC)"
	@grep -E '^(dev-|backup |upgrade |rollback |health |logs |ps )' $(MAKEFILE_LIST) | grep -E '##' | awk 'BEGIN {FS = ":.*##"}; {printf "  $(BLUE)make %-22s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(GREEN)Staging Environment:$(NC)"
	@grep -E '^(staging-|backup-staging|upgrade-staging|rollback-staging|health-staging|logs-staging|ps-staging)' $(MAKEFILE_LIST) | grep -E '##' | awk 'BEGIN {FS = ":.*##"}; {printf "  $(BLUE)make %-22s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(GREEN)Utilities:$(NC)"
	@grep -E '^(clean-|backup-list|rollback-list)' $(MAKEFILE_LIST) | grep -E '##' | awk 'BEGIN {FS = ":.*##"}; {printf "  $(BLUE)make %-22s$(NC) %s\n", $$1, $$2}'
	@echo ""

# ==============================================================================
# DEVELOPMENT ENVIRONMENT
# Two-tier split: data tier (postgres/neo4j/valkey/kafka) is independent of app tier.
# SAFE: `make data-down` stops data services WITHOUT -v (volumes are preserved).
# DANGER: `docker compose -f docker-compose.dev-data.yml down -v` destroys ALL data.
# ==============================================================================

dev-up: ## Start development environment (data tier first, then app tier)
	@./scripts/dev-up.sh

dev-build: ## Rebuild and start development environment
	@./scripts/dev-up.sh --build

dev-down: ## Stop FULL development environment — app + data (preserves volumes)
	@docker compose -p ems-dev -f docker-compose.dev-app.yml --env-file .env.dev down --remove-orphans 2>/dev/null || true
	@docker compose -p ems-dev -f docker-compose.dev-data.yml --env-file .env.dev down --remove-orphans
	@echo "$(GREEN)[OK]$(NC)  Development environment stopped. Data volumes preserved."

data-up: ## Start ONLY the data tier (postgres, neo4j, valkey, kafka, backup-cron)
	@docker compose -p ems-dev -f docker-compose.dev-data.yml --env-file .env.dev up -d
	@echo "$(GREEN)[OK]$(NC)  Dev data tier started."

data-down: ## Stop ONLY the data tier — does NOT remove volumes (safe)
	@docker compose -p ems-dev -f docker-compose.dev-data.yml --env-file .env.dev down --remove-orphans
	@echo "$(GREEN)[OK]$(NC)  Dev data tier stopped. Volumes preserved."

app-up: ## Start ONLY the app tier (all services except data stores)
	@docker compose -p ems-dev -f docker-compose.dev-app.yml --env-file .env.dev up -d
	@echo "$(GREEN)[OK]$(NC)  Dev app tier started."

app-down: ## Stop ONLY the app tier (data stores remain running)
	@docker compose -p ems-dev -f docker-compose.dev-app.yml --env-file .env.dev down --remove-orphans
	@echo "$(GREEN)[OK]$(NC)  Dev app tier stopped. Data tier still running."

# ==============================================================================
# STAGING ENVIRONMENT
# ==============================================================================

staging-up: ## Start staging environment (data tier first, then app tier)
	@./scripts/staging-up.sh

staging-build: ## Rebuild staging environment (auto-backup first)
	@./scripts/staging-up.sh --build

staging-down: ## Stop FULL staging environment — app + data (preserves volumes)
	@docker compose -p ems-stg -f docker-compose.staging-app.yml --env-file .env.staging down --remove-orphans 2>/dev/null || true
	@docker compose -p ems-stg -f docker-compose.staging-data.yml --env-file .env.staging down --remove-orphans
	@echo "$(GREEN)[OK]$(NC)  Staging environment stopped. Data volumes preserved."

data-up-staging: ## Start ONLY the staging data tier
	@docker compose -p ems-stg -f docker-compose.staging-data.yml --env-file .env.staging up -d
	@echo "$(GREEN)[OK]$(NC)  Staging data tier started."

data-down-staging: ## Stop ONLY the staging data tier — does NOT remove volumes (safe)
	@docker compose -p ems-stg -f docker-compose.staging-data.yml --env-file .env.staging down --remove-orphans
	@echo "$(GREEN)[OK]$(NC)  Staging data tier stopped. Volumes preserved."

app-up-staging: ## Start ONLY the staging app tier
	@docker compose -p ems-stg -f docker-compose.staging-app.yml --env-file .env.staging up -d
	@echo "$(GREEN)[OK]$(NC)  Staging app tier started."

app-down-staging: ## Stop ONLY the staging app tier (data stores remain running)
	@docker compose -p ems-stg -f docker-compose.staging-app.yml --env-file .env.staging down --remove-orphans
	@echo "$(GREEN)[OK]$(NC)  Staging app tier stopped. Data tier still running."

# ==============================================================================
# BACKUP
# ==============================================================================

backup: ## Backup all dev databases (PostgreSQL + Neo4j + Valkey)
	@./scripts/backup-databases.sh --env dev

backup-staging: ## Backup all staging databases
	@./scripts/backup-databases.sh --env staging

backup-list: ## List available backups for both environments
	@echo "$(BLUE)=== Dev Backups ===$(NC)"
	@ls -dt backups/dev_* 2>/dev/null | head -5 || echo "  No dev backups found"
	@echo ""
	@echo "$(BLUE)=== Staging Backups ===$(NC)"
	@ls -dt backups/staging_* 2>/dev/null | head -5 || echo "  No staging backups found"

# ==============================================================================
# UPGRADE (Safe, with backup + rollback)
# ==============================================================================

upgrade: ## Safe upgrade dev environment (backup + build + health check)
	@./scripts/safe-upgrade.sh --env dev

upgrade-staging: ## Safe upgrade staging (mandatory backup + build + health check + auto-rollback)
	@./scripts/safe-upgrade.sh --env staging

# ==============================================================================
# ROLLBACK
# ==============================================================================

rollback: ## Rollback dev to latest backup
	@./scripts/rollback.sh --latest --env dev

rollback-staging: ## Rollback staging to latest backup
	@./scripts/rollback.sh --latest --env staging

rollback-list: ## List available rollback points
	@./scripts/rollback.sh --list --env dev
	@echo ""
	@./scripts/rollback.sh --list --env staging

# ==============================================================================
# HEALTH CHECKS
# ==============================================================================

health: ## Check health of all dev services
	@echo "$(BLUE)=== Dev Environment Health ===$(NC)"
	@echo ""
	@for svc in postgres neo4j valkey kafka keycloak auth-facade tenant-service user-service license-service notification-service audit-service ai-service api-gateway frontend; do \
		CONTAINER=$$(docker compose -p ems-dev -f docker-compose.dev.yml --env-file .env.dev ps -q $$svc 2>/dev/null); \
		if [ -z "$$CONTAINER" ]; then \
			printf "  %-25s $(RED)NOT RUNNING$(NC)\n" "$$svc"; \
		else \
			STATUS=$$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' $$CONTAINER 2>/dev/null); \
			case "$$STATUS" in \
				healthy) printf "  %-25s $(GREEN)$$STATUS$(NC)\n" "$$svc" ;; \
				running) printf "  %-25s $(GREEN)$$STATUS$(NC)\n" "$$svc" ;; \
				*)       printf "  %-25s $(RED)$$STATUS$(NC)\n" "$$svc" ;; \
			esac; \
		fi; \
	done
	@echo ""

health-staging: ## Check health of all staging services
	@echo "$(BLUE)=== Staging Environment Health ===$(NC)"
	@echo ""
	@for svc in postgres neo4j valkey kafka keycloak auth-facade tenant-service user-service license-service notification-service audit-service ai-service api-gateway frontend; do \
		CONTAINER=$$(docker compose -p ems-stg -f docker-compose.staging.yml --env-file .env.staging ps -q $$svc 2>/dev/null); \
		if [ -z "$$CONTAINER" ]; then \
			printf "  %-25s $(RED)NOT RUNNING$(NC)\n" "$$svc"; \
		else \
			STATUS=$$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' $$CONTAINER 2>/dev/null); \
			case "$$STATUS" in \
				healthy) printf "  %-25s $(GREEN)$$STATUS$(NC)\n" "$$svc" ;; \
				running) printf "  %-25s $(GREEN)$$STATUS$(NC)\n" "$$svc" ;; \
				*)       printf "  %-25s $(RED)$$STATUS$(NC)\n" "$$svc" ;; \
			esac; \
		fi; \
	done
	@echo ""

# ==============================================================================
# LOGS
# ==============================================================================

logs: ## Tail all dev logs (Ctrl+C to stop)
	@docker compose -p ems-dev -f docker-compose.dev.yml --env-file .env.dev logs -f --tail=50

logs-staging: ## Tail all staging logs (Ctrl+C to stop)
	@docker compose -p ems-stg -f docker-compose.staging.yml --env-file .env.staging logs -f --tail=50

# ==============================================================================
# STATUS
# ==============================================================================

ps: ## Show running dev containers
	@docker compose -p ems-dev -f docker-compose.dev.yml --env-file .env.dev ps

ps-staging: ## Show running staging containers
	@docker compose -p ems-stg -f docker-compose.staging.yml --env-file .env.staging ps

# ==============================================================================
# CLEANUP
# ==============================================================================

clean-images: ## Remove dangling Docker images (safe, no data loss)
	@echo "Removing dangling images..."
	@docker image prune -f
	@echo "$(GREEN)[OK]$(NC)  Dangling images removed."
