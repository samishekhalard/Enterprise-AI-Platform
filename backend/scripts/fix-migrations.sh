#!/bin/bash

# =============================================================================
# EMSIST Migration Fix Script
# Detects and repairs Flyway migration inconsistencies
# =============================================================================

set -e

POSTGRES_CONTAINER="emsist-postgres"
DB_NAME="master_db"
DB_USER="postgres"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=============================================="
echo "  EMSIST Migration Diagnostic Tool"
echo "=============================================="

# Check if Docker container is running
if ! docker ps | grep -q $POSTGRES_CONTAINER; then
    echo -e "${RED}ERROR: PostgreSQL container not running!${NC}"
    echo "Run: docker-compose up -d postgres"
    exit 1
fi

# Function to run SQL
run_sql() {
    docker exec $POSTGRES_CONTAINER psql -U $DB_USER -d $DB_NAME -t -c "$1" 2>/dev/null
}

# List all Flyway history tables
echo ""
echo "📋 Flyway History Tables:"
echo "-------------------------------------------"
HISTORY_TABLES=$(run_sql "SELECT tablename FROM pg_tables WHERE tablename LIKE 'flyway%'")

for table in $HISTORY_TABLES; do
    count=$(run_sql "SELECT COUNT(*) FROM $table")
    echo "  $table: $count migrations"
done

# Check for common issues
echo ""
echo "🔍 Checking for issues..."
echo "-------------------------------------------"

# Check tenant tables
TENANT_TABLES=$(run_sql "SELECT COUNT(*) FROM pg_tables WHERE tablename IN ('tenants', 'tenant_domains', 'tenant_auth_providers')")
if [ "$TENANT_TABLES" -lt 3 ]; then
    echo -e "${YELLOW}⚠ WARNING: Tenant tables missing!${NC}"
    echo "  Expected: tenants, tenant_domains, tenant_auth_providers"

    # Check if flyway thinks they're applied
    FLYWAY_APPLIED=$(run_sql "SELECT COUNT(*) FROM flyway_schema_history WHERE success = true" 2>/dev/null || echo "0")
    if [ "$FLYWAY_APPLIED" -gt 0 ]; then
        echo -e "${RED}  ❌ INCONSISTENCY: Flyway shows $FLYWAY_APPLIED migrations applied but tables missing!${NC}"
        echo ""
        echo "  To fix, run:"
        echo "    ./scripts/fix-migrations.sh --repair tenant-service"
    fi
else
    echo -e "${GREEN}✓ Tenant tables OK${NC}"
fi

# Check auth providers data
AUTH_PROVIDERS=$(run_sql "SELECT COUNT(*) FROM tenant_auth_providers" 2>/dev/null || echo "0")
if [ "$AUTH_PROVIDERS" -eq 0 ]; then
    echo -e "${YELLOW}⚠ WARNING: No auth providers configured!${NC}"
    echo "  This will cause 'No authentication methods' error in frontend"
else
    echo -e "${GREEN}✓ Auth providers configured: $AUTH_PROVIDERS${NC}"
fi

# Handle --repair flag
if [ "$1" == "--repair" ] && [ -n "$2" ]; then
    SERVICE=$2
    echo ""
    echo "🔧 Repairing $SERVICE..."
    echo "-------------------------------------------"

    case $SERVICE in
        tenant-service)
            FLYWAY_TABLE="flyway_schema_history"
            ;;
        user-service)
            FLYWAY_TABLE="flyway_schema_history_user"
            ;;
        license-service)
            FLYWAY_TABLE="flyway_schema_history_license"
            ;;
        audit-service)
            FLYWAY_TABLE="flyway_schema_history_audit"
            ;;
        notification-service)
            FLYWAY_TABLE="flyway_schema_history_notification"
            ;;
        *)
            echo -e "${RED}Unknown service: $SERVICE${NC}"
            exit 1
            ;;
    esac

    echo "Clearing Flyway history for $SERVICE ($FLYWAY_TABLE)..."
    run_sql "DELETE FROM $FLYWAY_TABLE" 2>/dev/null || true

    echo -e "${GREEN}Done! Now restart $SERVICE to re-run migrations.${NC}"
    echo "  mvn spring-boot:run -pl $SERVICE"
fi

echo ""
echo "=============================================="
