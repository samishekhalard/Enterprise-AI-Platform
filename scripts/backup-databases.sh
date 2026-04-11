#!/usr/bin/env bash
# ==============================================================================
# EMSIST Database Backup Script
#
# Backs up all PostgreSQL databases and Neo4j data to timestamped directories.
#
# Usage:
#   ./scripts/backup-databases.sh                     # Backup dev environment
#   ./scripts/backup-databases.sh --env staging        # Backup staging environment
#   ./scripts/backup-databases.sh --env dev --dir /tmp # Custom backup directory
#
# Output:
#   backups/YYYY-MM-DD_HHMMSS/
#     postgres/
#       master_db.sql.gz
#       user_db.sql.gz
#       license_db.sql.gz
#       ...
#     neo4j/
#       neo4j-backup.dump
#     metadata.json
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info()  { echo -e "${BLUE}[INFO]${NC}  $1"; }
log_ok()    { echo -e "${GREEN}[OK]${NC}    $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ---------- Parse arguments ----------
ENV="dev"
BACKUP_ROOT="$PROJECT_ROOT/backups"

while [[ $# -gt 0 ]]; do
    case "$1" in
        --env)
            ENV="$2"
            shift 2
            ;;
        --dir)
            BACKUP_ROOT="$2"
            shift 2
            ;;
        -h|--help)
            echo "Usage: $0 [--env dev|staging] [--dir /path/to/backups]"
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
    log_error "Unknown environment: $ENV (use 'dev' or 'staging')"
    exit 1
fi

if [[ ! -f "$COMPOSE_FILE" ]]; then
    log_error "Compose file not found: $COMPOSE_FILE"
    exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
    log_error "Environment file not found: $ENV_FILE"
    exit 1
fi

# ---------- Create backup directory ----------
TIMESTAMP=$(date +"%Y-%m-%d_%H%M%S")
BACKUP_DIR="$BACKUP_ROOT/${ENV}_${TIMESTAMP}"
PG_BACKUP_DIR="$BACKUP_DIR/postgres"
NEO4J_BACKUP_DIR="$BACKUP_DIR/neo4j"

mkdir -p "$PG_BACKUP_DIR"
mkdir -p "$NEO4J_BACKUP_DIR"

log_info "============================================"
log_info "  EMSIST Database Backup ($ENV)"
log_info "  Timestamp: $TIMESTAMP"
log_info "  Backup dir: $BACKUP_DIR"
log_info "============================================"
echo ""

# ---------- Load env vars for DB credentials ----------
set -a
source "$ENV_FILE"
set +a

PG_USER="${POSTGRES_USER:-postgres}"
PG_PASSWORD="${POSTGRES_PASSWORD:-dev_password_change_me}"

# ---------- Get postgres container ----------
PG_CONTAINER=$(docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps -q postgres 2>/dev/null || true)

if [[ -z "$PG_CONTAINER" ]]; then
    log_error "PostgreSQL container is not running. Start the environment first."
    exit 1
fi

# Verify postgres is healthy
PG_STATUS=$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$PG_CONTAINER" 2>/dev/null || echo "not_found")
if [[ "$PG_STATUS" != "healthy" && "$PG_STATUS" != "running" ]]; then
    log_error "PostgreSQL container is not healthy (status: $PG_STATUS)"
    exit 1
fi
log_ok "PostgreSQL container found and healthy"

# ---------- Backup PostgreSQL databases ----------
DATABASES=(
    "master_db"
    "keycloak_db"
    "user_db"
    "license_db"
    "notification_db"
    "audit_db"
    "ai_db"
)

PG_SUCCESS=0
PG_FAIL=0

for DB in "${DATABASES[@]}"; do
    log_info "Backing up PostgreSQL: $DB..."

    if docker exec "$PG_CONTAINER" pg_dump \
        -U "$PG_USER" \
        --format=custom \
        --compress=6 \
        --no-owner \
        --no-privileges \
        "$DB" > "$PG_BACKUP_DIR/${DB}.dump" 2>/dev/null; then

        SIZE=$(du -sh "$PG_BACKUP_DIR/${DB}.dump" | awk '{print $1}')
        log_ok "  $DB -> ${DB}.dump ($SIZE)"
        PG_SUCCESS=$((PG_SUCCESS + 1))
    else
        log_warn "  $DB: backup failed (database may not exist yet)"
        rm -f "$PG_BACKUP_DIR/${DB}.dump"
        PG_FAIL=$((PG_FAIL + 1))
    fi
done

# Also dump all databases as a single file for disaster recovery
log_info "Creating full PostgreSQL dump (pg_dumpall)..."
if docker exec "$PG_CONTAINER" pg_dumpall \
    -U "$PG_USER" \
    --clean \
    --if-exists > "$PG_BACKUP_DIR/pg_dumpall.sql" 2>/dev/null; then

    # Compress it
    gzip "$PG_BACKUP_DIR/pg_dumpall.sql"
    SIZE=$(du -sh "$PG_BACKUP_DIR/pg_dumpall.sql.gz" | awk '{print $1}')
    log_ok "  Full dump -> pg_dumpall.sql.gz ($SIZE)"
else
    log_warn "  Full dump failed"
    rm -f "$PG_BACKUP_DIR/pg_dumpall.sql"
fi

# ---------- Backup Neo4j ----------
NEO4J_CONTAINER=$(docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps -q neo4j 2>/dev/null || true)

if [[ -n "$NEO4J_CONTAINER" ]]; then
    NEO4J_STATUS=$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$NEO4J_CONTAINER" 2>/dev/null || echo "not_found")

    if [[ "$NEO4J_STATUS" == "healthy" || "$NEO4J_STATUS" == "running" ]]; then
        log_info "Backing up Neo4j..."

        # Neo4j Community does not support online backup via neo4j-admin backup.
        # Use neo4j-admin database dump instead (requires stopping the database first
        # in Community edition) or copy the data volume.
        # For safety, we copy the data directory from the container.

        if docker exec "$NEO4J_CONTAINER" bash -c "test -d /data/databases" 2>/dev/null; then
            # Copy the data directory
            docker cp "$NEO4J_CONTAINER:/data/databases" "$NEO4J_BACKUP_DIR/databases" 2>/dev/null || true
            docker cp "$NEO4J_CONTAINER:/data/transactions" "$NEO4J_BACKUP_DIR/transactions" 2>/dev/null || true

            # Tar and compress
            if [[ -d "$NEO4J_BACKUP_DIR/databases" ]]; then
                (cd "$NEO4J_BACKUP_DIR" && tar czf neo4j-data.tar.gz databases/ transactions/ 2>/dev/null && rm -rf databases/ transactions/)
                SIZE=$(du -sh "$NEO4J_BACKUP_DIR/neo4j-data.tar.gz" | awk '{print $1}')
                log_ok "  Neo4j data -> neo4j-data.tar.gz ($SIZE)"
            else
                log_warn "  Neo4j: Could not copy databases directory"
            fi
        else
            log_warn "  Neo4j: /data/databases not found in container"
        fi
    else
        log_warn "Neo4j container is not healthy (status: $NEO4J_STATUS). Skipping."
    fi
else
    log_warn "Neo4j container is not running. Skipping."
fi

# ---------- Backup Valkey (RDB snapshot) ----------
VALKEY_CONTAINER=$(docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps -q valkey 2>/dev/null || true)

if [[ -n "$VALKEY_CONTAINER" ]]; then
    log_info "Backing up Valkey (triggering BGSAVE)..."

    # Trigger a background save
    docker exec "$VALKEY_CONTAINER" valkey-cli BGSAVE 2>/dev/null || true
    sleep 2

    # Copy the dump file
    VALKEY_BACKUP_DIR="$BACKUP_DIR/valkey"
    mkdir -p "$VALKEY_BACKUP_DIR"
    docker cp "$VALKEY_CONTAINER:/data/dump.rdb" "$VALKEY_BACKUP_DIR/dump.rdb" 2>/dev/null || true

    if [[ -f "$VALKEY_BACKUP_DIR/dump.rdb" ]]; then
        SIZE=$(du -sh "$VALKEY_BACKUP_DIR/dump.rdb" | awk '{print $1}')
        log_ok "  Valkey -> dump.rdb ($SIZE)"
    else
        log_warn "  Valkey: No RDB dump found (cache may be empty)"
    fi
else
    log_warn "Valkey container is not running. Skipping."
fi

# ---------- Write metadata ----------
cat > "$BACKUP_DIR/metadata.json" <<EOF
{
  "timestamp": "$TIMESTAMP",
  "environment": "$ENV",
  "compose_file": "$COMPOSE_FILE",
  "postgres": {
    "user": "$PG_USER",
    "databases_backed_up": $PG_SUCCESS,
    "databases_failed": $PG_FAIL,
    "databases": $(printf '%s\n' "${DATABASES[@]}" | jq -R . | jq -s .)
  },
  "neo4j": {
    "backed_up": $([ -f "$NEO4J_BACKUP_DIR/neo4j-data.tar.gz" ] && echo "true" || echo "false")
  },
  "valkey": {
    "backed_up": $([ -f "$BACKUP_DIR/valkey/dump.rdb" ] && echo "true" || echo "false")
  },
  "docker": {
    "version": "$(docker --version 2>/dev/null || echo "unknown")",
    "compose_version": "$(docker compose version --short 2>/dev/null || echo "unknown")"
  }
}
EOF

# ---------- Summary ----------
echo ""
log_info "============================================"
log_info "  Backup Summary"
log_info "============================================"
echo ""
log_info "Location:   $BACKUP_DIR"
log_info "PostgreSQL: $PG_SUCCESS databases backed up, $PG_FAIL failed"

TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | awk '{print $1}')
log_info "Total size: $TOTAL_SIZE"
echo ""

# ---------- Cleanup old backups (keep last 5) ----------
if [[ -d "$BACKUP_ROOT" ]]; then
    BACKUP_COUNT=$(ls -d "$BACKUP_ROOT/${ENV}_"* 2>/dev/null | wc -l | tr -d ' ')
    if [[ "$BACKUP_COUNT" -gt 5 ]]; then
        REMOVE_COUNT=$((BACKUP_COUNT - 5))
        log_info "Cleaning up old backups (keeping last 5, removing $REMOVE_COUNT)..."
        ls -dt "$BACKUP_ROOT/${ENV}_"* | tail -n "$REMOVE_COUNT" | xargs rm -rf
        log_ok "Old backups removed"
    fi
fi

log_ok "Backup complete: $BACKUP_DIR"

# Output the backup path for scripts that call this one
echo "$BACKUP_DIR"
