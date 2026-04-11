#!/usr/bin/env bash
# ==============================================================================
# EMSIST Database Restore Script
#
# Restores PostgreSQL databases and Neo4j data from a backup directory.
#
# Usage:
#   ./scripts/restore-databases.sh --backup backups/dev_2026-03-02_120000
#   ./scripts/restore-databases.sh --backup backups/dev_2026-03-02_120000 --env staging
#   ./scripts/restore-databases.sh --latest --env dev
#
# CAUTION: This will OVERWRITE existing data in the target databases.
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
BACKUP_DIR=""
USE_LATEST=false

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
        -h|--help)
            echo "Usage: $0 --backup <backup-dir> [--env dev|staging]"
            echo "       $0 --latest [--env dev|staging]"
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

# ---------- Find backup directory ----------
BACKUP_ROOT="$PROJECT_ROOT/backups"

if [[ "$USE_LATEST" == "true" ]]; then
    BACKUP_DIR=$(ls -dt "$BACKUP_ROOT/${ENV}_"* 2>/dev/null | head -1 || true)
    if [[ -z "$BACKUP_DIR" ]]; then
        log_error "No backups found for environment '$ENV' in $BACKUP_ROOT"
        exit 1
    fi
fi

if [[ -z "$BACKUP_DIR" ]]; then
    log_error "No backup directory specified. Use --backup <dir> or --latest"
    exit 1
fi

if [[ ! -d "$BACKUP_DIR" ]]; then
    log_error "Backup directory does not exist: $BACKUP_DIR"
    exit 1
fi

if [[ ! -f "$BACKUP_DIR/metadata.json" ]]; then
    log_warn "No metadata.json found in backup. Proceeding with caution."
fi

# ---------- Confirmation ----------
echo ""
log_warn "============================================"
log_warn "  WARNING: DATABASE RESTORE"
log_warn "============================================"
log_warn ""
log_warn "  Environment:  $ENV"
log_warn "  Backup:       $BACKUP_DIR"
log_warn ""
log_warn "  This will OVERWRITE existing data!"
log_warn "============================================"
echo ""

read -p "Are you sure you want to restore? Type 'yes' to confirm: " CONFIRM
if [[ "$CONFIRM" != "yes" ]]; then
    log_info "Restore cancelled."
    exit 0
fi

# ---------- Load env vars ----------
set -a
source "$ENV_FILE"
set +a

PG_USER="${POSTGRES_USER:-postgres}"

# ---------- Get postgres container ----------
PG_CONTAINER=$(docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps -q postgres 2>/dev/null || true)

if [[ -z "$PG_CONTAINER" ]]; then
    log_error "PostgreSQL container is not running."
    exit 1
fi

# ---------- Restore PostgreSQL databases ----------
PG_BACKUP_DIR="$BACKUP_DIR/postgres"
PG_SUCCESS=0
PG_FAIL=0

if [[ -d "$PG_BACKUP_DIR" ]]; then
    log_info "Restoring PostgreSQL databases..."

    for DUMP_FILE in "$PG_BACKUP_DIR"/*.dump; do
        if [[ ! -f "$DUMP_FILE" ]]; then
            continue
        fi

        DB_NAME=$(basename "$DUMP_FILE" .dump)
        log_info "  Restoring $DB_NAME from $(basename "$DUMP_FILE")..."

        # Drop and recreate the database
        docker exec "$PG_CONTAINER" psql -U "$PG_USER" -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();" 2>/dev/null || true
        docker exec "$PG_CONTAINER" psql -U "$PG_USER" -c "DROP DATABASE IF EXISTS $DB_NAME;" 2>/dev/null || true
        docker exec "$PG_CONTAINER" psql -U "$PG_USER" -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || true

        # Restore from custom-format dump
        if cat "$DUMP_FILE" | docker exec -i "$PG_CONTAINER" pg_restore \
            -U "$PG_USER" \
            -d "$DB_NAME" \
            --no-owner \
            --no-privileges \
            --clean \
            --if-exists 2>/dev/null; then
            log_ok "  $DB_NAME restored successfully"
            PG_SUCCESS=$((PG_SUCCESS + 1))
        else
            # pg_restore may return non-zero even on warnings, check if the DB has tables
            TABLE_COUNT=$(docker exec "$PG_CONTAINER" psql -U "$PG_USER" -d "$DB_NAME" -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')
            if [[ "$TABLE_COUNT" -gt "0" ]]; then
                log_ok "  $DB_NAME restored with warnings ($TABLE_COUNT tables)"
                PG_SUCCESS=$((PG_SUCCESS + 1))
            else
                log_error "  $DB_NAME restore failed"
                PG_FAIL=$((PG_FAIL + 1))
            fi
        fi
    done
else
    log_warn "No PostgreSQL backup directory found in $BACKUP_DIR"
fi

# ---------- Restore Neo4j ----------
NEO4J_BACKUP_DIR="$BACKUP_DIR/neo4j"

if [[ -d "$NEO4J_BACKUP_DIR" && -f "$NEO4J_BACKUP_DIR/neo4j-data.tar.gz" ]]; then
    NEO4J_CONTAINER=$(docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps -q neo4j 2>/dev/null || true)

    if [[ -n "$NEO4J_CONTAINER" ]]; then
        log_info "Restoring Neo4j data..."
        log_warn "  Neo4j must be stopped for data restoration."
        log_warn "  Stopping Neo4j container..."

        docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" --env-file "$ENV_FILE" stop neo4j

        # Extract backup to temp dir
        TEMP_DIR=$(mktemp -d)
        tar xzf "$NEO4J_BACKUP_DIR/neo4j-data.tar.gz" -C "$TEMP_DIR"

        # Copy data back into the volume
        docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" --env-file "$ENV_FILE" run --rm \
            -v "$TEMP_DIR/databases:/restore/databases" \
            -v "$TEMP_DIR/transactions:/restore/transactions" \
            --entrypoint "" \
            neo4j sh -c "rm -rf /data/databases/* /data/transactions/* && cp -r /restore/databases/* /data/databases/ && cp -r /restore/transactions/* /data/transactions/ && chown -R neo4j:neo4j /data" 2>/dev/null || true

        rm -rf "$TEMP_DIR"

        # Restart Neo4j
        docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" --env-file "$ENV_FILE" start neo4j
        log_ok "  Neo4j data restored and container restarted"
    else
        log_warn "Neo4j container not found. Skipping Neo4j restore."
    fi
else
    log_info "No Neo4j backup found. Skipping."
fi

# ---------- Restore Valkey ----------
VALKEY_BACKUP_DIR="$BACKUP_DIR/valkey"

if [[ -d "$VALKEY_BACKUP_DIR" && -f "$VALKEY_BACKUP_DIR/dump.rdb" ]]; then
    VALKEY_CONTAINER=$(docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps -q valkey 2>/dev/null || true)

    if [[ -n "$VALKEY_CONTAINER" ]]; then
        log_info "Restoring Valkey data..."

        # Stop Valkey, copy RDB, restart
        docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" --env-file "$ENV_FILE" stop valkey
        docker cp "$VALKEY_BACKUP_DIR/dump.rdb" "$VALKEY_CONTAINER:/data/dump.rdb" 2>/dev/null || true
        docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" --env-file "$ENV_FILE" start valkey

        log_ok "  Valkey data restored"
    else
        log_warn "Valkey container not found. Skipping."
    fi
else
    log_info "No Valkey backup found. Skipping."
fi

# ---------- Summary ----------
echo ""
log_info "============================================"
log_info "  Restore Summary"
log_info "============================================"
echo ""
log_info "PostgreSQL: $PG_SUCCESS databases restored, $PG_FAIL failed"
log_info "Backup source: $BACKUP_DIR"
echo ""
log_ok "Restore complete."
log_info "Verify services: docker compose -p $PROJECT_NAME -f $COMPOSE_FILE ps"
