#!/bin/sh
# ==============================================================================
# EMSIST Auth Testing — Run All Protocol Tests
# ==============================================================================
# Runs LDAP, OAuth2, and OIDC tests in sequence with a combined summary.
#
# Usage: ./test-all-protocols.sh
#
# Environment overrides (forwarded to sub-scripts):
#   KC_URL, KC_REALM, CLIENT_ID, CLIENT_SECRET
#   LDAP_HOST, LDAP_PORT
#   SUPERADMIN_PASSWORD
# ==============================================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

TOTAL_SUITES=0
PASSED_SUITES=0
FAILED_SUITES=0

echo ""
echo "╔══════════════════════════════════════════════════════════════════════════╗"
echo "║                  EMSIST Auth Protocol Test Suite                        ║"
echo "║                  LDAP · OAuth2 · OIDC                                  ║"
echo "╚══════════════════════════════════════════════════════════════════════════╝"
echo ""

# --------------------------------------------------------------------------
# Pre-flight checks
# --------------------------------------------------------------------------
printf "${CYAN}Pre-flight checks...${NC}\n"

# Check ldapsearch
if command -v ldapsearch > /dev/null 2>&1; then
    printf "  ✓ ldapsearch available\n"
else
    printf "  ${YELLOW}⚠ ldapsearch not found — LDAP tests will be skipped${NC}\n"
    printf "    Install: brew install openldap (macOS) or apt install ldap-utils (Linux)\n"
    SKIP_LDAP=true
fi

# Check curl
if command -v curl > /dev/null 2>&1; then
    printf "  ✓ curl available\n"
else
    printf "  ${RED}✗ curl not found — cannot run tests${NC}\n"
    exit 1
fi

# Check jq
if command -v jq > /dev/null 2>&1; then
    printf "  ✓ jq available\n"
else
    printf "  ${RED}✗ jq not found — install with: brew install jq${NC}\n"
    exit 1
fi

# Check OpenLDAP is reachable
if [ "$SKIP_LDAP" != "true" ]; then
    LDAP_HOST="${LDAP_HOST:-localhost}"
    LDAP_PORT="${LDAP_PORT:-1389}"
    if ldapsearch -x -H "ldap://${LDAP_HOST}:${LDAP_PORT}" -b "dc=ems,dc=test" -D "cn=admin,dc=ems,dc=test" -w admin "(objectClass=organization)" dn > /dev/null 2>&1; then
        printf "  ✓ OpenLDAP reachable at ${LDAP_HOST}:${LDAP_PORT}\n"
    else
        printf "  ${YELLOW}⚠ OpenLDAP not reachable — LDAP tests will be skipped${NC}\n"
        SKIP_LDAP=true
    fi
fi

# Check Keycloak is reachable
KC_URL="${KC_URL:-http://localhost:28180}"
if curl -sf "${KC_URL}/health/ready" > /dev/null 2>&1; then
    printf "  ✓ Keycloak reachable at ${KC_URL}\n"
else
    # Try alternate port
    KC_URL="http://localhost:8180"
    if curl -sf "${KC_URL}/health/ready" > /dev/null 2>&1; then
        printf "  ✓ Keycloak reachable at ${KC_URL}\n"
        export KC_URL
    else
        printf "  ${RED}✗ Keycloak not reachable — OAuth2/OIDC tests will fail${NC}\n"
    fi
fi

echo ""

# --------------------------------------------------------------------------
# Run LDAP tests
# --------------------------------------------------------------------------
if [ "$SKIP_LDAP" != "true" ]; then
    TOTAL_SUITES=$((TOTAL_SUITES + 1))
    printf "${CYAN}▶ Running LDAP protocol tests...${NC}\n"
    if sh "${SCRIPT_DIR}/test-ldap.sh"; then
        PASSED_SUITES=$((PASSED_SUITES + 1))
    else
        FAILED_SUITES=$((FAILED_SUITES + 1))
    fi
else
    printf "${YELLOW}▷ Skipping LDAP tests${NC}\n"
fi

echo ""

# --------------------------------------------------------------------------
# Run OAuth2 + OIDC tests
# --------------------------------------------------------------------------
TOTAL_SUITES=$((TOTAL_SUITES + 1))
printf "${CYAN}▶ Running OAuth2 & OIDC protocol tests...${NC}\n"
if sh "${SCRIPT_DIR}/test-oauth2-oidc.sh"; then
    PASSED_SUITES=$((PASSED_SUITES + 1))
else
    FAILED_SUITES=$((FAILED_SUITES + 1))
fi

# --------------------------------------------------------------------------
# Combined summary
# --------------------------------------------------------------------------
echo ""
echo "╔══════════════════════════════════════════════════════════════════════════╗"
printf "║  Suite Results: ${GREEN}${PASSED_SUITES} passed${NC}, ${RED}${FAILED_SUITES} failed${NC}, ${TOTAL_SUITES} total"
# Pad to fill the box
printf "%*s║\n" $((34 - ${#PASSED_SUITES} - ${#FAILED_SUITES} - ${#TOTAL_SUITES})) ""
echo "╠══════════════════════════════════════════════════════════════════════════╣"
echo "║                                                                        ║"
if [ "$FAILED_SUITES" -eq 0 ]; then
    echo "║  All protocol tests passed!                                           ║"
else
    echo "║  Some tests failed — check output above for details.                  ║"
fi
echo "║                                                                        ║"
echo "╚══════════════════════════════════════════════════════════════════════════╝"

[ "$FAILED_SUITES" -eq 0 ] && exit 0 || exit 1
