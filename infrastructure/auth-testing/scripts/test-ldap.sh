#!/bin/sh
# ==============================================================================
# Test LDAP Protocol — Direct LDAP Bind & Search Operations
# ==============================================================================
# Tests the OpenLDAP server directly (not through Keycloak).
# Validates: bind authentication, user search, group membership, negative cases.
#
# Prerequisites: ldapsearch (ldap-utils) installed
#   macOS:  brew install openldap
#   Linux:  apt-get install ldap-utils
#
# Usage: ./test-ldap.sh
# ==============================================================================
set -e

LDAP_HOST="${LDAP_HOST:-localhost}"
LDAP_PORT="${LDAP_PORT:-1389}"
LDAP_URL="ldap://${LDAP_HOST}:${LDAP_PORT}"
BASE_DN="dc=ems,dc=test"
ADMIN_DN="cn=admin,dc=ems,dc=test"
ADMIN_PASS="admin"

PASS=0
FAIL=0

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

test_pass() { PASS=$((PASS + 1)); printf "${GREEN}  ✓ PASS${NC}: %s\n" "$1"; }
test_fail() { FAIL=$((FAIL + 1)); printf "${RED}  ✗ FAIL${NC}: %s\n" "$1"; }
section()   { printf "\n${YELLOW}━━━ %s ━━━${NC}\n" "$1"; }

echo "============================================================================"
echo " LDAP Protocol Tests"
echo " Server: ${LDAP_URL}"
echo "============================================================================"

# --------------------------------------------------------------------------
section "1. Admin Bind"
# --------------------------------------------------------------------------
if ldapsearch -x -H "$LDAP_URL" -D "$ADMIN_DN" -w "$ADMIN_PASS" -b "$BASE_DN" "(objectClass=organization)" dn > /dev/null 2>&1; then
    test_pass "Admin bind successful"
else
    test_fail "Admin bind failed"
fi

# --------------------------------------------------------------------------
section "2. Read-Only Bind"
# --------------------------------------------------------------------------
if ldapsearch -x -H "$LDAP_URL" -D "cn=readonly,dc=ems,dc=test" -w "readonly" -b "$BASE_DN" "(objectClass=organization)" dn > /dev/null 2>&1; then
    test_pass "Read-only bind successful"
else
    test_fail "Read-only bind failed"
fi

# --------------------------------------------------------------------------
section "3. User Authentication (Simple Bind)"
# --------------------------------------------------------------------------
AUTH_TESTS="
uid=viewer,ou=users,dc=ems,dc=test|ViewerPass1!|viewer
uid=testuser,ou=users,dc=ems,dc=test|UserPass1!|testuser
uid=manager,ou=users,dc=ems,dc=test|ManagerPass1!|manager
uid=admin.user,ou=users,dc=ems,dc=test|AdminPass1!|admin.user
uid=superadmin,ou=users,dc=ems,dc=test|SuperAdminPass1!|superadmin
uid=multi.role,ou=users,dc=ems,dc=test|MultiPass1!|multi.role
"

echo "$AUTH_TESTS" | while IFS='|' read -r dn pass label; do
    [ -z "$dn" ] && continue
    if ldapsearch -x -H "$LDAP_URL" -D "$dn" -w "$pass" -b "$dn" "(objectClass=*)" dn > /dev/null 2>&1; then
        test_pass "Bind as ${label}"
    else
        test_fail "Bind as ${label}"
    fi
done

# --------------------------------------------------------------------------
section "4. Negative Authentication Tests"
# --------------------------------------------------------------------------
# Wrong password
if ldapsearch -x -H "$LDAP_URL" -D "uid=viewer,ou=users,dc=ems,dc=test" -w "WrongPassword" -b "$BASE_DN" "(objectClass=*)" dn > /dev/null 2>&1; then
    test_fail "Wrong password should be rejected"
else
    test_pass "Wrong password correctly rejected"
fi

# Non-existent user
if ldapsearch -x -H "$LDAP_URL" -D "uid=nonexistent,ou=users,dc=ems,dc=test" -w "anything" -b "$BASE_DN" "(objectClass=*)" dn > /dev/null 2>&1; then
    test_fail "Non-existent user should be rejected"
else
    test_pass "Non-existent user correctly rejected"
fi

# Disabled user (in disabled OU — can still bind but test search scope)
if ldapsearch -x -H "$LDAP_URL" -D "uid=disabled,ou=disabled,dc=ems,dc=test" -w "DisabledPass1!" -b "uid=disabled,ou=disabled,dc=ems,dc=test" "(objectClass=*)" dn > /dev/null 2>&1; then
    test_pass "Disabled user bind works (LDAP has no native disable — app must check OU)"
else
    test_fail "Disabled user bind"
fi

# --------------------------------------------------------------------------
section "5. User Search"
# --------------------------------------------------------------------------
# Search by uid
RESULT=$(ldapsearch -x -H "$LDAP_URL" -D "$ADMIN_DN" -w "$ADMIN_PASS" -b "ou=users,$BASE_DN" "(uid=manager)" uid mail 2>/dev/null | grep -c "uid: manager" || true)
if [ "$RESULT" -ge 1 ]; then
    test_pass "Search user by uid"
else
    test_fail "Search user by uid"
fi

# Search by email
RESULT=$(ldapsearch -x -H "$LDAP_URL" -D "$ADMIN_DN" -w "$ADMIN_PASS" -b "ou=users,$BASE_DN" "(mail=admin@ems.test)" uid 2>/dev/null | grep -c "uid:" || true)
if [ "$RESULT" -ge 1 ]; then
    test_pass "Search user by email"
else
    test_fail "Search user by email"
fi

# Search all users
USER_COUNT=$(ldapsearch -x -H "$LDAP_URL" -D "$ADMIN_DN" -w "$ADMIN_PASS" -b "ou=users,$BASE_DN" "(objectClass=inetOrgPerson)" uid 2>/dev/null | grep -c "uid:" || true)
if [ "$USER_COUNT" -ge 7 ]; then
    test_pass "Found ${USER_COUNT} users in ou=users"
else
    test_fail "Expected >=7 users, found ${USER_COUNT}"
fi

# Wildcard search
RESULT=$(ldapsearch -x -H "$LDAP_URL" -D "$ADMIN_DN" -w "$ADMIN_PASS" -b "ou=users,$BASE_DN" "(uid=*admin*)" uid 2>/dev/null | grep -c "uid:" || true)
if [ "$RESULT" -ge 1 ]; then
    test_pass "Wildcard search (uid=*admin*)"
else
    test_fail "Wildcard search"
fi

# --------------------------------------------------------------------------
section "6. Group Membership"
# --------------------------------------------------------------------------
# List all groups
GROUP_COUNT=$(ldapsearch -x -H "$LDAP_URL" -D "$ADMIN_DN" -w "$ADMIN_PASS" -b "ou=groups,$BASE_DN" "(objectClass=groupOfNames)" cn 2>/dev/null | grep -c "cn:" || true)
if [ "$GROUP_COUNT" -ge 5 ]; then
    test_pass "Found ${GROUP_COUNT} groups (VIEWER, USER, MANAGER, ADMIN, SUPER_ADMIN)"
else
    test_fail "Expected >=5 groups, found ${GROUP_COUNT}"
fi

# Check multi.role membership
MULTI_GROUPS=$(ldapsearch -x -H "$LDAP_URL" -D "$ADMIN_DN" -w "$ADMIN_PASS" -b "ou=groups,$BASE_DN" "(member=uid=multi.role,ou=users,dc=ems,dc=test)" cn 2>/dev/null | grep -c "cn:" || true)
if [ "$MULTI_GROUPS" -ge 2 ]; then
    test_pass "multi.role belongs to ${MULTI_GROUPS} groups (USER + MANAGER)"
else
    test_fail "multi.role expected in >=2 groups, found ${MULTI_GROUPS}"
fi

# Check user with no group
NO_GROUP=$(ldapsearch -x -H "$LDAP_URL" -D "$ADMIN_DN" -w "$ADMIN_PASS" -b "ou=groups,$BASE_DN" "(member=uid=new.user,ou=users,dc=ems,dc=test)" cn 2>/dev/null | grep -c "cn:" || true)
if [ "$NO_GROUP" -eq 0 ]; then
    test_pass "new.user has no group membership (as expected)"
else
    test_fail "new.user should have 0 groups, found ${NO_GROUP}"
fi

# --------------------------------------------------------------------------
section "7. Service Account"
# --------------------------------------------------------------------------
if ldapwhoami -x -H "$LDAP_URL" -D "uid=svc-ems-auth,ou=service-accounts,dc=ems,dc=test" -w "SvcAuthPass1!" > /dev/null 2>&1; then
    test_pass "Service account bind"
else
    test_fail "Service account bind"
fi

# --------------------------------------------------------------------------
# Summary
# --------------------------------------------------------------------------
TOTAL=$((PASS + FAIL))
echo ""
echo "============================================================================"
printf " Results: ${GREEN}${PASS} passed${NC}, ${RED}${FAIL} failed${NC}, ${TOTAL} total\n"
echo "============================================================================"

[ "$FAIL" -eq 0 ] && exit 0 || exit 1
