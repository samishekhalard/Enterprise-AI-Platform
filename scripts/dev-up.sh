#!/usr/bin/env bash
# ==============================================================================
# EMSIST Development Environment - Startup Script (Tier-Split)
#
# Two-phase startup: data tier first, then app tier.
# This ensures data services are healthy before applications start.
#
# Usage:
#   ./scripts/dev-up.sh          # Start all services (data tier, then app tier)
#   ./scripts/dev-up.sh --build  # Force rebuild all images
#   ./scripts/dev-up.sh --down   # Tear down the environment safely
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
COMPOSE_WRAPPER="$PROJECT_ROOT/docker-compose.dev.yml"
COMPOSE_DATA="$PROJECT_ROOT/docker-compose.dev-data.yml"
COMPOSE_APP="$PROJECT_ROOT/docker-compose.dev-app.yml"
ENV_FILE="$PROJECT_ROOT/.env.dev"
PROJECT_NAME="ems-dev"

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
    log_warn "============================================"
    log_warn "  SAFE SHUTDOWN"
    log_warn "============================================"
    log_warn ""
    log_warn "  Stopping app tier first (data tier stays running)."
    log_warn ""
    log_warn "============================================"
    echo ""

    # Phase 1: Stop app tier (safe -- data volumes untouched)
    log_info "Stopping app tier..."
    docker compose -p "$PROJECT_NAME" -f "$COMPOSE_APP" --env-file "$ENV_FILE" down --remove-orphans 2>/dev/null || true
    log_ok "App tier stopped."

    echo ""
    read -p "Also stop data tier? (Data volumes will be PRESERVED.) [y/N]: " STOP_DATA
    if [[ "$STOP_DATA" =~ ^[Yy]$ ]]; then
        log_info "Stopping data tier (volumes preserved)..."
        docker compose -p "$PROJECT_NAME" -f "$COMPOSE_DATA" --env-file "$ENV_FILE" down --remove-orphans
        log_ok "Data tier stopped. Data volumes preserved."
    else
        log_ok "Data tier left running."
    fi

    echo ""
    log_warn "============================================"
    log_warn "  DATA DESTRUCTION (optional)"
    log_warn "============================================"
    log_warn "  To destroy ALL data volumes (irreversible):"
    log_warn "    docker compose -p $PROJECT_NAME -f $COMPOSE_DATA --env-file $ENV_FILE down -v"
    log_warn "============================================"
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

# Check .env.dev exists
if [[ ! -f "$ENV_FILE" ]]; then
    log_error ".env.dev not found at: $ENV_FILE"
    log_info "Copy the template and customize:"
    log_info "  cp .env.dev.example .env.dev"
    exit 1
fi
log_ok ".env.dev found"

# Check compose files exist
if [[ ! -f "$COMPOSE_DATA" ]]; then
    log_error "docker-compose.dev-data.yml not found at: $COMPOSE_DATA"
    exit 1
fi
log_ok "docker-compose.dev-data.yml found"

if [[ ! -f "$COMPOSE_APP" ]]; then
    log_error "docker-compose.dev-app.yml not found at: $COMPOSE_APP"
    exit 1
fi
log_ok "docker-compose.dev-app.yml found"

# Check init-db.sh exists
if [[ ! -f "$PROJECT_ROOT/infrastructure/docker/init-db.sh" ]]; then
    log_warn "infrastructure/docker/init-db.sh not found. Database init may fail."
fi

# Check keycloak-init.sh exists
if [[ ! -f "$PROJECT_ROOT/infrastructure/keycloak/keycloak-init.sh" ]]; then
    log_warn "infrastructure/keycloak/keycloak-init.sh not found. Keycloak bootstrap may fail."
fi

# ---------- Volume existence check (first run vs upgrade) ----------
VOLUMES_EXIST=true
for vol in dev_postgres_data dev_neo4j_data dev_valkey_data; do
    FULL_VOL="${PROJECT_NAME}_${vol}"
    if ! docker volume inspect "$FULL_VOL" &>/dev/null; then
        VOLUMES_EXIST=false
        break
    fi
done

if [[ "$VOLUMES_EXIST" == "false" ]]; then
    log_warn "============================================"
    log_warn "  FIRST RUN DETECTED"
    log_warn "============================================"
    log_warn "  Data volumes do not exist yet."
    log_warn "  init-db.sh will create databases."
    log_warn "  Keycloak will be bootstrapped."
    log_warn "============================================"
    echo ""
else
    log_ok "Existing data volumes found (data will be preserved)"

    # If rebuilding, offer to backup first
    if [[ "${1:-}" == "--build" ]]; then
        log_warn "Rebuild requested with existing data."
        log_info "Consider backing up first: ./scripts/backup-databases.sh --env dev"
        echo ""
    fi
fi

# ---------- Phase 1: Start data tier ----------
echo ""
log_info "============================================"
log_info "  EMSIST Development Environment"
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
    COMPOSE_REF="$COMPOSE_DATA"
    if [[ -z "$CONTAINER_ID" ]]; then
        CONTAINER_ID=$(get_container_id "$COMPOSE_APP" "$SERVICE")
        COMPOSE_REF="$COMPOSE_APP"
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
    log_info "Frontend:     http://localhost:24200"
    log_info "API Gateway:  http://localhost:28080"
    log_info "Keycloak:     http://localhost:28180"
    log_info "Neo4j:        http://localhost:27474"
    log_info "MailHog UI:   http://localhost:28025"
    echo ""

    # Attempt to open browser (macOS)
    if command -v open &> /dev/null; then
        log_info "Opening frontend in browser..."
        open "http://localhost:24200"
    fi
else
    log_warn "$UNHEALTHY_COUNT service(s) are not healthy yet."
    log_info "Check data tier logs: docker compose -p $PROJECT_NAME -f $COMPOSE_DATA logs -f"
    log_info "Check app tier logs:  docker compose -p $PROJECT_NAME -f $COMPOSE_APP logs -f"
fi

echo ""
log_info "To stop:    ./scripts/dev-up.sh --down"
log_info "To rebuild: ./scripts/dev-up.sh --build"
log_info "Data logs:  docker compose -p $PROJECT_NAME -f $COMPOSE_DATA logs -f"
log_info "App logs:   docker compose -p $PROJECT_NAME -f $COMPOSE_APP logs -f"
echo ""
