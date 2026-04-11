#!/usr/bin/env bash
# ==============================================================================
# EMSIST Development Environment - Startup Script (4-Stack)
#
# Startup order:
#   1) postgres stack
#   2) neo4j stack
#   3) keycloak stack
#   4) services stack
#
# Usage:
#   ./scripts/dev-up.sh          # Start all stacks in the correct order
#   ./scripts/dev-up.sh --build  # Force rebuild all images
#   ./scripts/dev-up.sh --down   # Tear down the environment safely
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
COMPOSE_WRAPPER="$PROJECT_ROOT/docker-compose.dev.yml"
COMPOSE_POSTGRES="$PROJECT_ROOT/docker-compose.dev-postgres.yml"
COMPOSE_NEO4J="$PROJECT_ROOT/docker-compose.dev-neo4j.yml"
COMPOSE_KEYCLOAK="$PROJECT_ROOT/docker-compose.dev-keycloak.yml"
COMPOSE_SERVICES="$PROJECT_ROOT/docker-compose.dev-services.yml"
ENV_FILE="$PROJECT_ROOT/.env.dev"

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

dc() {
    local compose_file="$1"
    shift
    docker compose -f "$compose_file" --env-file "$ENV_FILE" "$@"
}

get_container_id() {
    local compose_file="$1"
    local service="$2"
    dc "$compose_file" ps -q "$service" 2>/dev/null || true
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

    docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$container_id" 2>/dev/null || echo "unknown"
}

is_ok_status() {
    local status="$1"
    [[ "$status" == "healthy" || "$status" == "running" ]]
}

wait_for_services() {
    local label="$1"
    local compose_file="$2"
    local max_wait="$3"
    shift 3
    local services=("$@")
    local elapsed=0
    local interval=10

    while [[ $elapsed -lt $max_wait ]]; do
        local all_ok=true

        for entry in "${services[@]}"; do
            local service="${entry%%:*}"
            local status
            status=$(get_service_status "$compose_file" "$service")
            if ! is_ok_status "$status"; then
                all_ok=false
                break
            fi
        done

        if [[ "$all_ok" == "true" ]]; then
            log_ok "$label is ready."
            return 0
        fi

        sleep "$interval"
        elapsed=$((elapsed + interval))
        log_info "Waiting for $label... ($elapsed/$max_wait seconds)"
    done

    log_error "$label did not become ready in time."
    return 1
}

wait_for_keycloak_init() {
    local max_wait="$1"
    local elapsed=0
    local interval=2
    local container_id

    container_id=$(dc "$COMPOSE_KEYCLOAK" ps -a -q "keycloak-init" 2>/dev/null || true)
    if [[ -z "$container_id" ]]; then
        log_error "keycloak-init container not found."
        return 1
    fi

    while [[ $elapsed -lt $max_wait ]]; do
        local status
        status=$(docker inspect --format='{{.State.Status}}' "$container_id" 2>/dev/null || echo "not_found")

        if [[ "$status" == "exited" ]]; then
            local exit_code
            exit_code=$(docker inspect --format='{{.State.ExitCode}}' "$container_id" 2>/dev/null || echo "1")
            if [[ "$exit_code" == "0" ]]; then
                log_ok "keycloak-init completed successfully."
                return 0
            fi

            log_error "keycloak-init exited with code $exit_code."
            return 1
        fi

        sleep "$interval"
        elapsed=$((elapsed + interval))
        if (( elapsed % 10 == 0 )); then
            log_info "Waiting for keycloak-init... ($elapsed/$max_wait seconds)"
        fi
    done

    log_error "keycloak-init did not finish in time."
    return 1
}

find_container_across_stacks() {
    local service="$1"
    local compose_file

    for compose_file in "$COMPOSE_POSTGRES" "$COMPOSE_NEO4J" "$COMPOSE_KEYCLOAK" "$COMPOSE_SERVICES"; do
        local container_id
        container_id=$(get_container_id "$compose_file" "$service")
        if [[ -n "$container_id" ]]; then
            echo "$container_id|$compose_file"
            return
        fi
    done

    echo "|"
}

# ---------- Handle --down flag ----------
if [[ "${1:-}" == "--down" ]]; then
    log_warn "============================================"
    log_warn "  SAFE SHUTDOWN"
    log_warn "============================================"
    log_warn ""
    log_warn "  Stopping stack 4 -> 3 -> 2 first."
    log_warn ""
    log_warn "============================================"
    echo ""

    log_info "Stopping stack 4/4: services..."
    dc "$COMPOSE_SERVICES" down --remove-orphans 2>/dev/null || true
    log_ok "Services stack stopped."

    log_info "Stopping stack 3/4: keycloak..."
    dc "$COMPOSE_KEYCLOAK" down --remove-orphans 2>/dev/null || true
    log_ok "Keycloak stack stopped."

    log_info "Stopping stack 2/4: neo4j..."
    dc "$COMPOSE_NEO4J" down --remove-orphans 2>/dev/null || true
    log_ok "Neo4j stack stopped."

    echo ""
    read -p "Also stop stack 1/4 (postgres, valkey, kafka, backup-cron)? Data volumes will be PRESERVED. [y/N]: " STOP_DATA
    if [[ "$STOP_DATA" =~ ^[Yy]$ ]]; then
        log_info "Stopping stack 1/4 (volumes preserved)..."
        dc "$COMPOSE_POSTGRES" down --remove-orphans
        log_ok "Postgres stack stopped. Data volumes preserved."
    else
        log_ok "Postgres stack left running."
    fi

    echo ""
    log_warn "============================================"
    log_warn "  DATA DESTRUCTION (optional)"
    log_warn "============================================"
    log_warn "  To destroy ALL data volumes (irreversible):"
    log_warn "    docker compose -f $COMPOSE_POSTGRES --env-file $ENV_FILE down -v"
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
if [[ ! -f "$COMPOSE_POSTGRES" ]]; then
    log_error "docker-compose.dev-postgres.yml not found at: $COMPOSE_POSTGRES"
    exit 1
fi
log_ok "docker-compose.dev-postgres.yml found"

if [[ ! -f "$COMPOSE_NEO4J" ]]; then
    log_error "docker-compose.dev-neo4j.yml not found at: $COMPOSE_NEO4J"
    exit 1
fi
log_ok "docker-compose.dev-neo4j.yml found"

if [[ ! -f "$COMPOSE_KEYCLOAK" ]]; then
    log_error "docker-compose.dev-keycloak.yml not found at: $COMPOSE_KEYCLOAK"
    exit 1
fi
log_ok "docker-compose.dev-keycloak.yml found"

if [[ ! -f "$COMPOSE_SERVICES" ]]; then
    log_error "docker-compose.dev-services.yml not found at: $COMPOSE_SERVICES"
    exit 1
fi
log_ok "docker-compose.dev-services.yml found"

if [[ ! -f "$COMPOSE_WRAPPER" ]]; then
    log_warn "docker-compose.dev.yml wrapper not found at: $COMPOSE_WRAPPER"
fi

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
for vol in emsist-dev_postgres_data emsist-dev_neo4j_data emsist-dev_valkey_data; do
    if ! docker volume inspect "$vol" &>/dev/null; then
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

# ---------- Phase 1: Start postgres stack ----------
echo ""
log_info "============================================"
log_info "  EMSIST Development Environment"
log_info "  Phase 1: Starting postgres stack..."
log_info "============================================"
echo ""

dc "$COMPOSE_POSTGRES" up -d

# Wait for postgres stack health checks
log_info "Waiting for postgres stack services to become healthy..."

POSTGRES_SERVICES=(
    "postgres:PostgreSQL"
    "valkey:Valkey"
    "kafka:Kafka"
    "backup-cron:Backup Cron"
)

if ! wait_for_services "postgres stack" "$COMPOSE_POSTGRES" 180 "${POSTGRES_SERVICES[@]}"; then
    log_error "Postgres stack is not ready. Cannot continue."
    log_error "Check logs: docker compose -f $COMPOSE_POSTGRES --env-file $ENV_FILE logs -f"
    exit 1
fi

# ---------- Phases 2 and 3: Start neo4j + keycloak stacks ----------
echo ""
log_info "============================================"
log_info "  Phase 2: Starting neo4j stack..."
log_info "  Phase 3: Starting keycloak stack..."
log_info "============================================"
echo ""

dc "$COMPOSE_NEO4J" up -d
dc "$COMPOSE_KEYCLOAK" up -d

NEO4J_SERVICES=(
    "neo4j:Neo4j"
)

KEYCLOAK_SERVICES=(
    "keycloak:Keycloak"
)

if ! wait_for_services "neo4j stack" "$COMPOSE_NEO4J" 180 "${NEO4J_SERVICES[@]}"; then
    log_error "Neo4j stack is not ready."
    log_error "Check logs: docker compose -f $COMPOSE_NEO4J --env-file $ENV_FILE logs -f"
    exit 1
fi

if ! wait_for_services "keycloak stack" "$COMPOSE_KEYCLOAK" 240 "${KEYCLOAK_SERVICES[@]}"; then
    log_error "Keycloak stack is not ready."
    log_error "Check logs: docker compose -f $COMPOSE_KEYCLOAK --env-file $ENV_FILE logs -f"
    exit 1
fi

if ! wait_for_keycloak_init 180; then
    log_error "Keycloak bootstrap did not complete successfully."
    log_error "Check logs: docker compose -f $COMPOSE_KEYCLOAK --env-file $ENV_FILE logs keycloak-init"
    exit 1
fi

# ---------- Phase 4: Start services stack ----------
echo ""
log_info "============================================"
log_info "  Phase 4: Starting services stack..."
log_info "============================================"
echo ""

BUILD_FLAG=""
if [[ "${1:-}" == "--build" ]]; then
    BUILD_FLAG="--build"
    log_info "Force rebuilding all images..."
fi

dc "$COMPOSE_SERVICES" up $BUILD_FLAG -d

# ---------- Wait for services stack health checks ----------
echo ""
log_info "Waiting for services stack to become healthy..."
echo ""

SERVICE_SERVICES=(
    "eureka:Eureka"
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

if ! wait_for_services "services stack" "$COMPOSE_SERVICES" 300 "${SERVICE_SERVICES[@]}"; then
    log_warn "Some services are still not healthy."
fi

# ---------- Print status ----------
echo ""
log_info "============================================"
log_info "  Service Status"
log_info "============================================"
echo ""

ALL_SERVICES=("${POSTGRES_SERVICES[@]}" "${NEO4J_SERVICES[@]}" "${KEYCLOAK_SERVICES[@]}" "${SERVICE_SERVICES[@]}")

printf "%-30s %-15s %-10s\n" "SERVICE" "STATUS" "PORT"
printf "%-30s %-15s %-10s\n" "-------" "------" "----"

for entry in "${ALL_SERVICES[@]}"; do
    SERVICE="${entry%%:*}"
    NAME="${entry##*:}"
    FOUND=$(find_container_across_stacks "$SERVICE")
    CONTAINER_ID="${FOUND%%|*}"

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
    STATUS="not_found"

    for compose_file in "$COMPOSE_POSTGRES" "$COMPOSE_NEO4J" "$COMPOSE_KEYCLOAK" "$COMPOSE_SERVICES"; do
        STATUS=$(get_service_status "$compose_file" "$SERVICE")
        if [[ "$STATUS" != "not_found" ]]; then
            break
        fi
    done

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
    log_info "Check postgres logs: docker compose -f $COMPOSE_POSTGRES --env-file $ENV_FILE logs -f"
    log_info "Check neo4j logs:    docker compose -f $COMPOSE_NEO4J --env-file $ENV_FILE logs -f"
    log_info "Check keycloak logs: docker compose -f $COMPOSE_KEYCLOAK --env-file $ENV_FILE logs -f"
    log_info "Check services logs: docker compose -f $COMPOSE_SERVICES --env-file $ENV_FILE logs -f"
fi

echo ""
log_info "To stop:    ./scripts/dev-up.sh --down"
log_info "To rebuild: ./scripts/dev-up.sh --build"
log_info "Combined ps: docker compose -f $COMPOSE_WRAPPER --env-file $ENV_FILE ps"
log_info "Combined logs: docker compose -f $COMPOSE_WRAPPER --env-file $ENV_FILE logs -f"
echo ""
