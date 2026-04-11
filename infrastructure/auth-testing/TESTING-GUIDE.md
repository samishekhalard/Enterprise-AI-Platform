# EMSIST Auth Testing Guide

Manual testing guide for LDAP, OAuth2, and OIDC protocols against the EMSIST auth testing infrastructure.

## Prerequisites

**Required tools:**

```bash
# Verify all tools are installed
ldapsearch -VV          # LDAP client (brew install openldap / apt install ldap-utils)
curl --version          # HTTP client
jq --version            # JSON processor (brew install jq / apt install jq)
```

**Running services:**

| Service | URL | Purpose |
|---------|-----|---------|
| Keycloak | http://localhost:28180 | Identity provider (OAuth2/OIDC) |
| OpenLDAP | ldap://localhost:1389 | Directory server |
| phpLDAPadmin | https://localhost:6443 | LDAP web UI |
| Auth Facade | http://localhost:8081 | EMSIST auth API (optional) |
| API Gateway | http://localhost:8080 | EMSIST gateway (optional) |

**Start the stack:**

```bash
cd infrastructure/auth-testing

# Start OpenLDAP + phpLDAPadmin (requires ems-dev-backend network from main docker-compose)
docker compose -f docker-compose.auth-testing.yml up -d

# Configure Keycloak LDAP federation (run once after Keycloak is healthy)
./scripts/configure-keycloak-ldap-federation.sh
```

**Test users:**

| Username | Password | Email | Role(s) |
|----------|----------|-------|---------|
| viewer | ViewerPass1! | viewer@ems.test | VIEWER |
| testuser | UserPass1! | user@ems.test | USER |
| manager | ManagerPass1! | manager@ems.test | MANAGER |
| admin.user | AdminPass1! | admin@ems.test | ADMIN |
| superadmin | SuperAdminPass1! | superadmin@ems.test | SUPER_ADMIN |
| multi.role | MultiPass1! | multi.role@ems.test | USER + MANAGER |
| new.user | NewUserPass1! | new.user@ems.test | (none) |
| disabled | DisabledPass1! | disabled@ems.test | (disabled OU) |

---

## 1. LDAP Testing

### 1.1 Admin Bind

Verify the LDAP admin account can bind and query the directory.

```bash
ldapsearch -x -H ldap://localhost:1389 \
  -D "cn=admin,dc=ems,dc=test" \
  -w "admin" \
  -b "dc=ems,dc=test" \
  "(objectClass=organization)" dn
```

Expected: Returns the organization DN `dc=ems,dc=test`.

### 1.2 User Bind (Authentication)

Authenticate as a specific user by binding with their DN and password.

```bash
# Bind as viewer
ldapsearch -x -H ldap://localhost:1389 \
  -D "uid=viewer,ou=users,dc=ems,dc=test" \
  -w "ViewerPass1!" \
  -b "uid=viewer,ou=users,dc=ems,dc=test" \
  "(objectClass=*)" uid cn mail

# Bind as admin.user
ldapsearch -x -H ldap://localhost:1389 \
  -D "uid=admin.user,ou=users,dc=ems,dc=test" \
  -w "AdminPass1!" \
  -b "uid=admin.user,ou=users,dc=ems,dc=test" \
  "(objectClass=*)" uid cn mail

# Negative test: wrong password (should fail with ldap_bind: Invalid credentials (49))
ldapsearch -x -H ldap://localhost:1389 \
  -D "uid=viewer,ou=users,dc=ems,dc=test" \
  -w "WrongPassword" \
  -b "dc=ems,dc=test" "(objectClass=*)" dn
```

### 1.3 Search by UID

```bash
ldapsearch -x -H ldap://localhost:1389 \
  -D "cn=admin,dc=ems,dc=test" \
  -w "admin" \
  -b "ou=users,dc=ems,dc=test" \
  "(uid=manager)" \
  uid cn mail title employeeNumber
```

Expected: Returns the manager user with all requested attributes.

### 1.4 Search by Email

```bash
ldapsearch -x -H ldap://localhost:1389 \
  -D "cn=admin,dc=ems,dc=test" \
  -w "admin" \
  -b "ou=users,dc=ems,dc=test" \
  "(mail=admin@ems.test)" \
  uid cn mail
```

Expected: Returns `uid=admin.user`.

### 1.5 Wildcard Search

```bash
ldapsearch -x -H ldap://localhost:1389 \
  -D "cn=admin,dc=ems,dc=test" \
  -w "admin" \
  -b "ou=users,dc=ems,dc=test" \
  "(uid=*admin*)" \
  uid cn mail
```

### 1.6 List All Users

```bash
ldapsearch -x -H ldap://localhost:1389 \
  -D "cn=admin,dc=ems,dc=test" \
  -w "admin" \
  -b "ou=users,dc=ems,dc=test" \
  "(objectClass=inetOrgPerson)" \
  uid cn mail title
```

Expected: Returns 7 users (viewer, testuser, manager, admin.user, superadmin, multi.role, new.user).

### 1.7 Group Membership Check

```bash
# List all groups
ldapsearch -x -H ldap://localhost:1389 \
  -D "cn=admin,dc=ems,dc=test" \
  -w "admin" \
  -b "ou=groups,dc=ems,dc=test" \
  "(objectClass=groupOfNames)" \
  cn member

# Find groups for a specific user (multi.role belongs to USER + MANAGER)
ldapsearch -x -H ldap://localhost:1389 \
  -D "cn=admin,dc=ems,dc=test" \
  -w "admin" \
  -b "ou=groups,dc=ems,dc=test" \
  "(member=uid=multi.role,ou=users,dc=ems,dc=test)" \
  cn

# Verify new.user has no group membership
ldapsearch -x -H ldap://localhost:1389 \
  -D "cn=admin,dc=ems,dc=test" \
  -w "admin" \
  -b "ou=groups,dc=ems,dc=test" \
  "(member=uid=new.user,ou=users,dc=ems,dc=test)" \
  cn
```

Expected for multi.role: Returns `cn=USER` and `cn=MANAGER`.
Expected for new.user: Returns zero entries.

### 1.8 Service Account Bind

```bash
ldapwhoami -x -H ldap://localhost:1389 \
  -D "uid=svc-ems-auth,ou=service-accounts,dc=ems,dc=test" \
  -w "SvcAuthPass1!"
```

Expected: Returns the bound DN.

### 1.9 phpLDAPadmin Web UI

1. Open https://localhost:6443 (accept the self-signed certificate warning).
2. Login DN: `cn=admin,dc=ems,dc=test`
3. Password: `admin`
4. Browse the tree: `dc=ems,dc=test` > `ou=users` / `ou=groups` / `ou=service-accounts` / `ou=disabled`

---

## 2. OAuth2 Testing

All OAuth2 flows go through Keycloak. The client `ems-auth-facade` must be configured in Keycloak before these work.

### Shell Variables

Set these once and reuse throughout the session:

```bash
KC_URL="http://localhost:28180"
KC_REALM="master"
CLIENT_ID="ems-auth-facade"
CLIENT_SECRET="ems-auth-facade-secret"
TOKEN_URL="${KC_URL}/realms/${KC_REALM}/protocol/openid-connect/token"
```

### 2.1 Resource Owner Password Credentials (ROPC) Grant

Exchange username and password for tokens directly.

```bash
curl -s -X POST "${TOKEN_URL}" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" \
  -d "client_id=${CLIENT_ID}" \
  -d "client_secret=${CLIENT_SECRET}" \
  -d "username=admin.user" \
  -d "password=AdminPass1!" \
  -d "scope=openid" | jq .
```

Expected response fields:
- `access_token` -- JWT access token
- `refresh_token` -- used for token refresh
- `id_token` -- OIDC identity token (because `scope=openid`)
- `token_type` -- `"Bearer"`
- `expires_in` -- token lifetime in seconds

**Save the tokens for subsequent commands:**

```bash
RESPONSE=$(curl -s -X POST "${TOKEN_URL}" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" \
  -d "client_id=${CLIENT_ID}" \
  -d "client_secret=${CLIENT_SECRET}" \
  -d "username=admin.user" \
  -d "password=AdminPass1!" \
  -d "scope=openid")

ACCESS_TOKEN=$(echo "$RESPONSE" | jq -r '.access_token')
REFRESH_TOKEN=$(echo "$RESPONSE" | jq -r '.refresh_token')
ID_TOKEN=$(echo "$RESPONSE" | jq -r '.id_token')

echo "Access Token: ${ACCESS_TOKEN:0:50}..."
echo "Refresh Token: ${REFRESH_TOKEN:0:50}..."
```

### 2.2 Client Credentials Grant

Service-to-service authentication without a user context.

```bash
curl -s -X POST "${TOKEN_URL}" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=${CLIENT_ID}" \
  -d "client_secret=${CLIENT_SECRET}" | jq .
```

Expected: Returns `access_token` and `token_type`. No `refresh_token` or `id_token` (no user involved).

### 2.3 Refresh Token Flow

Exchange a refresh token for a new access token.

```bash
curl -s -X POST "${TOKEN_URL}" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=refresh_token" \
  -d "client_id=${CLIENT_ID}" \
  -d "client_secret=${CLIENT_SECRET}" \
  -d "refresh_token=${REFRESH_TOKEN}" | jq .
```

Expected: Returns a new `access_token` and a rotated `refresh_token`. The old refresh token becomes invalid (Keycloak refresh token rotation).

**Update your variables after refresh:**

```bash
REFRESH_RESPONSE=$(curl -s -X POST "${TOKEN_URL}" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=refresh_token" \
  -d "client_id=${CLIENT_ID}" \
  -d "client_secret=${CLIENT_SECRET}" \
  -d "refresh_token=${REFRESH_TOKEN}")

ACCESS_TOKEN=$(echo "$REFRESH_RESPONSE" | jq -r '.access_token')
REFRESH_TOKEN=$(echo "$REFRESH_RESPONSE" | jq -r '.refresh_token')
```

### 2.4 Token Introspection

Verify whether a token is active and inspect its claims.

```bash
curl -s -X POST "${KC_URL}/realms/${KC_REALM}/protocol/openid-connect/token/introspect" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "token=${ACCESS_TOKEN}" \
  -d "client_id=${CLIENT_ID}" \
  -d "client_secret=${CLIENT_SECRET}" | jq .
```

Expected: `"active": true` with claims including `username`, `client_id`, `realm_access.roles`.

**Introspect an invalid token:**

```bash
curl -s -X POST "${KC_URL}/realms/${KC_REALM}/protocol/openid-connect/token/introspect" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "token=invalid-token-value" \
  -d "client_id=${CLIENT_ID}" \
  -d "client_secret=${CLIENT_SECRET}" | jq .
```

Expected: `{ "active": false }`

### 2.5 Token Revocation / Logout

Invalidate the refresh token and end the session.

```bash
curl -s -o /dev/null -w "HTTP %{http_code}\n" -X POST \
  "${KC_URL}/realms/${KC_REALM}/protocol/openid-connect/logout" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=${CLIENT_ID}" \
  -d "client_secret=${CLIENT_SECRET}" \
  -d "refresh_token=${REFRESH_TOKEN}"
```

Expected: HTTP 204 (No Content). The refresh token is now invalid.

**Verify revocation by introspecting the refresh token:**

```bash
curl -s -X POST "${KC_URL}/realms/${KC_REALM}/protocol/openid-connect/token/introspect" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "token=${REFRESH_TOKEN}" \
  -d "client_id=${CLIENT_ID}" \
  -d "client_secret=${CLIENT_SECRET}" | jq .active
```

Expected: `false`

---

## 3. OIDC Testing

### 3.1 Discovery Endpoint

The OIDC discovery document provides all endpoint URLs and supported features.

```bash
curl -s "${KC_URL}/realms/${KC_REALM}/.well-known/openid-configuration" | jq .
```

**Verify these required fields are present:**
- `issuer` -- must match `http://localhost:28180/realms/master`
- `authorization_endpoint` -- for Authorization Code flow
- `token_endpoint` -- for token requests
- `userinfo_endpoint` -- for user profile
- `jwks_uri` -- for public key retrieval
- `grant_types_supported` -- should include `password`, `client_credentials`, `refresh_token`, `authorization_code`
- `scopes_supported` -- should include `openid`, `profile`, `email`

**Quick validation:**

```bash
curl -s "${KC_URL}/realms/${KC_REALM}/.well-known/openid-configuration" | \
  jq '{issuer, token_endpoint, userinfo_endpoint, jwks_uri, grant_types_supported, scopes_supported}'
```

### 3.2 JWKS Endpoint

Retrieve the public keys used to verify JWT signatures.

```bash
curl -s "${KC_URL}/realms/${KC_REALM}/protocol/openid-connect/certs" | jq .
```

**Verify key structure:**

```bash
curl -s "${KC_URL}/realms/${KC_REALM}/protocol/openid-connect/certs" | \
  jq '.keys[] | {kid, kty, alg, use}'
```

Expected: At least one key with `kty: "RSA"`, `alg: "RS256"`, `use: "sig"`, and a `kid` value.

### 3.3 Userinfo Endpoint

Retrieve profile claims for the authenticated user.

```bash
curl -s -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  "${KC_URL}/realms/${KC_REALM}/protocol/openid-connect/userinfo" | jq .
```

Expected: Returns `sub`, `preferred_username`, `email`, and other profile claims.

**Negative test (invalid token):**

```bash
curl -s -o /dev/null -w "HTTP %{http_code}\n" \
  -H "Authorization: Bearer invalid.token.here" \
  "${KC_URL}/realms/${KC_REALM}/protocol/openid-connect/userinfo"
```

Expected: HTTP 401.

### 3.4 JWT Decode (Without Verification)

Decode a JWT payload locally using base64 and jq. This does NOT verify the signature -- it is for inspection only.

```bash
# Decode the access token payload
echo "$ACCESS_TOKEN" | cut -d'.' -f2 | tr '_-' '/+' | \
  awk '{pad=length%4; if(pad==2) printf "%s==", $0; else if(pad==3) printf "%s=", $0; else print $0}' | \
  base64 -d 2>/dev/null | jq .

# Decode the ID token payload
echo "$ID_TOKEN" | cut -d'.' -f2 | tr '_-' '/+' | \
  awk '{pad=length%4; if(pad==2) printf "%s==", $0; else if(pad==3) printf "%s=", $0; else print $0}' | \
  base64 -d 2>/dev/null | jq .
```

**Convenience function (add to your shell session):**

```bash
decode_jwt() {
  local payload
  payload=$(echo "$1" | cut -d'.' -f2 | tr '_-' '/+')
  local pad=$((4 - ${#payload} % 4))
  [ "$pad" -lt 4 ] && payload="${payload}$(printf '%0.s=' $(seq 1 $pad))"
  echo "$payload" | base64 -d 2>/dev/null | jq .
}

# Usage:
decode_jwt "$ACCESS_TOKEN"
decode_jwt "$ID_TOKEN"
```

### 3.5 ID Token Validation Checklist

After decoding the ID token, verify these claims:

| Claim | Expected Value | Description |
|-------|---------------|-------------|
| `iss` | `http://localhost:28180/realms/master` | Issuer must match Keycloak realm URL |
| `aud` | Contains `ems-auth-facade` | Audience must include the client ID |
| `sub` | Non-empty UUID | Subject identifier for the user |
| `azp` | `ems-auth-facade` | Authorized party (client that requested the token) |
| `exp` | Future timestamp | Token must not be expired |
| `iat` | Past timestamp | Issued-at must be in the past |
| `email` | User's email address | Email claim (if `email` scope requested) |
| `preferred_username` | User's username | Username from LDAP `uid` attribute |

**Validate expiration:**

```bash
# Check if access token is still valid
decode_jwt "$ACCESS_TOKEN" | jq '{
  exp: .exp,
  exp_human: (.exp | todate),
  iat: .iat,
  iat_human: (.iat | todate),
  remaining_seconds: (.exp - now | floor)
}'
```

---

## 4. Role-Based Access Testing

### 4.1 Compare JWT Roles Across Users

Get tokens for each role-level user and compare the `realm_access.roles` claim.

```bash
for user_pass in "viewer:ViewerPass1!" "testuser:UserPass1!" "manager:ManagerPass1!" "admin.user:AdminPass1!" "superadmin:SuperAdminPass1!" "multi.role:MultiPass1!"; do
  USER=$(echo "$user_pass" | cut -d: -f1)
  PASS=$(echo "$user_pass" | cut -d: -f2)

  TOKEN=$(curl -s -X POST "${TOKEN_URL}" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "grant_type=password" \
    -d "client_id=${CLIENT_ID}" \
    -d "client_secret=${CLIENT_SECRET}" \
    -d "username=${USER}" \
    -d "password=${PASS}" \
    -d "scope=openid" | jq -r '.access_token // empty')

  if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
    ROLES=$(decode_jwt "$TOKEN" | jq -r '.realm_access.roles // [] | map(select(startswith("VIEWER") or startswith("USER") or startswith("MANAGER") or startswith("ADMIN") or startswith("SUPER_ADMIN"))) | join(", ")')
    printf "%-14s -> EMS roles: %s\n" "$USER" "${ROLES:-<none>}"
  else
    printf "%-14s -> FAILED to authenticate\n" "$USER"
  fi
done
```

Expected output (after LDAP federation and role sync):

```
viewer         -> EMS roles: VIEWER
testuser       -> EMS roles: USER
manager        -> EMS roles: MANAGER
admin.user     -> EMS roles: ADMIN
superadmin     -> EMS roles: SUPER_ADMIN
multi.role     -> EMS roles: USER, MANAGER
```

### 4.2 Test API Gateway Role Enforcement

If the API Gateway is running on port 8080, test that endpoints enforce role requirements.

```bash
# Get a VIEWER token
VIEWER_TOKEN=$(curl -s -X POST "${TOKEN_URL}" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" \
  -d "client_id=${CLIENT_ID}" \
  -d "client_secret=${CLIENT_SECRET}" \
  -d "username=viewer" \
  -d "password=ViewerPass1!" \
  -d "scope=openid" | jq -r '.access_token')

# Get an ADMIN token
ADMIN_TOKEN=$(curl -s -X POST "${TOKEN_URL}" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" \
  -d "client_id=${CLIENT_ID}" \
  -d "client_secret=${CLIENT_SECRET}" \
  -d "username=admin.user" \
  -d "password=AdminPass1!" \
  -d "scope=openid" | jq -r '.access_token')

# Test an admin-only endpoint with VIEWER token (expect 403)
curl -s -o /dev/null -w "HTTP %{http_code}\n" \
  -H "Authorization: Bearer ${VIEWER_TOKEN}" \
  -H "X-Tenant-ID: default" \
  "http://localhost:8080/api/v1/admin/users"

# Test the same endpoint with ADMIN token (expect 200)
curl -s -o /dev/null -w "HTTP %{http_code}\n" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "X-Tenant-ID: default" \
  "http://localhost:8080/api/v1/admin/users"

# Test with no token (expect 401)
curl -s -o /dev/null -w "HTTP %{http_code}\n" \
  -H "X-Tenant-ID: default" \
  "http://localhost:8080/api/v1/admin/users"
```

---

## 5. Auth Facade API Testing

The Auth Facade (http://localhost:8081) wraps Keycloak with a simplified REST API. All requests require the `X-Tenant-ID` header.

### 5.1 Login

```bash
curl -s -X POST http://localhost:8081/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: default" \
  -d '{
    "identifier": "admin.user",
    "password": "AdminPass1!"
  }' | jq .
```

Expected response:

```json
{
  "accessToken": "eyJhbG...",
  "refreshToken": "eyJhbG...",
  "expiresIn": 300,
  "tokenType": "Bearer",
  "user": {
    "id": "...",
    "email": "admin@ems.test",
    "firstName": "Test",
    "lastName": "Admin",
    "tenantId": "default",
    "roles": ["ADMIN"]
  },
  "mfaRequired": false
}
```

**Save tokens for subsequent calls:**

```bash
FACADE_RESPONSE=$(curl -s -X POST http://localhost:8081/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: default" \
  -d '{"identifier": "admin.user", "password": "AdminPass1!"}')

FACADE_ACCESS=$(echo "$FACADE_RESPONSE" | jq -r '.accessToken')
FACADE_REFRESH=$(echo "$FACADE_RESPONSE" | jq -r '.refreshToken')
```

**Login by email (the `identifier` field accepts either username or email):**

```bash
curl -s -X POST http://localhost:8081/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: default" \
  -d '{
    "identifier": "admin@ems.test",
    "password": "AdminPass1!"
  }' | jq .
```

**Negative test (wrong password):**

```bash
curl -s -o /dev/null -w "HTTP %{http_code}\n" -X POST http://localhost:8081/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: default" \
  -d '{"identifier": "admin.user", "password": "WrongPassword"}'
```

Expected: HTTP 401.

### 5.2 Refresh Token

```bash
curl -s -X POST http://localhost:8081/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: default" \
  -d "{
    \"refreshToken\": \"${FACADE_REFRESH}\"
  }" | jq .
```

Expected: Returns new `accessToken` and `refreshToken`.

### 5.3 Logout

```bash
curl -s -o /dev/null -w "HTTP %{http_code}\n" -X POST http://localhost:8081/api/v1/auth/logout \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: default" \
  -H "Authorization: Bearer ${FACADE_ACCESS}" \
  -d "{
    \"refreshToken\": \"${FACADE_REFRESH}\"
  }"
```

Expected: HTTP 204.

### 5.4 List Available Providers

```bash
curl -s http://localhost:8081/api/v1/auth/providers \
  -H "X-Tenant-ID: default" | jq .
```

Expected: Returns configured identity providers including `google`, `microsoft`, `saml`.

**Without tenant header (returns default providers):**

```bash
curl -s http://localhost:8081/api/v1/auth/providers | jq .
```

### 5.5 Get Current User Profile

```bash
curl -s http://localhost:8081/api/v1/auth/me \
  -H "Authorization: Bearer ${FACADE_ACCESS}" \
  -H "X-Tenant-ID: default" | jq .
```

Expected response:

```json
{
  "id": "...",
  "email": "admin@ems.test",
  "firstName": "Test",
  "lastName": "Admin",
  "tenantId": "default",
  "roles": ["ADMIN"]
}
```

---

## 6. Postman Collection

Import the following JSON file into Postman (File > Import > Raw Text).

```json
{
  "info": {
    "name": "EMSIST Auth Testing",
    "description": "Manual testing collection for LDAP-federated OAuth2/OIDC authentication via Keycloak and the EMSIST Auth Facade.",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    { "key": "KC_URL", "value": "http://localhost:28180" },
    { "key": "KC_REALM", "value": "master" },
    { "key": "CLIENT_ID", "value": "ems-auth-facade" },
    { "key": "CLIENT_SECRET", "value": "ems-auth-facade-secret" },
    { "key": "ACCESS_TOKEN", "value": "" },
    { "key": "REFRESH_TOKEN", "value": "" },
    { "key": "ID_TOKEN", "value": "" },
    { "key": "AUTH_FACADE_URL", "value": "http://localhost:8081" },
    { "key": "API_GATEWAY_URL", "value": "http://localhost:8080" },
    { "key": "TENANT_ID", "value": "default" }
  ],
  "item": [
    {
      "name": "OIDC Discovery",
      "item": [
        {
          "name": "OpenID Configuration",
          "request": {
            "method": "GET",
            "url": "{{KC_URL}}/realms/{{KC_REALM}}/.well-known/openid-configuration"
          },
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('Discovery returns 200', () => pm.response.to.have.status(200));",
                  "pm.test('Has issuer', () => pm.expect(pm.response.json().issuer).to.include('realms'));",
                  "pm.test('Has token_endpoint', () => pm.expect(pm.response.json().token_endpoint).to.be.a('string'));",
                  "pm.test('Has jwks_uri', () => pm.expect(pm.response.json().jwks_uri).to.be.a('string'));"
                ]
              }
            }
          ]
        },
        {
          "name": "JWKS (Public Keys)",
          "request": {
            "method": "GET",
            "url": "{{KC_URL}}/realms/{{KC_REALM}}/protocol/openid-connect/certs"
          },
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('JWKS returns 200', () => pm.response.to.have.status(200));",
                  "pm.test('Has at least one key', () => pm.expect(pm.response.json().keys.length).to.be.above(0));",
                  "pm.test('Key has kid', () => pm.expect(pm.response.json().keys[0].kid).to.be.a('string'));"
                ]
              }
            }
          ]
        }
      ]
    },
    {
      "name": "OAuth2 Flows",
      "item": [
        {
          "name": "ROPC - Login as admin.user",
          "request": {
            "method": "POST",
            "url": "{{KC_URL}}/realms/{{KC_REALM}}/protocol/openid-connect/token",
            "header": [
              { "key": "Content-Type", "value": "application/x-www-form-urlencoded" }
            ],
            "body": {
              "mode": "urlencoded",
              "urlencoded": [
                { "key": "grant_type", "value": "password" },
                { "key": "client_id", "value": "{{CLIENT_ID}}" },
                { "key": "client_secret", "value": "{{CLIENT_SECRET}}" },
                { "key": "username", "value": "admin.user" },
                { "key": "password", "value": "AdminPass1!" },
                { "key": "scope", "value": "openid" }
              ]
            }
          },
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('Token returned', () => pm.response.to.have.status(200));",
                  "const json = pm.response.json();",
                  "pm.test('Has access_token', () => pm.expect(json.access_token).to.be.a('string'));",
                  "pm.test('Has refresh_token', () => pm.expect(json.refresh_token).to.be.a('string'));",
                  "pm.test('Has id_token', () => pm.expect(json.id_token).to.be.a('string'));",
                  "pm.collectionVariables.set('ACCESS_TOKEN', json.access_token);",
                  "pm.collectionVariables.set('REFRESH_TOKEN', json.refresh_token);",
                  "pm.collectionVariables.set('ID_TOKEN', json.id_token);"
                ]
              }
            }
          ]
        },
        {
          "name": "ROPC - Login as viewer",
          "request": {
            "method": "POST",
            "url": "{{KC_URL}}/realms/{{KC_REALM}}/protocol/openid-connect/token",
            "header": [
              { "key": "Content-Type", "value": "application/x-www-form-urlencoded" }
            ],
            "body": {
              "mode": "urlencoded",
              "urlencoded": [
                { "key": "grant_type", "value": "password" },
                { "key": "client_id", "value": "{{CLIENT_ID}}" },
                { "key": "client_secret", "value": "{{CLIENT_SECRET}}" },
                { "key": "username", "value": "viewer" },
                { "key": "password", "value": "ViewerPass1!" },
                { "key": "scope", "value": "openid" }
              ]
            }
          },
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('Token returned', () => pm.response.to.have.status(200));",
                  "const json = pm.response.json();",
                  "pm.test('Has access_token', () => pm.expect(json.access_token).to.be.a('string'));"
                ]
              }
            }
          ]
        },
        {
          "name": "ROPC - Wrong Password (expect 401)",
          "request": {
            "method": "POST",
            "url": "{{KC_URL}}/realms/{{KC_REALM}}/protocol/openid-connect/token",
            "header": [
              { "key": "Content-Type", "value": "application/x-www-form-urlencoded" }
            ],
            "body": {
              "mode": "urlencoded",
              "urlencoded": [
                { "key": "grant_type", "value": "password" },
                { "key": "client_id", "value": "{{CLIENT_ID}}" },
                { "key": "client_secret", "value": "{{CLIENT_SECRET}}" },
                { "key": "username", "value": "admin.user" },
                { "key": "password", "value": "WrongPassword!" },
                { "key": "scope", "value": "openid" }
              ]
            }
          },
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('Returns 401', () => pm.response.to.have.status(401));",
                  "pm.test('Error is invalid_grant', () => pm.expect(pm.response.json().error).to.equal('invalid_grant'));"
                ]
              }
            }
          ]
        },
        {
          "name": "Client Credentials Grant",
          "request": {
            "method": "POST",
            "url": "{{KC_URL}}/realms/{{KC_REALM}}/protocol/openid-connect/token",
            "header": [
              { "key": "Content-Type", "value": "application/x-www-form-urlencoded" }
            ],
            "body": {
              "mode": "urlencoded",
              "urlencoded": [
                { "key": "grant_type", "value": "client_credentials" },
                { "key": "client_id", "value": "{{CLIENT_ID}}" },
                { "key": "client_secret", "value": "{{CLIENT_SECRET}}" }
              ]
            }
          },
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('Token returned', () => pm.response.to.have.status(200));",
                  "pm.test('Has access_token', () => pm.expect(pm.response.json().access_token).to.be.a('string'));",
                  "pm.test('No refresh_token', () => pm.expect(pm.response.json().refresh_token).to.be.undefined);"
                ]
              }
            }
          ]
        },
        {
          "name": "Refresh Token",
          "request": {
            "method": "POST",
            "url": "{{KC_URL}}/realms/{{KC_REALM}}/protocol/openid-connect/token",
            "header": [
              { "key": "Content-Type", "value": "application/x-www-form-urlencoded" }
            ],
            "body": {
              "mode": "urlencoded",
              "urlencoded": [
                { "key": "grant_type", "value": "refresh_token" },
                { "key": "client_id", "value": "{{CLIENT_ID}}" },
                { "key": "client_secret", "value": "{{CLIENT_SECRET}}" },
                { "key": "refresh_token", "value": "{{REFRESH_TOKEN}}" }
              ]
            }
          },
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('Refresh returns 200', () => pm.response.to.have.status(200));",
                  "const json = pm.response.json();",
                  "pm.collectionVariables.set('ACCESS_TOKEN', json.access_token);",
                  "pm.collectionVariables.set('REFRESH_TOKEN', json.refresh_token);"
                ]
              }
            }
          ]
        },
        {
          "name": "Token Introspection",
          "request": {
            "method": "POST",
            "url": "{{KC_URL}}/realms/{{KC_REALM}}/protocol/openid-connect/token/introspect",
            "header": [
              { "key": "Content-Type", "value": "application/x-www-form-urlencoded" }
            ],
            "body": {
              "mode": "urlencoded",
              "urlencoded": [
                { "key": "token", "value": "{{ACCESS_TOKEN}}" },
                { "key": "client_id", "value": "{{CLIENT_ID}}" },
                { "key": "client_secret", "value": "{{CLIENT_SECRET}}" }
              ]
            }
          },
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('Introspection returns 200', () => pm.response.to.have.status(200));",
                  "pm.test('Token is active', () => pm.expect(pm.response.json().active).to.be.true);"
                ]
              }
            }
          ]
        },
        {
          "name": "Logout (Revoke Token)",
          "request": {
            "method": "POST",
            "url": "{{KC_URL}}/realms/{{KC_REALM}}/protocol/openid-connect/logout",
            "header": [
              { "key": "Content-Type", "value": "application/x-www-form-urlencoded" }
            ],
            "body": {
              "mode": "urlencoded",
              "urlencoded": [
                { "key": "client_id", "value": "{{CLIENT_ID}}" },
                { "key": "client_secret", "value": "{{CLIENT_SECRET}}" },
                { "key": "refresh_token", "value": "{{REFRESH_TOKEN}}" }
              ]
            }
          },
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('Logout returns 204', () => pm.response.to.have.status(204));"
                ]
              }
            }
          ]
        }
      ]
    },
    {
      "name": "OIDC Userinfo",
      "item": [
        {
          "name": "Get Userinfo",
          "request": {
            "method": "GET",
            "url": "{{KC_URL}}/realms/{{KC_REALM}}/protocol/openid-connect/userinfo",
            "header": [
              { "key": "Authorization", "value": "Bearer {{ACCESS_TOKEN}}" }
            ]
          },
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('Userinfo returns 200', () => pm.response.to.have.status(200));",
                  "pm.test('Has sub', () => pm.expect(pm.response.json().sub).to.be.a('string'));",
                  "pm.test('Has preferred_username', () => pm.expect(pm.response.json().preferred_username).to.be.a('string'));"
                ]
              }
            }
          ]
        },
        {
          "name": "Userinfo - Invalid Token (expect 401)",
          "request": {
            "method": "GET",
            "url": "{{KC_URL}}/realms/{{KC_REALM}}/protocol/openid-connect/userinfo",
            "header": [
              { "key": "Authorization", "value": "Bearer invalid.token.here" }
            ]
          },
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('Returns 401', () => pm.response.to.have.status(401));"
                ]
              }
            }
          ]
        }
      ]
    },
    {
      "name": "Auth Facade API",
      "item": [
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "url": "{{AUTH_FACADE_URL}}/api/v1/auth/login",
            "header": [
              { "key": "Content-Type", "value": "application/json" },
              { "key": "X-Tenant-ID", "value": "{{TENANT_ID}}" }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"identifier\": \"admin.user\",\n  \"password\": \"AdminPass1!\"\n}"
            }
          },
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('Login returns 200', () => pm.response.to.have.status(200));",
                  "const json = pm.response.json();",
                  "pm.test('Has accessToken', () => pm.expect(json.accessToken).to.be.a('string'));",
                  "pm.test('Has user info', () => pm.expect(json.user).to.be.an('object'));",
                  "pm.collectionVariables.set('ACCESS_TOKEN', json.accessToken);",
                  "pm.collectionVariables.set('REFRESH_TOKEN', json.refreshToken);"
                ]
              }
            }
          ]
        },
        {
          "name": "Refresh",
          "request": {
            "method": "POST",
            "url": "{{AUTH_FACADE_URL}}/api/v1/auth/refresh",
            "header": [
              { "key": "Content-Type", "value": "application/json" },
              { "key": "X-Tenant-ID", "value": "{{TENANT_ID}}" }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"refreshToken\": \"{{REFRESH_TOKEN}}\"\n}"
            }
          },
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('Refresh returns 200', () => pm.response.to.have.status(200));",
                  "const json = pm.response.json();",
                  "pm.collectionVariables.set('ACCESS_TOKEN', json.accessToken);",
                  "pm.collectionVariables.set('REFRESH_TOKEN', json.refreshToken);"
                ]
              }
            }
          ]
        },
        {
          "name": "Logout",
          "request": {
            "method": "POST",
            "url": "{{AUTH_FACADE_URL}}/api/v1/auth/logout",
            "header": [
              { "key": "Content-Type", "value": "application/json" },
              { "key": "X-Tenant-ID", "value": "{{TENANT_ID}}" },
              { "key": "Authorization", "value": "Bearer {{ACCESS_TOKEN}}" }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"refreshToken\": \"{{REFRESH_TOKEN}}\"\n}"
            }
          },
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('Logout returns 204', () => pm.response.to.have.status(204));"
                ]
              }
            }
          ]
        },
        {
          "name": "List Providers",
          "request": {
            "method": "GET",
            "url": "{{AUTH_FACADE_URL}}/api/v1/auth/providers",
            "header": [
              { "key": "X-Tenant-ID", "value": "{{TENANT_ID}}" }
            ]
          },
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('Providers returns 200', () => pm.response.to.have.status(200));",
                  "pm.test('Has available providers', () => pm.expect(pm.response.json().available).to.be.an('array'));"
                ]
              }
            }
          ]
        },
        {
          "name": "Get Current User",
          "request": {
            "method": "GET",
            "url": "{{AUTH_FACADE_URL}}/api/v1/auth/me",
            "header": [
              { "key": "Authorization", "value": "Bearer {{ACCESS_TOKEN}}" },
              { "key": "X-Tenant-ID", "value": "{{TENANT_ID}}" }
            ]
          },
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('Me returns 200', () => pm.response.to.have.status(200));",
                  "pm.test('Has user id', () => pm.expect(pm.response.json().id).to.be.a('string'));",
                  "pm.test('Has roles', () => pm.expect(pm.response.json().roles).to.be.an('array'));"
                ]
              }
            }
          ]
        }
      ]
    }
  ]
}
```

**To import:** Copy the JSON block above into a file named `emsist-auth-testing.postman_collection.json`, then import it into Postman. Run the "ROPC - Login as admin.user" request first to populate the `ACCESS_TOKEN` and `REFRESH_TOKEN` variables automatically.

**Recommended execution order:**
1. OpenID Configuration
2. JWKS
3. ROPC - Login as admin.user (sets tokens)
4. Userinfo
5. Token Introspection
6. Refresh Token
7. Client Credentials
8. ROPC - Wrong Password
9. Logout

---

## 7. Troubleshooting

### Connection Refused

**Symptom:** `curl: (7) Failed to connect to localhost port 28180: Connection refused`

**Fix:**
```bash
# Check if Keycloak is running
docker ps | grep keycloak

# Check if auth-testing stack is running
docker compose -f infrastructure/auth-testing/docker-compose.auth-testing.yml ps

# Restart the stack
docker compose -f infrastructure/auth-testing/docker-compose.auth-testing.yml up -d

# Check Keycloak health
curl -sf http://localhost:28180/health/ready | jq .
```

### invalid_grant

**Symptom:** `{"error":"invalid_grant","error_description":"Invalid user credentials"}`

**Causes and fixes:**
1. **Wrong password** -- verify the password matches the table in the Prerequisites section.
2. **LDAP federation not configured** -- run `./scripts/configure-keycloak-ldap-federation.sh`.
3. **LDAP user not synced** -- trigger a manual sync in Keycloak Admin Console (User Federation > ems-ldap-test > Synchronize all users), or re-run the federation script.
4. **User does not exist in Keycloak realm** -- verify with:
   ```bash
   # Get admin token
   ADMIN_TOKEN=$(curl -s -X POST "http://localhost:28180/realms/master/protocol/openid-connect/token" \
     -d "grant_type=password&client_id=admin-cli&username=admin&password=dev_keycloak_admin" | jq -r '.access_token')

   # Search for user
   curl -s -H "Authorization: Bearer ${ADMIN_TOKEN}" \
     "http://localhost:28180/admin/realms/master/users?username=admin.user" | jq .
   ```

### invalid_client

**Symptom:** `{"error":"invalid_client","error_description":"Invalid client or invalid client credentials"}`

**Causes and fixes:**
1. **Wrong client secret** -- verify `CLIENT_SECRET` is `ems-auth-facade-secret`.
2. **Client not configured in Keycloak** -- check if the `ems-auth-facade` client exists in the master realm.
3. **Client not enabled for the grant type** -- in Keycloak Admin Console, verify that Direct Access Grants and Service Accounts are enabled for the client.

### unauthorized_client

**Symptom:** `{"error":"unauthorized_client","error_description":"Invalid client secret"}`

**Fix:** Same as invalid_client above. Double-check `CLIENT_SECRET`.

### LDAP: ldap_bind: Invalid credentials (49)

**Symptom:** ldapsearch returns `ldap_bind: Invalid credentials (49)`

**Causes and fixes:**
1. **Wrong password** -- check the password for the bind DN.
2. **Wrong DN format** -- ensure the DN matches exactly (e.g., `uid=admin.user,ou=users,dc=ems,dc=test`).
3. **OpenLDAP not running** -- check container status:
   ```bash
   docker ps | grep openldap
   docker logs ems-openldap --tail 20
   ```

### LDAP: Can't contact LDAP server (-1)

**Symptom:** `ldap_sasl_bind(SIMPLE): Can't contact LDAP server (-1)`

**Fix:**
```bash
# Verify OpenLDAP container is running and healthy
docker inspect ems-openldap --format='{{.State.Health.Status}}'

# Check if port 1389 is mapped
docker port ems-openldap

# Test raw TCP connectivity
nc -zv localhost 1389
```

### Missing Roles in JWT

**Symptom:** JWT `realm_access.roles` does not contain EMS roles (VIEWER, USER, MANAGER, ADMIN, SUPER_ADMIN).

**Causes and fixes:**
1. **Group-to-role mapper not configured** -- re-run `./scripts/configure-keycloak-ldap-federation.sh` which creates the `group-to-role` mapper.
2. **LDAP sync stale** -- trigger a full sync:
   ```bash
   ADMIN_TOKEN=$(curl -s -X POST "http://localhost:28180/realms/master/protocol/openid-connect/token" \
     -d "grant_type=password&client_id=admin-cli&username=admin&password=dev_keycloak_admin" | jq -r '.access_token')

   # Get LDAP component ID
   LDAP_ID=$(curl -s -H "Authorization: Bearer ${ADMIN_TOKEN}" \
     "http://localhost:28180/admin/realms/master/components?name=ems-ldap-test" | jq -r '.[0].id')

   # Trigger full sync
   curl -s -X POST -H "Authorization: Bearer ${ADMIN_TOKEN}" \
     "http://localhost:28180/admin/realms/master/user-storage/${LDAP_ID}/sync?action=triggerFullSync" | jq .
   ```

### 401 on Auth Facade Endpoints

**Symptom:** Auth Facade returns 401 for authenticated requests.

**Causes and fixes:**
1. **Missing X-Tenant-ID header** -- all Auth Facade requests require `X-Tenant-ID: default`.
2. **Token expired** -- access tokens have a short lifetime (typically 300 seconds). Refresh or re-authenticate.
3. **Auth Facade not running** -- verify the service is up:
   ```bash
   curl -sf http://localhost:8081/actuator/health | jq .
   ```

### Docker Network Issues

**Symptom:** Keycloak cannot reach OpenLDAP for federation.

**Fix:** Both containers must be on the `ems-dev-backend` network:
```bash
# Check network membership
docker network inspect ems-dev-backend --format='{{range .Containers}}{{.Name}} {{end}}'

# Verify OpenLDAP is reachable from Keycloak
docker exec ems-keycloak sh -c "curl -sf ldap://openldap:389 || echo 'not reachable'"
```

### Run the Automated Test Suite

When in doubt, run the full automated test suite to identify which specific tests are failing:

```bash
cd infrastructure/auth-testing
./scripts/test-all-protocols.sh
```

This runs LDAP, OAuth2, and OIDC tests sequentially with a pass/fail summary.
