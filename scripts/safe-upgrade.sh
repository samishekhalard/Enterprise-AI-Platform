#!/usr/bin/env bash
# ==============================================================================
# EMSIST Safe Upgrade Script (Tier-Split)
#
# Wraps `docker compose up --build` with safety guards:
#   1. Pre-upgrade backup (calls scripts/backup-databases.sh)
#   2. Version comparison (detects if image tags changed)
#   3. Stop app tier only (data tier stays running throughout)
#   4. Rebuild and restart app tier
#   5. Post-upgrade health check
#   6. Automatic rollback if health check fails
#
# Usage:
#   ./scripts/safe-upgrade.sh                     # Upgrade dev environment
#   ./scripts/safe-upgrade.sh --env staging        # Upgrade staging
#   ./scripts/safe-upgrade.sh --skip-backup        # Skip backup (dev only)
#   ./scripts/safe-upgrade.sh --dry-run            # Show what would happen
#
# Exit codes:
#   0 = Upgrade successful
#   1 = Upgrade failed, rollback attempted
#   2 = Rollback also failed (manual intervention required)
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
log_step()  { echo -e "${BOLD}[STEP]${NC} $1"; }

# ---------- Parse arguments ----------
ENV="dev"
SKIP_BACKUP=false
DRY_RUN=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        --env)
            ENV="$2"
            shift 2
            ;;
        --skip-backup)
            SKIP_BACKUP=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [--env dev|staging] [--skip-backup] [--dry-run]"
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
    COMPOSE_DATA="$PROJECT_ROOT/docker-compose.dev-data.yml"
    COMPOSE_APP="$PROJECT_ROOT/docker-compose.dev-app.yml"
    ENV_FILE="$PROJECT_ROOT/.env.dev"
    PROJECT_NAME="ems-dev"
elif [[ "$ENV" == "staging" ]]; then
    COMPOSE_DATA="$PROJECT_ROOT/docker-compose.staging-data.yml"
    COMPOSE_APP="$PROJECT_ROOT/docker-compose.staging-app.yml"
    ENV_FILE="$PROJECT_ROOT/.env.staging"
    PROJECT_NAME="ems-stg"
    # Staging MUST have backup - never skip
    if [[ "$SKIP_BACKUP" == "true" ]]; then
        log_error "Cannot skip backup for staging environment. Backup is MANDATORY."
        exit 1
    fi
else
    log_error "Unknown environment: $ENV"
    exit 1
fi

if [[ ! -f "$COMPOSE_DATA" ]]; then
    log_error "Data tier compose file not found: $COMPOSE_DATA"
    exit 1
fi

if [[ ! -f "$COMPOSE_APP" ]]; then
    log_error "App tier compose file not found: $COMPOSE_APP"
    exit 1
fi

echo ""
log_info "============================================"
log_info "  EMSIST Safe Upgrade ($ENV)"
log_info "  Data tier stays running throughout."
log_info "============================================"
echo ""

# ---------- Step 1: Version comparison ----------
log_step "1/6 Detecting version changes..."

# Capture current image digests before upgrade
BEFORE_IMAGES_FILE=$(mktemp)
docker compose -p "$PROJECT_NAME" -f "$COMPOSE_APP" --env-file "$ENV_FILE" images --format json 2>/dev/null | jq -r '.[].ID // "none"' > "$BEFORE_IMAGES_FILE" 2>/dev/null || true

# Check for changes in compose file or Dockerfiles
COMPOSE_MODIFIED=false
if command -v git &>/dev/null && git -C "$PROJECT_ROOT" rev-parse --is-inside-work-tree &>/dev/null; then
    CHANGED_FILES=$(git -C "$PROJECT_ROOT" diff --name-only HEAD 2>/dev/null || true)

    if echo "$CHANGED_FILES" | grep -q "docker-compose"; then
        log_warn "Docker Compose files have been modified"
        COMPOSE_MODIFIED=true
    fi

    if echo "$CHANGED_FILES" | grep -q "Dockerfile"; then
        log_warn "One or more Dockerfiles have been modified"
        COMPOSE_MODIFIED=true
    fi

    if echo "$CHANGED_FILES" | grep -q "init-db.sh"; then
        log_warn "init-db.sh has been modified - existing databases will NOT be affected"
    fi
fi

if [[ "$COMPOSE_MODIFIED" == "true" ]]; then
    log_warn "Infrastructure changes detected. Backup is strongly recommended."
fi

# ---------- Step 2: Verify data tier is running ----------
log_step "2/6 Verifying data tier is running..."

if [[ "$DRY_RUN" == "true" ]]; then
    log_info "  [DRY RUN] Would verify data tier services are healthy"
else
    # Ensure data tier is up
    docker compose -p "$PROJECT_NAME" -f "$COMPOSE_DATA" --env-file "$ENV_FILE" up -d

    # Wait for data tier health
    DATA_SERVICES=("postgres" "neo4j" "valkey" "kafka")
    MAX_WAIT=120
    ELAPSED=0
    INTERVAL=10
    DATA_HEALTHY=false

    while [[ $ELAPSED -lt $MAX_WAIT ]]; do
        ALL_OK=true
        for svc in "${DATA_SERVICES[@]}"; do
            CONTAINER_ID=$(docker compose -p "$PROJECT_NAME" -f "$COMPOSE_DATA" --env-file "$ENV_FILE" ps -q "$svc" 2>/dev/null || true)
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
            DATA_HEALTHY=true
            break
        fi

        sleep $INTERVAL
        ELAPSED=$((ELAPSED + INTERVAL))
        log_info "  Waiting for data tier... ($ELAPSED/$MAX_WAIT seconds)"
    done

    if [[ "$DATA_HEALTHY" != "true" ]]; then
        log_error "Data tier is NOT healthy. Cannot proceed with upgrade."
        exit 1
    fi
    log_ok "Data tier is healthy"
fi

# ---------- Step 3: Pre-upgrade backup ----------
BACKUP_DIR=""

if [[ "$SKIP_BACKUP" == "false" ]]; then
    log_step "3/6 Creating pre-upgrade backup..."

    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "  [DRY RUN] Would run: $SCRIPT_DIR/backup-databases.sh --env $ENV"
    else
        # Capture the last line of output which is the backup directory path
        BACKUP_OUTPUT=$("$SCRIPT_DIR/backup-databases.sh" --env "$ENV" 2>&1)
        BACKUP_DIR=$(echo "$BACKUP_OUTPUT" | tail -1)

        if [[ -d "$BACKUP_DIR" ]]; then
            log_ok "Backup created: $BACKUP_DIR"
        else
            log_error "Backup failed. Aborting upgrade."
            exit 1
        fi
    fi
else
    log_warn "3/6 Skipping backup (--skip-backup flag). Data loss risk!"
fi

# ---------- Step 4: Stop and rebuild app tier only ----------
log_step "4/6 Stopping app tier (data tier stays running)..."

if [[ "$DRY_RUN" == "true" ]]; then
    log_info "  [DRY RUN] Would stop app tier and rebuild"
else
    # Stop app tier only -- data tier keeps running
    log_info "  Stopping app tier services..."
    docker compose -p "$PROJECT_NAME" -f "$COMPOSE_APP" --env-file "$ENV_FILE" down --remove-orphans 2>/dev/null || true

    log_info "  Rebuilding and starting app tier..."
    docker compose -p "$PROJECT_NAME" -f "$COMPOSE_APP" --env-file "$ENV_FILE" up --build -d
fi

# ---------- Step 5: Post-upgrade health check ----------
log_step "5/6 Running post-upgrade health checks..."

if [[ "$DRY_RUN" == "true" ]]; then
    log_info "  [DRY RUN] Would wait for health checks (up to 5 minutes)"
else
    HEALTH_SERVICES=(
        "keycloak"
        "auth-facade"
        "tenant-service"
        "user-service"
        "api-gateway"
    )

    MAX_WAIT=300
    ELAPSED=0
    INTERVAL=10
    HEALTHY=false

    while [[ $ELAPSED -lt $MAX_WAIT ]]; do
        ALL_OK=true
        for svc in "${HEALTH_SERVICES[@]}"; do
            CONTAINER_ID=$(docker compose -p "$PROJECT_NAME" -f "$COMPOSE_APP" --env-file "$ENV_FILE" ps -q "$svc" 2>/dev/null || true)
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
            HEALTHY=true
            break
        fi

        sleep $INTERVAL
        ELAPSED=$((ELAPSED + INTERVAL))
        log_info "  Health check in progress... ($ELAPSED/$MAX_WAIT seconds)"
    done

    if [[ "$HEALTHY" == "true" ]]; then
        log_ok "All app tier services are healthy after upgrade"
    else
        log_error "Health check FAILED after $MAX_WAIT seconds"

        # Show which services are unhealthy
        echo ""
        for svc in "${HEALTH_SERVICES[@]}"; do
            CONTAINER_ID=$(docker compose -p "$PROJECT_NAME" -f "$COMPOSE_APP" --env-file "$ENV_FILE" ps -q "$svc" 2>/dev/null || true)
            if [[ -z "$CONTAINER_ID" ]]; then
                log_error "  $svc: NOT RUNNING"
                continue
            fi
            STATUS=$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$CONTAINER_ID" 2>/dev/null || echo "unknown")
            if [[ "$STATUS" != "healthy" && "$STATUS" != "running" ]]; then
                log_error "  $svc: $STATUS"
            else
                log_ok "  $svc: $STATUS"
            fi
        done

        # ---------- Step 6: Automatic rollback ----------
        log_step "6/6 Initiating automatic rollback..."

        if [[ -n "$BACKUP_DIR" && -d "$BACKUP_DIR" ]]; then
            log_warn "Rolling back using backup: $BACKUP_DIR"

            if "$SCRIPT_DIR/rollback.sh" --backup "$BACKUP_DIR" --env "$ENV" --auto-confirm; then
                log_ok "Rollback completed. Please verify services manually."
                exit 1
            else
                log_error "ROLLBACK ALSO FAILED. Manual intervention required."
                log_error "Backup is at: $BACKUP_DIR"
                log_error "Data tier logs: docker compose -p $PROJECT_NAME -f $COMPOSE_DATA logs"
                log_error "App tier logs:  docker compose -p $PROJECT_NAME -f $COMPOSE_APP logs"
                exit 2
            fi
        else
            log_error "No backup available for rollback."
            log_error "Manual intervention required."
            log_error "Data tier logs: docker compose -p $PROJECT_NAME -f $COMPOSE_DATA logs"
            log_error "App tier logs:  docker compose -p $PROJECT_NAME -f $COMPOSE_APP logs"
            exit 1
        fi
    fi
fi

# ---------- Version comparison (after upgrade) ----------
AFTER_IMAGES_FILE=$(mktemp)
docker compose -p "$PROJECT_NAME" -f "$COMPOSE_APP" --env-file "$ENV_FILE" images --format json 2>/dev/null | jq -r '.[].ID // "none"' > "$AFTER_IMAGES_FILE" 2>/dev/null || true

if ! diff -q "$BEFORE_IMAGES_FILE" "$AFTER_IMAGES_FILE" &>/dev/null; then
    log_info "Image versions changed during upgrade"
fi

rm -f "$BEFORE_IMAGES_FILE" "$AFTER_IMAGES_FILE"

# ---------- Final summary ----------
echo ""
log_info "============================================"
log_ok "  Upgrade Complete ($ENV)"
log_info "============================================"
echo ""
if [[ -n "$BACKUP_DIR" ]]; then
    log_info "Backup:    $BACKUP_DIR"
fi
log_info "Rollback:  ./scripts/rollback.sh --latest --env $ENV"
log_info "Data logs: docker compose -p $PROJECT_NAME -f $COMPOSE_DATA logs -f"
log_info "App logs:  docker compose -p $PROJECT_NAME -f $COMPOSE_APP logs -f"
echo ""
