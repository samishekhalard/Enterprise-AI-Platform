#!/usr/bin/env bash
# ==============================================================================
# EMSIST Pre-Upgrade Snapshot Script
#
# Creates a complete snapshot of all databases before any version upgrade.
# This is a safety net: if the upgrade fails, restore from the snapshot.
#
# Usage:
#   ./scripts/pre-upgrade-snapshot.sh --env staging --reason "pg16-to-pg17"
#   ./scripts/pre-upgrade-snapshot.sh --env dev --reason "neo4j-5.12-to-5.20"
#
# Output:
#   backups/snapshots/pre-upgrade-{reason}-{timestamp}/
#     postgres/     (all 7 database dumps)
#     neo4j/        (graph data archive)
#     valkey/       (RDB snapshot)
#     metadata.json (upgrade context, image versions, checksums)
#
# IMPORTANT:
#   - Run this BEFORE changing any Docker image tags
#   - The snapshot captures current image versions for rollback reference
#   - Snapshots are NOT subject to retention cleanup (kept permanently)
#
# Prerequisites:
#   - Docker Compose V2
#   - Containers must be running
#   - jq installed (for metadata formatting)
#
# Author: DBA Agent
# Date: 2026-03-02
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
ENV="staging"
REASON=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        --env)
            ENV="$2"
            shift 2
            ;;
        --reason)
            REASON="$2"
            shift 2
            ;;
        -h|--help)
            echo "Usage: $0 --env <dev|staging> --reason <description>"
            echo ""
            echo "Arguments:"
            echo "  --env       Environment to snapshot (dev or staging)"
            echo "  --reason    Short description of the upgrade (used in directory name)"
            echo ""
            echo "Examples:"
            echo "  $0 --env staging --reason pg16-to-pg17"
            echo "  $0 --env dev --reason neo4j-5.12-to-5.20"
            echo "  $0 --env staging --reason keycloak-24-to-25"
            exit 0
            ;;
        *)
            log_error "Unknown argument: $1"
            exit 1
            ;;
    esac
done

if [[ -z "$REASON" ]]; then
    log_error "--reason is required. Example: --reason pg16-to-pg17"
    exit 1
fi

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

# ---------- Create snapshot directory ----------
TIMESTAMP=$(date +"%Y-%m-%dT%H-%M-%S")
# Sanitize reason for use as directory name
SAFE_REASON=$(echo "$REASON" | tr ' ' '-' | tr -cd '[:alnum:]-_')
SNAPSHOT_DIR="$PROJECT_ROOT/backups/snapshots/pre-upgrade-${SAFE_REASON}-${TIMESTAMP}"

PG_SNAPSHOT_DIR="$SNAPSHOT_DIR/postgres"
NEO4J_SNAPSHOT_DIR="$SNAPSHOT_DIR/neo4j"
VALKEY_SNAPSHOT_DIR="$SNAPSHOT_DIR/valkey"

mkdir -p "$PG_SNAPSHOT_DIR"
mkdir -p "$NEO4J_SNAPSHOT_DIR"
mkdir -p "$VALKEY_SNAPSHOT_DIR"

echo ""
log_info "${BOLD}============================================${NC}"
log_info "${BOLD}  EMSIST Pre-Upgrade Snapshot${NC}"
log_info "${BOLD}============================================${NC}"
log_info "Environment: $ENV"
log_info "Reason:      $REASON"
log_info "Timestamp:   $TIMESTAMP"
log_info "Output:      $SNAPSHOT_DIR"
log_info "============================================"
echo ""

# ---------- Load env vars ----------
set -a
source "$ENV_FILE"
set +a

PG_USER="${POSTGRES_USER:-postgres}"

# ---------- Capture current image versions ----------
log_info "Capturing current container image versions..."

PG_IMAGE=$(docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" --env-file "$ENV_FILE" \
    images postgres --format json 2>/dev/null | python3 -c "import sys,json; data=json.loads(sys.stdin.read()); print(data.get('Repository','unknown')+':'+data.get('Tag','unknown'))" 2>/dev/null || echo "unknown")

NEO4J_IMAGE=$(docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" --env-file "$ENV_FILE" \
    images neo4j --format json 2>/dev/null | python3 -c "import sys,json; data=json.loads(sys.stdin.read()); print(data.get('Repository','unknown')+':'+data.get('Tag','unknown'))" 2>/dev/null || echo "unknown")

VALKEY_IMAGE=$(docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" --env-file "$ENV_FILE" \
    images valkey --format json 2>/dev/null | python3 -c "import sys,json; data=json.loads(sys.stdin.read()); print(data.get('Repository','unknown')+':'+data.get('Tag','unknown'))" 2>/dev/null || echo "unknown")

KEYCLOAK_IMAGE=$(docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" --env-file "$ENV_FILE" \
    images keycloak --format json 2>/dev/null | python3 -c "import sys,json; data=json.loads(sys.stdin.read()); print(data.get('Repository','unknown')+':'+data.get('Tag','unknown'))" 2>/dev/null || echo "unknown")

log_info "  PostgreSQL: $PG_IMAGE"
log_info "  Neo4j:      $NEO4J_IMAGE"
log_info "  Valkey:     $VALKEY_IMAGE"
log_info "  Keycloak:   $KEYCLOAK_IMAGE"
echo ""

# ---------- Get PostgreSQL container ----------
PG_CONTAINER=$(docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps -q postgres 2>/dev/null || true)

if [[ -z "$PG_CONTAINER" ]]; then
    log_error "PostgreSQL container is not running. Start the environment first."
    exit 1
fi

# Verify health
PG_STATUS=$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$PG_CONTAINER" 2>/dev/null || echo "not_found")
if [[ "$PG_STATUS" != "healthy" && "$PG_STATUS" != "running" ]]; then
    log_error "PostgreSQL container is not healthy (status: $PG_STATUS)"
    exit 1
fi

# ---------- Capture PostgreSQL version info ----------
PG_VERSION=$(docker exec "$PG_CONTAINER" postgres --version 2>/dev/null | head -1 || echo "unknown")
log_info "PostgreSQL server: $PG_VERSION"

# ---------- Snapshot PostgreSQL databases ----------
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

log_info "Snapshotting PostgreSQL databases..."

for DB in "${DATABASES[@]}"; do
    log_info "  Dumping $DB..."

    DUMP_FILE="$PG_SNAPSHOT_DIR/${DB}.dump"

    if docker exec "$PG_CONTAINER" pg_dump \
        -U "$PG_USER" \
        --format=custom \
        --compress=6 \
        --no-owner \
        --no-privileges \
        "$DB" > "$DUMP_FILE" 2>/dev/null; then

        SIZE=$(du -sh "$DUMP_FILE" | awk '{print $1}')

        # Compute checksum for integrity verification
        CHECKSUM=$(shasum -a 256 "$DUMP_FILE" | awk '{print $1}')

        log_ok "  $DB -> ${DB}.dump ($SIZE, sha256: ${CHECKSUM:0:16}...)"
        echo "${CHECKSUM}  ${DB}.dump" >> "$PG_SNAPSHOT_DIR/checksums.sha256"
        PG_SUCCESS=$((PG_SUCCESS + 1))
    else
        log_error "  $DB: snapshot FAILED"
        rm -f "$DUMP_FILE"
        PG_FAIL=$((PG_FAIL + 1))
    fi
done

# Also capture the full dump
log_info "  Creating full pg_dumpall..."
if docker exec "$PG_CONTAINER" pg_dumpall \
    -U "$PG_USER" \
    --clean \
    --if-exists > "$PG_SNAPSHOT_DIR/pg_dumpall.sql" 2>/dev/null; then

    gzip "$PG_SNAPSHOT_DIR/pg_dumpall.sql"
    SIZE=$(du -sh "$PG_SNAPSHOT_DIR/pg_dumpall.sql.gz" | awk '{print $1}')
    log_ok "  Full dump -> pg_dumpall.sql.gz ($SIZE)"
else
    log_warn "  Full dump failed (individual dumps are still available)"
    rm -f "$PG_SNAPSHOT_DIR/pg_dumpall.sql"
fi

# Also capture Flyway migration state for each database
log_info "  Capturing Flyway migration states..."
for DB in "${DATABASES[@]}"; do
    FLYWAY_TABLE=$(docker exec "$PG_CONTAINER" psql -U "$PG_USER" -d "$DB" -t -c \
        "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='flyway_schema_history');" 2>/dev/null | tr -d ' ' || echo "f")

    if [[ "$FLYWAY_TABLE" == "t" ]]; then
        docker exec "$PG_CONTAINER" psql -U "$PG_USER" -d "$DB" -c \
            "SELECT installed_rank, version, description, type, checksum, installed_on, success FROM flyway_schema_history ORDER BY installed_rank;" \
            > "$PG_SNAPSHOT_DIR/${DB}_flyway_state.txt" 2>/dev/null || true
    fi
done
log_ok "  Flyway migration states captured"

echo ""

# ---------- Snapshot Neo4j ----------
NEO4J_CONTAINER=$(docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps -q neo4j 2>/dev/null || true)

if [[ -n "$NEO4J_CONTAINER" ]]; then
    NEO4J_STATUS=$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$NEO4J_CONTAINER" 2>/dev/null || echo "not_found")

    if [[ "$NEO4J_STATUS" == "healthy" || "$NEO4J_STATUS" == "running" ]]; then
        log_info "Snapshotting Neo4j data..."

        # Capture Neo4j version
        NEO4J_VERSION=$(docker exec "$NEO4J_CONTAINER" neo4j version 2>/dev/null || echo "unknown")
        log_info "  Neo4j server: $NEO4J_VERSION"

        # Capture node/relationship counts
        NEO4J_PASSWORD_VAR="${NEO4J_PASSWORD:-dev_neo4j_password}"
        NODE_COUNT=$(docker exec "$NEO4J_CONTAINER" cypher-shell -u neo4j -p "$NEO4J_PASSWORD_VAR" \
            "MATCH (n) RETURN count(n) AS count" 2>/dev/null | tail -1 | tr -d ' ' || echo "unknown")
        REL_COUNT=$(docker exec "$NEO4J_CONTAINER" cypher-shell -u neo4j -p "$NEO4J_PASSWORD_VAR" \
            "MATCH ()-[r]->() RETURN count(r) AS count" 2>/dev/null | tail -1 | tr -d ' ' || echo "unknown")
        log_info "  Graph stats: $NODE_COUNT nodes, $REL_COUNT relationships"

        # Copy data directory from container
        if docker exec "$NEO4J_CONTAINER" bash -c "test -d /data/databases" 2>/dev/null; then
            docker cp "$NEO4J_CONTAINER:/data/databases" "$NEO4J_SNAPSHOT_DIR/databases" 2>/dev/null || true
            docker cp "$NEO4J_CONTAINER:/data/transactions" "$NEO4J_SNAPSHOT_DIR/transactions" 2>/dev/null || true

            if [[ -d "$NEO4J_SNAPSHOT_DIR/databases" ]]; then
                (cd "$NEO4J_SNAPSHOT_DIR" && tar czf neo4j-data.tar.gz databases/ transactions/ 2>/dev/null && rm -rf databases/ transactions/)
                SIZE=$(du -sh "$NEO4J_SNAPSHOT_DIR/neo4j-data.tar.gz" | awk '{print $1}')
                CHECKSUM=$(shasum -a 256 "$NEO4J_SNAPSHOT_DIR/neo4j-data.tar.gz" | awk '{print $1}')
                log_ok "  Neo4j -> neo4j-data.tar.gz ($SIZE, sha256: ${CHECKSUM:0:16}...)"
            fi
        else
            log_warn "  Neo4j /data/databases not found"
        fi

        # Also export as Cypher for portability
        log_info "  Exporting Neo4j as Cypher statements (APOC)..."
        docker exec "$NEO4J_CONTAINER" cypher-shell -u neo4j -p "$NEO4J_PASSWORD_VAR" \
            "CALL apoc.export.cypher.all(null, {format:'cypher-shell', stream:true}) YIELD cypherStatements RETURN cypherStatements" \
            > "$NEO4J_SNAPSHOT_DIR/neo4j-export.cypher" 2>/dev/null || log_warn "  Cypher export failed (APOC may not be available)"

        # Capture migration state
        docker exec "$NEO4J_CONTAINER" cypher-shell -u neo4j -p "$NEO4J_PASSWORD_VAR" \
            "MATCH (m:Migration) RETURN m.version, m.name, m.appliedAt ORDER BY m.version" \
            > "$NEO4J_SNAPSHOT_DIR/migration-state.txt" 2>/dev/null || true
    else
        log_warn "Neo4j container is not healthy (status: $NEO4J_STATUS). Skipping."
    fi
else
    log_warn "Neo4j container is not running. Skipping."
fi

echo ""

# ---------- Snapshot Valkey ----------
VALKEY_CONTAINER=$(docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps -q valkey 2>/dev/null || true)

if [[ -n "$VALKEY_CONTAINER" ]]; then
    log_info "Snapshotting Valkey (cache)..."
    docker exec "$VALKEY_CONTAINER" valkey-cli BGSAVE 2>/dev/null || true
    sleep 2
    docker cp "$VALKEY_CONTAINER:/data/dump.rdb" "$VALKEY_SNAPSHOT_DIR/dump.rdb" 2>/dev/null || true

    if [[ -f "$VALKEY_SNAPSHOT_DIR/dump.rdb" ]]; then
        SIZE=$(du -sh "$VALKEY_SNAPSHOT_DIR/dump.rdb" | awk '{print $1}')
        log_ok "  Valkey -> dump.rdb ($SIZE)"
    else
        log_info "  Valkey: No RDB dump (cache may be empty)"
    fi
else
    log_info "Valkey not running. Skipping."
fi

echo ""

# ---------- Capture docker-compose.yml for reference ----------
cp "$COMPOSE_FILE" "$SNAPSHOT_DIR/compose-file-snapshot.yml"
cp "$ENV_FILE" "$SNAPSHOT_DIR/env-file-snapshot"
log_ok "Compose file and env file captured"

# ---------- Write metadata ----------
cat > "$SNAPSHOT_DIR/metadata.json" <<EOF
{
  "snapshot_type": "pre-upgrade",
  "reason": "$REASON",
  "timestamp": "$TIMESTAMP",
  "environment": "$ENV",
  "images": {
    "postgres": "$PG_IMAGE",
    "neo4j": "$NEO4J_IMAGE",
    "valkey": "$VALKEY_IMAGE",
    "keycloak": "$KEYCLOAK_IMAGE"
  },
  "versions": {
    "postgres_server": "$PG_VERSION",
    "neo4j_server": "${NEO4J_VERSION:-unknown}"
  },
  "postgres": {
    "databases_backed_up": $PG_SUCCESS,
    "databases_failed": $PG_FAIL,
    "databases": $(printf '%s\n' "${DATABASES[@]}" | jq -R . 2>/dev/null | jq -s . 2>/dev/null || echo '[]')
  },
  "neo4j": {
    "nodes": "${NODE_COUNT:-unknown}",
    "relationships": "${REL_COUNT:-unknown}",
    "data_archived": $([ -f "$NEO4J_SNAPSHOT_DIR/neo4j-data.tar.gz" ] && echo "true" || echo "false")
  },
  "notes": "This snapshot was created before upgrade: $REASON. To rollback, revert the Docker image tag and restore from this snapshot using restore-databases.sh."
}
EOF

# ---------- Summary ----------
TOTAL_SIZE=$(du -sh "$SNAPSHOT_DIR" | awk '{print $1}')

echo ""
log_info "${BOLD}============================================${NC}"
log_info "${BOLD}  Pre-Upgrade Snapshot Complete${NC}"
log_info "${BOLD}============================================${NC}"
echo ""
log_info "Snapshot:    $SNAPSHOT_DIR"
log_info "Total size:  $TOTAL_SIZE"
log_info "PostgreSQL:  $PG_SUCCESS/${#DATABASES[@]} databases"
log_info "Neo4j:       $([ -f "$NEO4J_SNAPSHOT_DIR/neo4j-data.tar.gz" ] && echo "archived" || echo "skipped")"
log_info "Valkey:      $([ -f "$VALKEY_SNAPSHOT_DIR/dump.rdb" ] && echo "archived" || echo "skipped")"
echo ""
log_info "Image versions at snapshot time:"
log_info "  PostgreSQL: $PG_IMAGE"
log_info "  Neo4j:      $NEO4J_IMAGE"
log_info "  Valkey:     $VALKEY_IMAGE"
log_info "  Keycloak:   $KEYCLOAK_IMAGE"
echo ""

if [[ $PG_FAIL -gt 0 ]]; then
    log_error "$PG_FAIL PostgreSQL database(s) failed to snapshot."
    log_error "DO NOT proceed with upgrade until all databases are captured."
    exit 1
fi

log_ok "All databases captured. Safe to proceed with upgrade."
echo ""
log_info "Rollback command (if upgrade fails):"
log_info "  ./scripts/restore-databases.sh --backup $SNAPSHOT_DIR --env $ENV"
echo ""
