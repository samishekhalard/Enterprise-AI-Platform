#!/bin/sh
# ==============================================================================
# Test OAuth2 & OIDC Protocols via Keycloak
# ==============================================================================
# Tests OAuth2 and OIDC flows through Keycloak endpoints.
# Validates: token issuance, token introspection, JWKS, userinfo, refresh,
#            role claims, client credentials, and error cases.
#
# Prerequisites: curl, jq
#
# Usage: ./test-oauth2-oidc.sh
#
# Environment overrides:
#   KC_URL           (default: http://localhost:28180)
#   KC_REALM         (default: master)
#   CLIENT_ID        (default: ems-auth-facade)
#   CLIENT_SECRET    (default: ems-auth-facade-secret)
# ==============================================================================
set -e

KC_URL="${KC_URL:-http://localhost:28180}"
KC_REALM="${KC_REALM:-master}"
CLIENT_ID="${CLIENT_ID:-ems-auth-facade}"
CLIENT_SECRET="${CLIENT_SECRET:-ems-auth-facade-secret}"

TOKEN_URL="${KC_URL}/realms/${KC_REALM}/protocol/openid-connect/token"
USERINFO_URL="${KC_URL}/realms/${KC_REALM}/protocol/openid-connect/userinfo"
INTROSPECT_URL="${KC_URL}/realms/${KC_REALM}/protocol/openid-connect/token/introspect"
JWKS_URL="${KC_URL}/realms/${KC_REALM}/protocol/openid-connect/certs"
DISCOVERY_URL="${KC_URL}/realms/${KC_REALM}/.well-known/openid-configuration"
LOGOUT_URL="${KC_URL}/realms/${KC_REALM}/protocol/openid-connect/logout"

PASS=0
FAIL=0

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

test_pass() { PASS=$((PASS + 1)); printf "${GREEN}  ✓ PASS${NC}: %s\n" "$1"; }
test_fail() { FAIL=$((FAIL + 1)); printf "${RED}  ✗ FAIL${NC}: %s\n" "$1"; }
section()   { printf "\n${YELLOW}━━━ %s ━━━${NC}\n" "$1"; }
subsection(){ printf "\n${CYAN}  --- %s ---${NC}\n" "$1"; }

echo "============================================================================"
echo " OAuth2 & OIDC Protocol Tests"
echo " Keycloak: ${KC_URL}"
echo " Realm:    ${KC_REALM}"
echo " Client:   ${CLIENT_ID}"
echo "============================================================================"

# ==========================================================================
# OIDC DISCOVERY
# ==========================================================================
section "1. OIDC Discovery (.well-known/openid-configuration)"

DISCOVERY=$(curl -sf "${DISCOVERY_URL}" 2>/dev/null) || DISCOVERY=""

if [ -n "$DISCOVERY" ]; then
    test_pass "OIDC discovery endpoint reachable"

    # Validate required fields per OpenID Connect Discovery 1.0
    for field in issuer authorization_endpoint token_endpoint userinfo_endpoint jwks_uri; do
        VALUE=$(echo "$DISCOVERY" | jq -r ".${field} // empty")
        if [ -n "$VALUE" ]; then
            test_pass "Discovery has '${field}': ${VALUE}"
        else
            test_fail "Discovery missing required field '${field}'"
        fi
    done

    # Check supported grant types
    GRANTS=$(echo "$DISCOVERY" | jq -r '.grant_types_supported // [] | join(", ")')
    printf "  Supported grants: %s\n" "$GRANTS"

    # Check supported scopes
    SCOPES=$(echo "$DISCOVERY" | jq -r '.scopes_supported // [] | join(", ")')
    printf "  Supported scopes: %s\n" "$SCOPES"
else
    test_fail "OIDC discovery endpoint unreachable"
fi

# ==========================================================================
# JWKS (JSON Web Key Set)
# ==========================================================================
section "2. JWKS Endpoint"

JWKS=$(curl -sf "${JWKS_URL}" 2>/dev/null) || JWKS=""

if [ -n "$JWKS" ]; then
    KEY_COUNT=$(echo "$JWKS" | jq '.keys | length')
    test_pass "JWKS endpoint reachable (${KEY_COUNT} key(s))"

    # Validate key structure
    FIRST_KEY_ALG=$(echo "$JWKS" | jq -r '.keys[0].alg // empty')
    FIRST_KEY_KTY=$(echo "$JWKS" | jq -r '.keys[0].kty // empty')
    FIRST_KEY_USE=$(echo "$JWKS" | jq -r '.keys[0].use // empty')
    FIRST_KEY_KID=$(echo "$JWKS" | jq -r '.keys[0].kid // empty')

    if [ -n "$FIRST_KEY_KID" ]; then
        test_pass "JWKS key has kid: ${FIRST_KEY_KID} (alg=${FIRST_KEY_ALG}, kty=${FIRST_KEY_KTY}, use=${FIRST_KEY_USE})"
    else
        test_fail "JWKS key missing 'kid'"
    fi
else
    test_fail "JWKS endpoint unreachable"
fi

# ==========================================================================
# OAuth2: Resource Owner Password Credentials (ROPC) Grant
# ==========================================================================
section "3. OAuth2: Resource Owner Password Credentials Grant"

# 3a. Authenticate with LDAP-federated admin user
subsection "3a. LDAP user (admin.user)"

RESPONSE=$(curl -sf -X POST "${TOKEN_URL}" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "grant_type=password" \
    -d "client_id=${CLIENT_ID}" \
    -d "client_secret=${CLIENT_SECRET}" \
    -d "username=admin.user" \
    -d "password=AdminPass1!" \
    -d "scope=openid" 2>&1) || RESPONSE=""

ACCESS_TOKEN=$(echo "$RESPONSE" | jq -r '.access_token // empty')
REFRESH_TOKEN=$(echo "$RESPONSE" | jq -r '.refresh_token // empty')
ID_TOKEN=$(echo "$RESPONSE" | jq -r '.id_token // empty')
TOKEN_TYPE=$(echo "$RESPONSE" | jq -r '.token_type // empty')
EXPIRES_IN=$(echo "$RESPONSE" | jq -r '.expires_in // empty')

# Helper: decode JWT payload (handles macOS/Linux base64 + padding)
decode_jwt() {
    local payload
    payload=$(echo "$1" | cut -d'.' -f2 | tr '_-' '/+')
    local pad=$((4 - ${#payload} % 4))
    [ "$pad" -lt 4 ] && payload="${payload}$(printf '%0.s=' $(seq 1 $pad))"
    echo "$payload" | base64 -d 2>/dev/null || echo "$payload" | base64 -D 2>/dev/null || echo "{}"
}

if [ -n "$ACCESS_TOKEN" ] && [ "$ACCESS_TOKEN" != "null" ]; then
    test_pass "ROPC token obtained for admin.user"
    test_pass "Token type: ${TOKEN_TYPE}"
    test_pass "Expires in: ${EXPIRES_IN}s"

    # Check token has all three parts (JWT)
    if [ -n "$ID_TOKEN" ] && [ "$ID_TOKEN" != "null" ]; then
        test_pass "ID token present (OIDC)"
    else
        test_fail "ID token missing (was 'openid' scope requested?)"
    fi

    if [ -n "$REFRESH_TOKEN" ] && [ "$REFRESH_TOKEN" != "null" ]; then
        test_pass "Refresh token present"
    else
        test_fail "Refresh token missing"
    fi

    # Decode JWT payload (access token)
    JWT_PAYLOAD=$(decode_jwt "$ACCESS_TOKEN")

    # Check realm_access.roles claim
    ROLES=$(echo "$JWT_PAYLOAD" | jq -r '.realm_access.roles // [] | join(", ")' 2>/dev/null || echo "")
    if [ -n "$ROLES" ]; then
        test_pass "JWT contains roles in realm_access.roles: ${ROLES}"
    else
        printf "${YELLOW}  ⚠ WARN${NC}: JWT has no realm_access.roles (LDAP role mapper may need sync)\n"
    fi

    # Check standard OIDC claims
    SUB=$(echo "$JWT_PAYLOAD" | jq -r '.sub // empty' 2>/dev/null || echo "")
    ISS=$(echo "$JWT_PAYLOAD" | jq -r '.iss // empty' 2>/dev/null || echo "")
    AZP=$(echo "$JWT_PAYLOAD" | jq -r '.azp // empty' 2>/dev/null || echo "")
    if [ -n "$SUB" ]; then test_pass "JWT has 'sub' claim: ${SUB}"; else test_fail "JWT missing 'sub'"; fi
    if [ -n "$ISS" ]; then test_pass "JWT has 'iss' claim: ${ISS}"; else test_fail "JWT missing 'iss'"; fi
    if [ "$AZP" = "$CLIENT_ID" ]; then test_pass "JWT 'azp' matches client_id"; else test_fail "JWT 'azp'=${AZP}, expected ${CLIENT_ID}"; fi

    PRIMARY_TOKEN="$ACCESS_TOKEN"
    PRIMARY_REFRESH="$REFRESH_TOKEN"
else
    test_fail "ROPC token request failed for admin.user"
    echo "  Response: $(echo "$RESPONSE" | head -c 200)"
    PRIMARY_TOKEN=""
    PRIMARY_REFRESH=""
fi

# 3b. Authenticate LDAP-federated user (if federation is configured)
subsection "3b. LDAP-federated user (viewer)"

LDAP_RESPONSE=$(curl -sf -X POST "${TOKEN_URL}" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "grant_type=password" \
    -d "client_id=${CLIENT_ID}" \
    -d "client_secret=${CLIENT_SECRET}" \
    -d "username=viewer" \
    -d "password=ViewerPass1!" \
    -d "scope=openid" 2>&1) || LDAP_RESPONSE=""

LDAP_TOKEN=$(echo "$LDAP_RESPONSE" | jq -r '.access_token // empty')

if [ -n "$LDAP_TOKEN" ] && [ "$LDAP_TOKEN" != "null" ]; then
    test_pass "ROPC token obtained for LDAP user 'viewer'"

    LDAP_JWT=$(decode_jwt "$LDAP_TOKEN")
    LDAP_ROLES=$(echo "$LDAP_JWT" | jq -r '.realm_access.roles // [] | join(", ")' 2>/dev/null || echo "")
    LDAP_EMAIL=$(echo "$LDAP_JWT" | jq -r '.email // empty' 2>/dev/null || echo "")

    if echo "$LDAP_ROLES" | grep -q "VIEWER"; then
        test_pass "LDAP user has VIEWER role in JWT"
    else
        printf "${YELLOW}  ⚠ WARN${NC}: LDAP user missing VIEWER role (roles: ${LDAP_ROLES}). Run configure-keycloak-ldap-federation.sh first.\n"
    fi

    if [ "$LDAP_EMAIL" = "viewer@ems.test" ]; then
        test_pass "LDAP user email mapped correctly: ${LDAP_EMAIL}"
    else
        printf "${YELLOW}  ⚠ WARN${NC}: LDAP user email=${LDAP_EMAIL}, expected viewer@ems.test\n"
    fi
else
    printf "${YELLOW}  ⚠ SKIP${NC}: LDAP user 'viewer' not available (run configure-keycloak-ldap-federation.sh first)\n"
fi

# 3c. Wrong credentials
subsection "3c. Negative — wrong password"

BAD_RESPONSE=$(curl -s -X POST "${TOKEN_URL}" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "grant_type=password" \
    -d "client_id=${CLIENT_ID}" \
    -d "client_secret=${CLIENT_SECRET}" \
    -d "username=superadmin" \
    -d "password=WrongPassword123!" 2>&1) || BAD_RESPONSE=""

BAD_ERROR=$(echo "$BAD_RESPONSE" | jq -r '.error // empty')
if [ "$BAD_ERROR" = "invalid_grant" ]; then
    test_pass "Wrong password correctly returns 'invalid_grant'"
else
    test_fail "Wrong password should return 'invalid_grant', got: ${BAD_ERROR}"
fi

# 3d. Wrong client secret
subsection "3d. Negative — wrong client secret"

BAD_CLIENT=$(curl -s -X POST "${TOKEN_URL}" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "grant_type=password" \
    -d "client_id=${CLIENT_ID}" \
    -d "client_secret=wrong-secret" \
    -d "username=superadmin" \
    -d "password=admin" 2>&1) || BAD_CLIENT=""

BAD_CLIENT_ERROR=$(echo "$BAD_CLIENT" | jq -r '.error // empty')
if [ "$BAD_CLIENT_ERROR" = "unauthorized_client" ] || [ "$BAD_CLIENT_ERROR" = "invalid_client" ]; then
    test_pass "Wrong client secret correctly rejected (${BAD_CLIENT_ERROR})"
else
    test_fail "Wrong client secret should be rejected, got: ${BAD_CLIENT_ERROR}"
fi

# ==========================================================================
# OAuth2: Client Credentials Grant
# ==========================================================================
section "4. OAuth2: Client Credentials Grant"

CC_RESPONSE=$(curl -sf -X POST "${TOKEN_URL}" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "grant_type=client_credentials" \
    -d "client_id=${CLIENT_ID}" \
    -d "client_secret=${CLIENT_SECRET}" 2>&1) || CC_RESPONSE=""

CC_TOKEN=$(echo "$CC_RESPONSE" | jq -r '.access_token // empty')

if [ -n "$CC_TOKEN" ] && [ "$CC_TOKEN" != "null" ]; then
    test_pass "Client credentials token obtained"

    CC_JWT=$(decode_jwt "$CC_TOKEN")
    CC_AZP=$(echo "$CC_JWT" | jq -r '.azp // empty' 2>/dev/null || echo "")
    CC_SCOPE=$(echo "$CC_JWT" | jq -r '.scope // empty' 2>/dev/null || echo "")

    if [ "$CC_AZP" = "$CLIENT_ID" ]; then
        test_pass "Client credentials 'azp' matches: ${CC_AZP}"
    else
        test_fail "Client credentials 'azp'=${CC_AZP}, expected ${CLIENT_ID}"
    fi
    printf "  Scopes: %s\n" "$CC_SCOPE"
else
    test_fail "Client credentials grant failed"
fi

# ==========================================================================
# OIDC: Userinfo Endpoint
# ==========================================================================
section "5. OIDC: Userinfo Endpoint"

if [ -n "$PRIMARY_TOKEN" ]; then
    USERINFO=$(curl -sf -H "Authorization: Bearer ${PRIMARY_TOKEN}" "${USERINFO_URL}" 2>/dev/null) || USERINFO=""

    if [ -n "$USERINFO" ]; then
        UI_SUB=$(echo "$USERINFO" | jq -r '.sub // empty')
        UI_EMAIL=$(echo "$USERINFO" | jq -r '.email // empty')
        UI_NAME=$(echo "$USERINFO" | jq -r '.preferred_username // empty')

        test_pass "Userinfo endpoint returned data"
        if [ -n "$UI_SUB" ]; then test_pass "Userinfo 'sub': ${UI_SUB}"; else test_fail "Userinfo missing 'sub'"; fi
        if [ -n "$UI_EMAIL" ]; then test_pass "Userinfo 'email': ${UI_EMAIL}"; fi
        if [ -n "$UI_NAME" ]; then test_pass "Userinfo 'preferred_username': ${UI_NAME}"; fi
    else
        test_fail "Userinfo endpoint returned empty response"
    fi

    # Userinfo with invalid token
    BAD_UI=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "Authorization: Bearer invalid.token.here" "${USERINFO_URL}" 2>/dev/null)
    if [ "$BAD_UI" = "401" ]; then
        test_pass "Userinfo rejects invalid token (HTTP 401)"
    else
        test_fail "Userinfo should return 401 for invalid token, got HTTP ${BAD_UI}"
    fi
else
    printf "${YELLOW}  ⚠ SKIP${NC}: No access token available for userinfo test\n"
fi

# ==========================================================================
# OAuth2: Token Introspection
# ==========================================================================
section "6. OAuth2: Token Introspection"

if [ -n "$PRIMARY_TOKEN" ]; then
    INTROSPECT=$(curl -sf -X POST "${INTROSPECT_URL}" \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "token=${PRIMARY_TOKEN}" \
        -d "client_id=${CLIENT_ID}" \
        -d "client_secret=${CLIENT_SECRET}" 2>/dev/null) || INTROSPECT=""

    if [ -n "$INTROSPECT" ]; then
        ACTIVE=$(echo "$INTROSPECT" | jq -r '.active')
        if [ "$ACTIVE" = "true" ]; then
            test_pass "Token introspection: active=true"
            INT_USER=$(echo "$INTROSPECT" | jq -r '.username // empty')
            INT_CLIENT=$(echo "$INTROSPECT" | jq -r '.client_id // empty')
            printf "  Username: %s, Client: %s\n" "$INT_USER" "$INT_CLIENT"
        else
            test_fail "Token introspection: active=false (token may have expired)"
        fi
    else
        test_fail "Token introspection returned empty response"
    fi

    # Introspect an invalid token
    BAD_INTROSPECT=$(curl -s -X POST "${INTROSPECT_URL}" \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "token=invalid-token" \
        -d "client_id=${CLIENT_ID}" \
        -d "client_secret=${CLIENT_SECRET}" 2>/dev/null) || BAD_INTROSPECT=""

    BAD_ACTIVE=$(echo "$BAD_INTROSPECT" | jq -r '.active | tostring')
    if [ "$BAD_ACTIVE" = "false" ]; then
        test_pass "Invalid token introspection: active=false"
    else
        test_fail "Invalid token introspection should be active=false, got: ${BAD_ACTIVE}"
    fi
else
    printf "${YELLOW}  ⚠ SKIP${NC}: No token for introspection test\n"
fi

# ==========================================================================
# OAuth2: Refresh Token
# ==========================================================================
section "7. OAuth2: Refresh Token Flow"

if [ -n "$PRIMARY_REFRESH" ]; then
    REFRESH_RESPONSE=$(curl -sf -X POST "${TOKEN_URL}" \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "grant_type=refresh_token" \
        -d "client_id=${CLIENT_ID}" \
        -d "client_secret=${CLIENT_SECRET}" \
        -d "refresh_token=${PRIMARY_REFRESH}" 2>&1) || REFRESH_RESPONSE=""

    NEW_TOKEN=$(echo "$REFRESH_RESPONSE" | jq -r '.access_token // empty')
    NEW_REFRESH=$(echo "$REFRESH_RESPONSE" | jq -r '.refresh_token // empty')

    if [ -n "$NEW_TOKEN" ] && [ "$NEW_TOKEN" != "null" ]; then
        test_pass "Refresh token exchange successful"

        if [ "$NEW_TOKEN" != "$PRIMARY_TOKEN" ]; then
            test_pass "New access token differs from original (token rotation)"
        else
            printf "${YELLOW}  ⚠ WARN${NC}: New token is identical to original\n"
        fi

        if [ -n "$NEW_REFRESH" ] && [ "$NEW_REFRESH" != "null" ]; then
            test_pass "New refresh token issued (rotation)"
        fi
    else
        test_fail "Refresh token exchange failed"
    fi

    # Invalid refresh token
    BAD_REFRESH=$(curl -s -X POST "${TOKEN_URL}" \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "grant_type=refresh_token" \
        -d "client_id=${CLIENT_ID}" \
        -d "client_secret=${CLIENT_SECRET}" \
        -d "refresh_token=invalid-refresh-token" 2>&1) || BAD_REFRESH=""

    BAD_REF_ERROR=$(echo "$BAD_REFRESH" | jq -r '.error // empty')
    if [ "$BAD_REF_ERROR" = "invalid_grant" ]; then
        test_pass "Invalid refresh token correctly rejected"
    else
        test_fail "Invalid refresh token should return 'invalid_grant', got: ${BAD_REF_ERROR}"
    fi
else
    printf "${YELLOW}  ⚠ SKIP${NC}: No refresh token for refresh flow test\n"
fi

# ==========================================================================
# OAuth2: Token Revocation / Logout
# ==========================================================================
section "8. OAuth2: Token Revocation (Logout)"

if [ -n "$PRIMARY_TOKEN" ]; then
    LOGOUT_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${LOGOUT_URL}" \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "client_id=${CLIENT_ID}" \
        -d "client_secret=${CLIENT_SECRET}" \
        -d "refresh_token=${PRIMARY_REFRESH}" 2>/dev/null)

    if [ "$LOGOUT_CODE" = "204" ] || [ "$LOGOUT_CODE" = "200" ]; then
        test_pass "Logout/revocation successful (HTTP ${LOGOUT_CODE})"

        # Verify token is now invalid
        sleep 1
        POST_LOGOUT=$(curl -sf -X POST "${INTROSPECT_URL}" \
            -H "Content-Type: application/x-www-form-urlencoded" \
            -d "token=${PRIMARY_REFRESH}" \
            -d "client_id=${CLIENT_ID}" \
            -d "client_secret=${CLIENT_SECRET}" 2>/dev/null) || POST_LOGOUT=""

        POST_ACTIVE=$(echo "$POST_LOGOUT" | jq -r '.active // empty')
        if [ "$POST_ACTIVE" = "false" ]; then
            test_pass "Refresh token invalidated after logout"
        else
            printf "${YELLOW}  ⚠ WARN${NC}: Refresh token may still be active after logout\n"
        fi
    else
        test_fail "Logout returned HTTP ${LOGOUT_CODE}"
    fi
else
    printf "${YELLOW}  ⚠ SKIP${NC}: No token for logout test\n"
fi

# ==========================================================================
# OIDC: Role-Based Access per User
# ==========================================================================
section "9. OIDC: Role Claims per EMS Role"

ROLE_TESTS="
admin.user|AdminPass1!|ADMIN
viewer|ViewerPass1!|VIEWER
manager|ManagerPass1!|MANAGER
"

echo "$ROLE_TESTS" | while IFS='|' read -r username password expected_role; do
    [ -z "$username" ] && continue

    ROLE_RESP=$(curl -sf -X POST "${TOKEN_URL}" \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "grant_type=password" \
        -d "client_id=${CLIENT_ID}" \
        -d "client_secret=${CLIENT_SECRET}" \
        -d "username=${username}" \
        -d "password=${password}" \
        -d "scope=openid" 2>&1) || ROLE_RESP=""

    ROLE_AT=$(echo "$ROLE_RESP" | jq -r '.access_token // empty')
    if [ -n "$ROLE_AT" ] && [ "$ROLE_AT" != "null" ]; then
        ROLE_JWT=$(decode_jwt "$ROLE_AT")
        ROLES=$(echo "$ROLE_JWT" | jq -r '.realm_access.roles // [] | join(", ")' 2>/dev/null || echo "")

        if echo "$ROLES" | grep -q "$expected_role"; then
            test_pass "${username} has ${expected_role} role"
        else
            test_fail "${username} missing ${expected_role}. Found: ${ROLES}"
        fi
    else
        printf "${YELLOW}  ⚠ SKIP${NC}: Could not authenticate as ${username}\n"
    fi
done

# --------------------------------------------------------------------------
# Summary
# --------------------------------------------------------------------------
TOTAL=$((PASS + FAIL))
echo ""
echo "============================================================================"
printf " Results: ${GREEN}${PASS} passed${NC}, ${RED}${FAIL} failed${NC}, ${TOTAL} total\n"
echo "============================================================================"

[ "$FAIL" -eq 0 ] && exit 0 || exit 1
