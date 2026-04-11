#!/bin/bash
# ============================================================================
# EMS Platform - Smoke Test Script
# ============================================================================
# Usage:
#   ./smoketest.sh              # Run all tests
#   ./smoketest.sh db           # Database tests only
#   ./smoketest.sh services     # Service health only
#   ./smoketest.sh api          # API endpoint tests only
#   ./smoketest.sh frontend     # Frontend build check only
#   ./smoketest.sh migrations   # Check pending migrations
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
POSTGRES_CONTAINER="ems-postgres"
POSTGRES_USER="postgres"
MASTER_DB="master_db"
AUDIT_DB="ems_audit_db"

API_GATEWAY_URL="http://localhost:8080"
AUTH_FACADE_URL="http://localhost:8081"
TENANT_SERVICE_URL="http://localhost:8082"
USER_SERVICE_URL="http://localhost:8083"
FRONTEND_URL="http://localhost:4200"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"
FRONTEND_DIR="$(dirname "$BACKEND_DIR")/frontend"

# ============================================================================
# Helper Functions
# ============================================================================

print_header() {
    echo ""
    echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
}

print_test() {
    echo -n "  ▸ $1... "
}

print_pass() {
    echo -e "${GREEN}✓ PASS${NC}"
}

print_fail() {
    echo -e "${RED}✗ FAIL${NC}"
    if [ -n "$1" ]; then
        echo -e "    ${RED}$1${NC}"
    fi
}

print_warn() {
    echo -e "${YELLOW}⚠ WARN${NC}"
    if [ -n "$1" ]; then
        echo -e "    ${YELLOW}$1${NC}"
    fi
}

print_skip() {
    echo -e "${YELLOW}○ SKIP${NC}"
    if [ -n "$1" ]; then
        echo -e "    ${YELLOW}$1${NC}"
    fi
}

print_info() {
    echo -e "    ${BLUE}ℹ $1${NC}"
}

# ============================================================================
# Database Tests
# ============================================================================

test_database() {
    print_header "DATABASE VERIFICATION"

    # Check PostgreSQL container
    print_test "PostgreSQL container running"
    if docker ps --format '{{.Names}}' | grep -q "$POSTGRES_CONTAINER"; then
        print_pass
    else
        print_fail "Container $POSTGRES_CONTAINER not running"
        return 1
    fi

    # Check master_db exists
    print_test "master_db database exists"
    if docker exec $POSTGRES_CONTAINER psql -U $POSTGRES_USER -lqt | cut -d \| -f 1 | grep -qw master_db; then
        print_pass
    else
        print_fail "Database master_db not found"
        return 1
    fi

    # Check tenants table
    print_test "Tenants table exists"
    TABLES=$(docker exec $POSTGRES_CONTAINER psql -U $POSTGRES_USER -d $MASTER_DB -c "\dt" 2>/dev/null)
    if echo "$TABLES" | grep -q "tenants"; then
        print_pass
    else
        print_fail "Tenants table not found"
        return 1
    fi

    # Check master tenant exists
    print_test "Master tenant exists"
    MASTER=$(docker exec $POSTGRES_CONTAINER psql -U $POSTGRES_USER -d $MASTER_DB -t -c \
        "SELECT id FROM tenants WHERE tenant_type = 'MASTER';" 2>/dev/null | tr -d ' ')
    if [ -n "$MASTER" ]; then
        print_pass
        print_info "Master tenant ID: $MASTER"
    else
        print_fail "No master tenant found"
        return 1
    fi

    # Check master tenant is protected
    print_test "Master tenant is protected"
    PROTECTED=$(docker exec $POSTGRES_CONTAINER psql -U $POSTGRES_USER -d $MASTER_DB -t -c \
        "SELECT is_protected FROM tenants WHERE tenant_type = 'MASTER';" 2>/dev/null | tr -d ' ')
    if [ "$PROTECTED" = "t" ]; then
        print_pass
    else
        print_fail "Master tenant is_protected = $PROTECTED (expected: t)"
        return 1
    fi

    # Check master tenant identity
    print_test "Master tenant identity is correct"
    IDENTITY=$(docker exec $POSTGRES_CONTAINER psql -U $POSTGRES_USER -d $MASTER_DB -t -c \
        "SELECT full_name || '|' || short_name || '|' || slug FROM tenants WHERE tenant_type = 'MASTER';" 2>/dev/null | tr -d ' ')
    if [ "$IDENTITY" = "MasterTenant|master|master" ]; then
        print_pass
    else
        print_fail "Identity mismatch: $IDENTITY"
        print_info "Expected: MasterTenant|master|master"
        return 1
    fi

    # Check protection triggers exist
    print_test "Protection triggers installed"
    TRIGGERS=$(docker exec $POSTGRES_CONTAINER psql -U $POSTGRES_USER -d $MASTER_DB -t -c \
        "SELECT COUNT(*) FROM pg_trigger WHERE tgname LIKE 'trg_protect%' OR tgname LIKE 'trg_prevent%';" 2>/dev/null | tr -d ' ')
    if [ "$TRIGGERS" -ge 2 ]; then
        print_pass
        print_info "$TRIGGERS protection triggers found"
    else
        print_fail "Expected at least 2 triggers, found $TRIGGERS"
        return 1
    fi

    # Show current tenant state
    echo ""
    echo -e "  ${BLUE}Current Tenants:${NC}"
    docker exec $POSTGRES_CONTAINER psql -U $POSTGRES_USER -d $MASTER_DB -c \
        "SELECT id, full_name, short_name, tenant_type, status, is_protected FROM tenants;" 2>/dev/null | \
        sed 's/^/    /'
}

# ============================================================================
# Migration Tests
# ============================================================================

test_migrations() {
    print_header "FLYWAY MIGRATIONS"

    print_test "Checking migration history"
    MIGRATIONS=$(docker exec $POSTGRES_CONTAINER psql -U $POSTGRES_USER -d $MASTER_DB -t -c \
        "SELECT COUNT(*) FROM flyway_schema_history WHERE success = true;" 2>/dev/null | tr -d ' ')
    if [ -n "$MIGRATIONS" ] && [ "$MIGRATIONS" -gt 0 ]; then
        print_pass
        print_info "$MIGRATIONS migrations applied"
    else
        print_fail "No migrations found or flyway_schema_history missing"
        return 1
    fi

    # Show migration history
    echo ""
    echo -e "  ${BLUE}Migration History:${NC}"
    docker exec $POSTGRES_CONTAINER psql -U $POSTGRES_USER -d $MASTER_DB -c \
        "SELECT version, description, installed_on, success FROM flyway_schema_history ORDER BY installed_rank;" 2>/dev/null | \
        sed 's/^/    /'

    # Check for pending migrations
    print_test "Checking for pending migrations"
    PENDING_COUNT=0
    for migration_file in "$BACKEND_DIR"/tenant-service/src/main/resources/db/migration/V*.sql; do
        if [ -f "$migration_file" ]; then
            VERSION=$(basename "$migration_file" | sed 's/V\([0-9]*\)__.*/\1/')
            APPLIED=$(docker exec $POSTGRES_CONTAINER psql -U $POSTGRES_USER -d $MASTER_DB -t -c \
                "SELECT COUNT(*) FROM flyway_schema_history WHERE version = '$VERSION';" 2>/dev/null | tr -d ' ')
            if [ "$APPLIED" = "0" ]; then
                PENDING_COUNT=$((PENDING_COUNT + 1))
                print_info "Pending: $(basename "$migration_file")"
            fi
        fi
    done

    if [ "$PENDING_COUNT" -eq 0 ]; then
        print_pass
    else
        print_warn "$PENDING_COUNT pending migrations found"
        print_info "Restart tenant-service to apply"
    fi
}

# ============================================================================
# Service Health Tests
# ============================================================================

test_services() {
    print_header "SERVICE HEALTH"

    # Check Docker services
    print_test "Docker infrastructure services"
    DOCKER_SERVICES=("ems-postgres" "ems-valkey" "ems-kafka" "ems-keycloak")
    RUNNING=0
    for svc in "${DOCKER_SERVICES[@]}"; do
        if docker ps --format '{{.Names}}' | grep -q "$svc"; then
            RUNNING=$((RUNNING + 1))
        fi
    done
    if [ "$RUNNING" -eq ${#DOCKER_SERVICES[@]} ]; then
        print_pass
        print_info "$RUNNING/${#DOCKER_SERVICES[@]} containers running"
    else
        print_fail "$RUNNING/${#DOCKER_SERVICES[@]} containers running"
    fi

    # Check Java services
    print_test "Auth Facade (port 8081)"
    if curl -s --max-time 5 "$AUTH_FACADE_URL/actuator/health" 2>/dev/null | grep -q '"status":"UP"'; then
        print_pass
    elif pgrep -f "AuthFacadeApplication" > /dev/null; then
        print_warn "Process running but health check failed"
    else
        print_skip "Not running"
    fi

    print_test "Tenant Service (port 8082)"
    if curl -s --max-time 5 "$TENANT_SERVICE_URL/actuator/health" 2>/dev/null | grep -q '"status":"UP"'; then
        print_pass
    elif pgrep -f "TenantServiceApplication" > /dev/null; then
        print_warn "Process running but health check failed"
    else
        print_skip "Not running"
    fi

    print_test "API Gateway (port 8080)"
    if curl -s --max-time 5 "$API_GATEWAY_URL/actuator/health" 2>/dev/null | grep -q '"status":"UP"'; then
        print_pass
    elif pgrep -f "ApiGatewayApplication" > /dev/null; then
        print_warn "Process running but health check failed"
    else
        print_skip "Not running"
    fi

    print_test "Frontend (port 4200)"
    if curl -s --max-time 5 "$FRONTEND_URL" 2>/dev/null | grep -q "html"; then
        print_pass
    else
        print_skip "Not running"
    fi
}

# ============================================================================
# API Endpoint Tests
# ============================================================================

test_api() {
    print_header "API ENDPOINT TESTS"

    # Test tenant list endpoint
    print_test "GET /api/tenants (list tenants)"
    RESPONSE=$(curl -s --max-time 10 "$TENANT_SERVICE_URL/api/tenants" 2>/dev/null)
    if echo "$RESPONSE" | grep -q '"tenants"'; then
        print_pass
        TENANT_COUNT=$(echo "$RESPONSE" | grep -o '"id"' | wc -l | tr -d ' ')
        print_info "$TENANT_COUNT tenants returned"
    else
        print_fail "Invalid response or service unavailable"
        return 1
    fi

    # Test isProtected field is returned
    print_test "API returns isProtected field"
    if echo "$RESPONSE" | grep -q '"isProtected"'; then
        print_pass
    else
        print_fail "isProtected field missing from API response"
        return 1
    fi

    # Test master tenant protection via API
    print_test "Master tenant marked as protected in API"
    # Find master tenant in response
    MASTER_PROTECTED=$(echo "$RESPONSE" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for t in data.get('tenants', []):
    if t.get('tenantType') == 'MASTER' or t.get('tenantType') == 'master':
        print('true' if t.get('isProtected') else 'false')
        break
" 2>/dev/null)
    if [ "$MASTER_PROTECTED" = "true" ]; then
        print_pass
    else
        print_fail "Master tenant isProtected=$MASTER_PROTECTED (expected: true)"
        return 1
    fi

    # Test health endpoint
    print_test "GET /actuator/health"
    if curl -s --max-time 5 "$TENANT_SERVICE_URL/actuator/health" | grep -q '"status":"UP"'; then
        print_pass
    else
        print_fail "Health check failed"
    fi

    # Show sample API response
    echo ""
    echo -e "  ${BLUE}Sample Tenant Data:${NC}"
    echo "$RESPONSE" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for t in data.get('tenants', [])[:3]:
    print(f\"    {t.get('id')}: {t.get('fullName')} | protected={t.get('isProtected')} | status={t.get('status')}\")
" 2>/dev/null || echo "    (Could not parse response)"
}

# ============================================================================
# Frontend Tests
# ============================================================================

test_frontend() {
    print_header "FRONTEND VERIFICATION"

    # Check if Angular CLI is available
    print_test "Angular CLI available"
    if command -v ng &> /dev/null; then
        print_pass
        NG_VERSION=$(ng version 2>/dev/null | grep "Angular CLI" | head -1 || echo "unknown")
        print_info "$NG_VERSION"
    else
        print_skip "ng command not found"
        return 0
    fi

    # Check TypeScript compilation
    print_test "TypeScript compilation"
    cd "$FRONTEND_DIR" 2>/dev/null || { print_skip "Frontend directory not found"; return 0; }

    if ng build --configuration=development 2>&1 | tail -5 | grep -q "Build at\|Compiled successfully"; then
        print_pass
    else
        # Try just type checking
        if npx tsc --noEmit 2>&1 | grep -q "error"; then
            print_fail "TypeScript errors found"
            npx tsc --noEmit 2>&1 | grep "error" | head -5 | sed 's/^/    /'
        else
            print_pass
        fi
    fi

    # Check for Tenant interface includes isProtected
    print_test "Tenant interface includes isProtected"
    if grep -r "isProtected:" "$FRONTEND_DIR/src/app" 2>/dev/null | grep -q "boolean"; then
        print_pass
    else
        print_fail "isProtected not found in Tenant interface"
    fi

    # Check isProtected is mapped when loading tenants
    print_test "isProtected mapped in loadTenants()"
    if grep -A 20 "loadTenants.*void" "$FRONTEND_DIR/src/app/pages/administration/administration.page.ts" 2>/dev/null | grep -q "isProtected.*t\.isProtected"; then
        print_pass
    else
        print_fail "isProtected not mapped in loadTenants() - API field won't reach UI"
        print_info "Add: isProtected: t.isProtected to the tenant mapping"
    fi

    # Check buttons are disabled for protected tenants
    print_test "Edit button disabled for protected tenants"
    if grep -q '\[disabled\]=".*isProtected"' "$FRONTEND_DIR/src/app/pages/administration/administration.page.ts" 2>/dev/null; then
        print_pass
    else
        print_fail "Edit button not disabled for protected tenants"
    fi
}

# ============================================================================
# Summary
# ============================================================================

print_summary() {
    print_header "SMOKE TEST SUMMARY"
    echo ""
    echo -e "  Tests completed at: $(date)"
    echo ""

    if [ "$FAILED" -eq 0 ]; then
        echo -e "  ${GREEN}All tests passed!${NC}"
    else
        echo -e "  ${RED}$FAILED test(s) failed${NC}"
    fi
    echo ""
}

# ============================================================================
# Main
# ============================================================================

FAILED=0

run_test() {
    if ! "$1"; then
        FAILED=$((FAILED + 1))
    fi
}

case "${1:-all}" in
    db|database)
        run_test test_database
        ;;
    migrations)
        run_test test_migrations
        ;;
    services|health)
        run_test test_services
        ;;
    api)
        run_test test_api
        ;;
    frontend|fe)
        run_test test_frontend
        ;;
    all|*)
        run_test test_services
        run_test test_database
        run_test test_migrations
        run_test test_api
        run_test test_frontend
        print_summary
        ;;
esac

exit $FAILED
