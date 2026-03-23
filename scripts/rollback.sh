#!/usr/bin/env bash
# ==============================================================================
# EMSIST Rollback Script
#
# Restores the environment from the most recent backup after a failed upgrade.
#
# Usage:
#   ./scripts/rollback.sh --latest --env dev       # Rollback to latest backup
#   ./scripts/rollback.sh --backup <dir> --env dev  # Rollback to specific backup
#   ./scripts/rollback.sh --list --env dev          # List available backups
#
# This script:
#   1. Stops all application services
#   2. Restores databases from backup
#   3. Restarts all services
#   4. Verifies health
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

log_info()  { echo -e "${BLUE}[INFO]${NC}  $1"; }
log_ok()    { echo -e "${GREEN}[OK]${NC}    $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ---------- Parse arguments ----------
ENV="dev"
BACKUP_DIR=""
USE_LATEST=false
LIST_BACKUPS=false
AUTO_CONFIRM=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        --env)
            ENV="$2"
            shift 2
            ;;
        --backup)
            BACKUP_DIR="$2"
            shift 2
            ;;
        --latest)
            USE_LATEST=true
            shift
            ;;
        --list)
            LIST_BACKUPS=true
            shift
            ;;
        --auto-confirm)
            AUTO_CONFIRM=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 --latest [--env dev|staging]"
            echo "       $0 --backup <dir> [--env dev|staging]"
            echo "       $0 --list [--env dev|staging]"
            exit 0
            ;;
        *)
            log_error "Unknown argument: $1"
            exit 1
            ;;
    esac
done

# ---------- Resolve environment ----------
if [[ "$ENV" == "dev" ]]; then
    COMPOSE_FILE="$PROJECT_ROOT/docker-compose.dev.yml"
    ENV_FILE="$PROJECT_ROOT/.env.dev"
    PROJECT_NAME="ems-dev"
elif [[ "$ENV" == "staging" ]]; then
    COMPOSE_FILE="$PROJECT_ROOT/docker-compose.staging.yml"
    ENV_FILE="$PROJECT_ROOT/.env.staging"
    PROJECT_NAME="ems-stg"
else
    log_error "Unknown environment: $ENV"
    exit 1
fi

BACKUP_ROOT="$PROJECT_ROOT/backups"

# ---------- List backups ----------
if [[ "$LIST_BACKUPS" == "true" ]]; then
    echo ""
    log_info "Available backups for '$ENV':"
    echo ""

    if [[ ! -d "$BACKUP_ROOT" ]]; then
        log_warn "No backups directory found."
        exit 0
    fi

    FOUND=false
    for dir in $(ls -dt "$BACKUP_ROOT/${ENV}_"* 2>/dev/null); do
        FOUND=true
        SIZE=$(du -sh "$dir" | awk '{print $1}')
        META=""
        if [[ -f "$dir/metadata.json" ]]; then
            PG_COUNT=$(jq -r '.postgres.databases_backed_up // "?"' "$dir/metadata.json" 2>/dev/null || echo "?")
            META="(PostgreSQL: $PG_COUNT databases)"
        fi
        echo "  $(basename "$dir")  [$SIZE]  $META"
    done

    if [[ "$FOUND" == "false" ]]; then
        log_warn "No backups found for environment '$ENV'"
    fi

    echo ""
    exit 0
fi

# ---------- Find backup directory ----------
if [[ "$USE_LATEST" == "true" ]]; then
    BACKUP_DIR=$(ls -dt "$BACKUP_ROOT/${ENV}_"* 2>/dev/null | head -1 || true)
    if [[ -z "$BACKUP_DIR" ]]; then
        log_error "No backups found for environment '$ENV' in $BACKUP_ROOT"
        exit 1
    fi
fi

if [[ -z "$BACKUP_DIR" ]]; then
    log_error "No backup specified. Use --backup <dir>, --latest, or --list"
    exit 1
fi

if [[ ! -d "$BACKUP_DIR" ]]; then
    log_error "Backup directory does not exist: $BACKUP_DIR"
    exit 1
fi

# ---------- Confirmation ----------
echo ""
log_warn "============================================"
log_warn "  ROLLBACK: $ENV environment"
log_warn "============================================"
log_warn "  Backup: $(basename "$BACKUP_DIR")"
log_warn ""
log_warn "  This will:"
log_warn "  1. Stop all application services"
log_warn "  2. Restore databases from backup"
log_warn "  3. Restart all services"
log_warn "============================================"
echo ""

if [[ "$AUTO_CONFIRM" != "true" ]]; then
    read -p "Proceed with rollback? Type 'yes' to confirm: " CONFIRM
    if [[ "$CONFIRM" != "yes" ]]; then
        log_info "Rollback cancelled."
        exit 0
    fi
fi

# ---------- Step 1: Stop application services ----------
log_info "Step 1/3: Stopping application services..."

APP_SERVICES=(
    "frontend"
    "api-gateway"
    "auth-facade"
    "tenant-service"
    "user-service"
    "license-service"
    "notification-service"
    "audit-service"
    "ai-service"
    "keycloak-init"
)

for svc in "${APP_SERVICES[@]}"; do
    docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" --env-file "$ENV_FILE" stop "$svc" 2>/dev/null || true
done

log_ok "Application services stopped"

# ---------- Step 2: Restore databases ----------
log_info "Step 2/3: Restoring databases..."

# Call restore script with auto-confirm since we already confirmed above
"$SCRIPT_DIR/restore-databases.sh" --backup "$BACKUP_DIR" --env "$ENV" <<< "yes"

# ---------- Step 3: Restart services ----------
log_info "Step 3/3: Restarting all services..."

docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d

# Wait for health checks
MAX_WAIT=300
ELAPSED=0
INTERVAL=10

log_info "Waiting for services to become healthy..."

while [[ $ELAPSED -lt $MAX_WAIT ]]; do
    ALL_OK=true
    for svc in "postgres" "neo4j" "valkey" "keycloak" "api-gateway"; do
        CONTAINER_ID=$(docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps -q "$svc" 2>/dev/null || true)
        if [[ -z "$CONTAINER_ID" ]]; then
            ALL_OK=false
            break
        fi
        STATUS=$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$CONTAINER_ID" 2>/dev/null || echo "not_found")
        if [[ "$STATUS" != "healthy" && "$STATUS" != "running" ]]; then
            ALL_OK=false
            break
        fi
    done

    if [[ "$ALL_OK" == "true" ]]; then
        break
    fi

    sleep $INTERVAL
    ELAPSED=$((ELAPSED + INTERVAL))
done

# ---------- Summary ----------
echo ""
if [[ "$ALL_OK" == "true" ]]; then
    log_ok "============================================"
    log_ok "  Rollback Complete"
    log_ok "============================================"
    log_info "Environment: $ENV"
    log_info "Restored from: $(basename "$BACKUP_DIR")"
    log_info "Verify: docker compose -p $PROJECT_NAME -f $COMPOSE_FILE ps"
    echo ""
    exit 0
else
    log_error "============================================"
    log_error "  Rollback Incomplete"
    log_error "============================================"
    log_error "Some services may not be healthy."
    log_error "Check logs: docker compose -p $PROJECT_NAME -f $COMPOSE_FILE logs"
    echo ""
    exit 1
fi
