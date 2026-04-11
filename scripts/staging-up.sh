#!/usr/bin/env bash
# ==============================================================================
# EMSIST Staging Environment - Startup Script (Tier-Split)
#
# Two-phase startup: data tier first, then app tier.
# This ensures data services are healthy before applications start.
#
# Usage:
#   ./scripts/staging-up.sh          # Start all services (data tier, then app tier)
#   ./scripts/staging-up.sh --build  # Force rebuild all images
#   ./scripts/staging-up.sh --down   # Tear down the environment safely
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
COMPOSE_WRAPPER="$PROJECT_ROOT/docker-compose.staging.yml"
COMPOSE_DATA="$PROJECT_ROOT/docker-compose.staging-data.yml"
COMPOSE_APP="$PROJECT_ROOT/docker-compose.staging-app.yml"
ENV_FILE="$PROJECT_ROOT/.env.staging"
PROJECT_NAME="ems-stg"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info()  { echo -e "${BLUE}[INFO]${NC}  $1"; }
log_ok()    { echo -e "${GREEN}[OK]${NC}    $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ---------- Handle --down flag ----------
if [[ "${1:-}" == "--down" ]]; then
    log_error "============================================"
    log_error "  STAGING DATA DESTRUCTION BLOCKED"
    log_error "============================================"
    log_error ""
    log_error "  'docker compose down -v' is FORBIDDEN in staging."
    log_error "  Staging data must NEVER be destroyed casually."
    log_error ""
    log_error "  Safe alternatives:"
    log_error "    docker compose down      (stop only, keep data)"
    log_error "    ./scripts/staging-up.sh   (restart services)"
    log_error ""
    log_error "  If you truly need to reset staging data:"
    log_error "    1. ./scripts/backup-databases.sh --env staging"
    log_error "    2. docker compose -p ems-stg -f $COMPOSE_DATA --env-file $ENV_FILE down -v"
    log_error "============================================"
    echo ""

    # Phase 1: Stop app tier first (safe -- data volumes untouched)
    log_info "Stopping app tier (preserving data volumes)..."
    docker compose -p "$PROJECT_NAME" -f "$COMPOSE_APP" --env-file "$ENV_FILE" down --remove-orphans 2>/dev/null || true
    log_ok "App tier stopped."

    # Phase 2: Stop data tier (volumes preserved, no -v flag)
    log_info "Stopping data tier (preserving data volumes)..."
    docker compose -p "$PROJECT_NAME" -f "$COMPOSE_DATA" --env-file "$ENV_FILE" down --remove-orphans
    log_ok "Staging environment stopped. Data volumes preserved."
    exit 0
fi

# ---------- Pre-flight checks ----------
log_info "Running pre-flight checks..."

# Check Docker
if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed or not in PATH."
    exit 1
fi
log_ok "Docker found: $(docker --version)"

# Check Docker Compose V2
if ! docker compose version &> /dev/null; then
    log_error "Docker Compose V2 is required. Install via 'docker compose' plugin."
    exit 1
fi
log_ok "Docker Compose found: $(docker compose version --short)"

# Check .env.staging exists
if [[ ! -f "$ENV_FILE" ]]; then
    log_error ".env.staging not found at: $ENV_FILE"
    log_info "Copy the template and customize:"
    log_info "  cp .env.staging.example .env.staging"
    exit 1
fi
log_ok ".env.staging found"

# Check compose files exist
if [[ ! -f "$COMPOSE_DATA" ]]; then
    log_error "docker-compose.staging-data.yml not found at: $COMPOSE_DATA"
    exit 1
fi
log_ok "docker-compose.staging-data.yml found"

if [[ ! -f "$COMPOSE_APP" ]]; then
    log_error "docker-compose.staging-app.yml not found at: $COMPOSE_APP"
    exit 1
fi
log_ok "docker-compose.staging-app.yml found"

# Check init-db.sh exists
if [[ ! -f "$PROJECT_ROOT/infrastructure/docker/init-db.sh" ]]; then
    log_warn "infrastructure/docker/init-db.sh not found. Database init may fail."
fi

# Check keycloak-init.sh exists
if [[ ! -f "$PROJECT_ROOT/infrastructure/keycloak/keycloak-init.sh" ]]; then
    log_warn "infrastructure/keycloak/keycloak-init.sh not found. Keycloak bootstrap may fail."
fi

# ---------- Mandatory backup before rebuild (staging) ----------
if [[ "${1:-}" == "--build" ]]; then
    log_warn "============================================"
    log_warn "  MANDATORY PRE-UPGRADE BACKUP"
    log_warn "============================================"
    log_warn "  Rebuilding staging requires a backup first."
    log_warn "  This protects against data loss during upgrades."
    log_warn "============================================"
    echo ""

    # Check if data volumes exist (i.e., not a first run)
    if docker volume inspect "${PROJECT_NAME}_staging_postgres_data" &>/dev/null; then
        # Check if postgres is running (try data tier compose)
        PG_CONTAINER=$(docker compose -p "$PROJECT_NAME" -f "$COMPOSE_DATA" --env-file "$ENV_FILE" ps -q postgres 2>/dev/null || true)
        if [[ -n "$PG_CONTAINER" ]]; then
            log_info "Running pre-upgrade backup..."
            if "$SCRIPT_DIR/backup-databases.sh" --env staging; then
                log_ok "Backup completed successfully"
            else
                log_error "Backup FAILED. Aborting upgrade."
                log_error "Fix the backup issue or use ./scripts/safe-upgrade.sh for guided upgrade."
                exit 1
            fi
        else
            log_warn "PostgreSQL is not running. Starting data tier for backup..."
            docker compose -p "$PROJECT_NAME" -f "$COMPOSE_DATA" --env-file "$ENV_FILE" up -d

            # Wait for PostgreSQL
            MAX_WAIT=60
            ELAPSED=0
            while [[ $ELAPSED -lt $MAX_WAIT ]]; do
                PG_CONTAINER=$(docker compose -p "$PROJECT_NAME" -f "$COMPOSE_DATA" --env-file "$ENV_FILE" ps -q postgres 2>/dev/null || true)
                if [[ -n "$PG_CONTAINER" ]]; then
                    PG_STATUS=$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$PG_CONTAINER" 2>/dev/null || echo "starting")
                    if [[ "$PG_STATUS" == "healthy" ]]; then
                        break
                    fi
                fi
                sleep 5
                ELAPSED=$((ELAPSED + 5))
            done

            log_info "Running pre-upgrade backup..."
            if "$SCRIPT_DIR/backup-databases.sh" --env staging; then
                log_ok "Backup completed successfully"
            else
                log_error "Backup FAILED. Aborting upgrade."
                exit 1
            fi
        fi
    else
        log_info "No existing data volumes found (first run). Skipping backup."
    fi

    echo ""
fi

# ---------- Phase 1: Start data tier ----------
echo ""
log_info "============================================"
log_info "  EMSIST Staging Environment"
log_info "  Phase 1: Starting data tier..."
log_info "============================================"
echo ""

docker compose -p "$PROJECT_NAME" -f "$COMPOSE_DATA" --env-file "$ENV_FILE" up -d

# Wait for data tier health checks
log_info "Waiting for data tier services to become healthy..."

DATA_SERVICES=(
    "postgres:PostgreSQL"
    "neo4j:Neo4j"
    "valkey:Valkey"
    "kafka:Kafka"
)

get_container_id() {
    local compose_file="$1"
    local service="$2"
    docker compose -p "$PROJECT_NAME" -f "$compose_file" --env-file "$ENV_FILE" ps -q "$service" 2>/dev/null || true
}

get_service_status() {
    local compose_file="$1"
    local service="$2"
    local container_id
    container_id=$(get_container_id "$compose_file" "$service")
    if [[ -z "$container_id" ]]; then
        echo "not_found"
        return
    fi
    docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$container_id" 2>/dev/null || echo "not_found"
}

is_ok_status() {
    local status="$1"
    [[ "$status" == "healthy" || "$status" == "running" ]]
}

MAX_WAIT=180  # 3 minutes for data tier
ELAPSED=0
INTERVAL=10

while [[ $ELAPSED -lt $MAX_WAIT ]]; do
    ALL_HEALTHY=true
    for entry in "${DATA_SERVICES[@]}"; do
        SERVICE="${entry%%:*}"
        STATUS=$(get_service_status "$COMPOSE_DATA" "$SERVICE")
        if ! is_ok_status "$STATUS"; then
            ALL_HEALTHY=false
            break
        fi
    done

    if $ALL_HEALTHY; then
        break
    fi

    sleep $INTERVAL
    ELAPSED=$((ELAPSED + INTERVAL))
    log_info "Waiting for data tier... ($ELAPSED/$MAX_WAIT seconds)"
done

# Verify data tier is healthy before starting app tier
DATA_HEALTHY=true
for entry in "${DATA_SERVICES[@]}"; do
    SERVICE="${entry%%:*}"
    STATUS=$(get_service_status "$COMPOSE_DATA" "$SERVICE")
    if ! is_ok_status "$STATUS"; then
        DATA_HEALTHY=false
        log_error "$SERVICE is $STATUS"
    fi
done

if [[ "$DATA_HEALTHY" != "true" ]]; then
    log_error "Data tier is NOT healthy. Cannot start app tier."
    log_error "Check logs: docker compose -p $PROJECT_NAME -f $COMPOSE_DATA logs -f"
    exit 1
fi
log_ok "Data tier is healthy!"

# ---------- Phase 2: Start app tier ----------
echo ""
log_info "============================================"
log_info "  Phase 2: Starting app tier..."
log_info "============================================"
echo ""

BUILD_FLAG=""
if [[ "${1:-}" == "--build" ]]; then
    BUILD_FLAG="--build"
    log_info "Force rebuilding all images..."
fi

docker compose -p "$PROJECT_NAME" -f "$COMPOSE_APP" --env-file "$ENV_FILE" up $BUILD_FLAG -d

# ---------- Wait for app tier health checks ----------
echo ""
log_info "Waiting for app tier services to become healthy..."
echo ""

APP_SERVICES=(
    "keycloak:Keycloak"
    "mailhog:MailHog"
    "auth-facade:Auth Facade"
    "tenant-service:Tenant Service"
    "user-service:User Service"
    "license-service:License Service"
    "notification-service:Notification Service"
    "audit-service:Audit Service"
    "ai-service:AI Service"
    "api-gateway:API Gateway"
    "frontend:Frontend"
)

MAX_WAIT=300  # 5 minutes for app tier
ELAPSED=0

while [[ $ELAPSED -lt $MAX_WAIT ]]; do
    ALL_HEALTHY=true
    for entry in "${APP_SERVICES[@]}"; do
        SERVICE="${entry%%:*}"
        STATUS=$(get_service_status "$COMPOSE_APP" "$SERVICE")
        if ! is_ok_status "$STATUS"; then
            ALL_HEALTHY=false
            break
        fi
    done

    if $ALL_HEALTHY; then
        break
    fi

    sleep $INTERVAL
    ELAPSED=$((ELAPSED + INTERVAL))
    log_info "Waiting for app tier... ($ELAPSED/$MAX_WAIT seconds)"
done

# ---------- Print status ----------
echo ""
log_info "============================================"
log_info "  Service Status"
log_info "============================================"
echo ""

ALL_SERVICES=("${DATA_SERVICES[@]}" "${APP_SERVICES[@]}")

printf "%-30s %-15s %-10s\n" "SERVICE" "STATUS" "PORT"
printf "%-30s %-15s %-10s\n" "-------" "------" "----"

for entry in "${ALL_SERVICES[@]}"; do
    SERVICE="${entry%%:*}"
    NAME="${entry##*:}"

    # Try data tier first, then app tier
    CONTAINER_ID=$(get_container_id "$COMPOSE_DATA" "$SERVICE")
    if [[ -z "$CONTAINER_ID" ]]; then
        CONTAINER_ID=$(get_container_id "$COMPOSE_APP" "$SERVICE")
    fi

    if [[ -z "$CONTAINER_ID" ]]; then
        printf "%-30s %-25b %-10s\n" "$NAME" "${RED}not_found${NC}" "-"
        continue
    fi

    STATUS=$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$CONTAINER_ID" 2>/dev/null || echo "unknown")
    PORT=$(docker port "$CONTAINER_ID" 2>/dev/null | head -1 | awk -F: '{print $NF}' || echo "-")

    case "$STATUS" in
        healthy)   STATUS_COLOR="${GREEN}healthy${NC}" ;;
        running)   STATUS_COLOR="${GREEN}running${NC}" ;;
        unhealthy) STATUS_COLOR="${RED}unhealthy${NC}" ;;
        starting)  STATUS_COLOR="${YELLOW}starting${NC}" ;;
        *)         STATUS_COLOR="${RED}$STATUS${NC}" ;;
    esac

    printf "%-30s %-25b %-10s\n" "$NAME" "$STATUS_COLOR" "$PORT"
done

echo ""

# ---------- Final summary ----------
UNHEALTHY_COUNT=0
for entry in "${ALL_SERVICES[@]}"; do
    SERVICE="${entry%%:*}"

    # Try data tier first, then app tier
    STATUS=$(get_service_status "$COMPOSE_DATA" "$SERVICE")
    if [[ "$STATUS" == "not_found" ]]; then
        STATUS=$(get_service_status "$COMPOSE_APP" "$SERVICE")
    fi

    if ! is_ok_status "$STATUS"; then
        UNHEALTHY_COUNT=$((UNHEALTHY_COUNT + 1))
    fi
done

if [[ $UNHEALTHY_COUNT -eq 0 ]]; then
    log_ok "All services are healthy!"
    echo ""
    log_info "============================================"
    log_info "  Access Points"
    log_info "============================================"
    echo ""
    log_info "Frontend:     http://localhost:4200"
    log_info "API Gateway:  http://localhost:8080"
    log_info "Keycloak:     http://localhost:8180"
    log_info "Neo4j:        http://localhost:7474"
    log_info "MailHog UI:   http://localhost:8025"
    echo ""

    # Attempt to open browser (macOS)
    if command -v open &> /dev/null; then
        log_info "Opening frontend in browser..."
        open "http://localhost:4200"
    fi
else
    log_warn "$UNHEALTHY_COUNT service(s) are not healthy yet."
    log_info "Check data tier logs: docker compose -p $PROJECT_NAME -f $COMPOSE_DATA logs -f"
    log_info "Check app tier logs:  docker compose -p $PROJECT_NAME -f $COMPOSE_APP logs -f"
fi

echo ""
log_info "To stop:    ./scripts/staging-up.sh --down"
log_info "To rebuild: ./scripts/staging-up.sh --build"
log_info "Data logs:  docker compose -p $PROJECT_NAME -f $COMPOSE_DATA logs -f"
log_info "App logs:   docker compose -p $PROJECT_NAME -f $COMPOSE_APP logs -f"
echo ""
