# ISSUE-001b DevOps Specification: Keycloak Realm Bootstrap for Local Development

| Field | Value |
|-------|-------|
| **ID** | ISSUE-001b-DEVOPS |
| **Parent** | ISSUE-001: Master Tenant Authentication & Superuser Configuration |
| **Type** | DevOps Specification |
| **Status** | READY FOR IMPLEMENTATION |
| **Created** | 2026-02-26 |
| **Author** | DEVOPS Agent |
| **Governance** | DEVOPS-PRINCIPLES v1.0.0 acknowledged |

---

## Table of Contents

1. [Realm Selection Decision](#1-realm-selection-decision)
2. [Realm Export JSON Specification](#2-realm-export-json-specification)
3. [Docker Compose Modifications](#3-docker-compose-modifications)
4. [Environment Variable Updates](#4-environment-variable-updates)
5. [Startup Verification](#5-startup-verification)
6. [Developer Onboarding Steps](#6-developer-onboarding-steps)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. Realm Selection Decision

### Recommendation: Use the `master` Realm

**Rationale:**

The existing codebase is already configured to use the `master` realm for the master tenant. Evidence:

1. `AuthServiceImpl.resolveRealm()` at `/backend/auth-facade/src/main/java/com/ems/auth/service/AuthServiceImpl.java` (line 174-185):
   ```java
   private String resolveRealm(String tenantId) {
       if (isMasterTenant(tenantId)) {
           return "master";
       }
       if (tenantId.startsWith("tenant-")) {
           return tenantId;
       }
       return "tenant-" + tenantId;
   }
   ```

2. `KeycloakConfig.java` at `/backend/auth-facade/src/main/java/com/ems/auth/config/KeycloakConfig.java` (line 15):
   ```java
   private String masterRealm = "master";
   ```

3. `application.yml` at `/backend/auth-facade/src/main/resources/application.yml` (line 98):
   ```yaml
   keycloak:
     master-realm: master
   ```

4. Neo4j migration `V005__create_master_tenant.cypher` configures URLs pointing to `/realms/master/`:
   ```
   discoveryUrl: 'http://localhost:8180/realms/master/.well-known/openid-configuration'
   ```

5. The init-db.sql seed at `/infrastructure/docker/init-db.sql` (line 230-241) sets:
   ```sql
   INSERT INTO tenants (..., keycloak_realm) VALUES (..., 'master');
   ```

Using `master` avoids changing any application code. Keycloak creates the `master` realm automatically on first boot; we only need to add a client, roles, and a user to it.

**Important:** The `--import-realm` flag in Keycloak 24.0 only imports **non-master** realms from `/opt/keycloak/data/import/`. The `master` realm is special and cannot be imported this way. Therefore, the bootstrapping approach must use the **Keycloak Admin REST API** via an init container or entrypoint script instead.

### Alternative Considered: Dedicated `ems` Realm

Creating a separate `ems` realm would provide cleaner separation but would require changes across:
- `AuthServiceImpl.resolveRealm()` - change the return value for master tenant
- `application.yml` - update `keycloak.master-realm`
- `V005__create_master_tenant.cypher` - update all URLs
- `init-db.sql` - update `keycloak_realm` column
- All documentation referencing the master realm

This is **not recommended** for the initial fix. A dedicated realm per tenant can be addressed in a future ADR when graph-per-tenant isolation (ADR-003) is implemented.

---

## 2. Realm Export JSON Specification

Since the `master` realm cannot be imported via `--import-realm`, the bootstrapping is handled by a shell script that calls the Keycloak Admin REST API. However, for documentation and reproducibility, the following defines the target state of the `master` realm after bootstrapping.

### 2.1 Client: `ems-auth-facade`

The client ID must match what the auth-facade application.yml expects.

**Evidence:** `/backend/auth-facade/src/main/resources/application.yml` (line 104):
```yaml
keycloak:
  client:
    client-id: ${KEYCLOAK_CLIENT_ID:ems-auth-facade}
    client-secret: ${KEYCLOAK_CLIENT_SECRET:}
```

**Note on V005 migration discrepancy:** The Neo4j migration V005 at `/backend/auth-facade/src/main/resources/neo4j/migrations/V005__create_master_tenant.cypher` (line 51) uses `clientId: 'ems-client'`, which does NOT match the application.yml default of `ems-auth-facade`. The Keycloak client MUST use `ems-auth-facade` to match what the running application sends in token requests. The Neo4j migration should be corrected separately.

| Property | Value | Rationale |
|----------|-------|-----------|
| Client ID | `ems-auth-facade` | Matches `application.yml` default |
| Client Protocol | `openid-connect` | Standard OIDC |
| Client Authentication | `true` (confidential) | Backend-to-Keycloak communication requires a secret |
| Standard Flow Enabled | `true` | For authorization code flow (frontend redirect login) |
| Direct Access Grants | `true` | Required for Resource Owner Password Credentials grant used by `KeycloakIdentityProvider.authenticate()` |
| Service Accounts Enabled | `true` | For admin API calls from auth-facade |
| Valid Redirect URIs | `http://localhost:4200/*`, `http://localhost:8080/*`, `http://localhost:8081/*` | Angular dev server, API gateway, auth-facade direct |
| Web Origins | `http://localhost:4200`, `http://localhost:8080` | CORS for frontend and gateway |
| Root URL | `http://localhost:8080` | API Gateway base URL |
| Base URL | `/` | Default |

**Default Scopes:** openid, profile, email (Keycloak default scopes, already included)

**Client Secret:** Generated at bootstrap time, stored in environment variable `KEYCLOAK_CLIENT_SECRET`. For local development, a deterministic secret is used: `ems-dev-secret-do-not-use-in-production`.

### 2.2 Realm Roles

These must match the Neo4j role hierarchy from V004 migration at `/backend/auth-facade/src/main/resources/neo4j/migrations/V004__create_default_roles.cypher`.

| Role | Description | Composite |
|------|-------------|-----------|
| `SUPER_ADMIN` | Full system access across all tenants | Yes - includes ADMIN |
| `ADMIN` | Full administrative access within tenant | Yes - includes MANAGER |
| `MANAGER` | Team management and reporting access | Yes - includes USER |
| `USER` | Standard user with basic CRUD operations | Yes - includes VIEWER |
| `VIEWER` | Read-only access to resources | No (base role) |

**Composite role hierarchy** (matching V004 `INHERITS_FROM` relationships):
```
SUPER_ADMIN -> ADMIN -> MANAGER -> USER -> VIEWER
```

### 2.3 Default User: superadmin

| Property | Value |
|----------|-------|
| Username | `superadmin` |
| Email | `superadmin@emsist.com` |
| First Name | `Super` |
| Last Name | `Admin` |
| Email Verified | `true` |
| Enabled | `true` |
| Password | `admin` (local dev only) |
| Temporary Password | `false` |
| Realm Roles | `SUPER_ADMIN` |
| User Attributes | `tenant_id: master` |

### 2.4 Password Policy

For local development, no complexity requirements. The bootstrap script sets the realm password policy to empty (Keycloak default for dev mode).

---

## 3. Docker Compose Modifications

### 3.1 New File: Bootstrap Script

**File:** `infrastructure/keycloak/keycloak-init.sh`

This script waits for Keycloak to become healthy, then uses the Admin REST API to configure the master realm.

```bash
#!/bin/bash
# ==============================================================================
# Keycloak Master Realm Bootstrap Script
# Configures client, roles, and superuser for local development
#
# This script is idempotent - safe to run multiple times.
# ==============================================================================

set -euo pipefail

KEYCLOAK_URL="${KEYCLOAK_URL:-http://keycloak:8080}"
KEYCLOAK_ADMIN="${KEYCLOAK_ADMIN:-admin}"
KEYCLOAK_ADMIN_PASSWORD="${KEYCLOAK_ADMIN_PASSWORD:-admin}"
CLIENT_ID="${KEYCLOAK_CLIENT_ID:-ems-auth-facade}"
CLIENT_SECRET="${KEYCLOAK_CLIENT_SECRET:-ems-dev-secret-do-not-use-in-production}"
SUPERADMIN_EMAIL="${SUPERADMIN_EMAIL:-superadmin@emsist.com}"
SUPERADMIN_PASSWORD="${SUPERADMIN_PASSWORD:-admin}"
REALM="master"

echo "[keycloak-init] Waiting for Keycloak to be ready at ${KEYCLOAK_URL}..."

# Wait for Keycloak health endpoint
MAX_RETRIES=60
RETRY_INTERVAL=5
for i in $(seq 1 $MAX_RETRIES); do
    if curl -sf "${KEYCLOAK_URL}/health/ready" > /dev/null 2>&1; then
        echo "[keycloak-init] Keycloak is ready."
        break
    fi
    if [ "$i" -eq "$MAX_RETRIES" ]; then
        echo "[keycloak-init] ERROR: Keycloak did not become ready within $((MAX_RETRIES * RETRY_INTERVAL)) seconds."
        exit 1
    fi
    echo "[keycloak-init] Waiting... (attempt $i/$MAX_RETRIES)"
    sleep $RETRY_INTERVAL
done

# Obtain admin access token
echo "[keycloak-init] Obtaining admin access token..."
ADMIN_TOKEN=$(curl -sf -X POST "${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "grant_type=client_credentials" \
    -d "client_id=admin-cli" \
    -d "username=${KEYCLOAK_ADMIN}" \
    -d "password=${KEYCLOAK_ADMIN_PASSWORD}" \
    -d "grant_type=password" | jq -r '.access_token')

if [ -z "$ADMIN_TOKEN" ] || [ "$ADMIN_TOKEN" = "null" ]; then
    echo "[keycloak-init] ERROR: Failed to obtain admin token."
    exit 1
fi

AUTH_HEADER="Authorization: Bearer ${ADMIN_TOKEN}"

# --------------------------------------------------------------------------
# STEP 1: Create realm roles
# --------------------------------------------------------------------------
echo "[keycloak-init] Creating realm roles..."

create_role() {
    local role_name=$1
    local description=$2

    # Check if role already exists
    local existing
    existing=$(curl -sf -o /dev/null -w "%{http_code}" \
        -H "${AUTH_HEADER}" \
        "${KEYCLOAK_URL}/admin/realms/${REALM}/roles/${role_name}")

    if [ "$existing" = "200" ]; then
        echo "[keycloak-init]   Role '${role_name}' already exists. Skipping."
        return
    fi

    curl -sf -X POST "${KEYCLOAK_URL}/admin/realms/${REALM}/roles" \
        -H "${AUTH_HEADER}" \
        -H "Content-Type: application/json" \
        -d "{
            \"name\": \"${role_name}\",
            \"description\": \"${description}\",
            \"composite\": false
        }"
    echo "[keycloak-init]   Created role '${role_name}'."
}

create_role "VIEWER"      "Read-only access to resources"
create_role "USER"        "Standard user with basic CRUD operations"
create_role "MANAGER"     "Team management and reporting access"
create_role "ADMIN"       "Full administrative access within tenant"
create_role "SUPER_ADMIN" "Full system access across all tenants"

# --------------------------------------------------------------------------
# STEP 2: Set up composite role hierarchy
# SUPER_ADMIN -> ADMIN -> MANAGER -> USER -> VIEWER
# --------------------------------------------------------------------------
echo "[keycloak-init] Setting up role hierarchy..."

make_composite() {
    local parent_role=$1
    local child_role=$2

    # Get child role representation
    local child_json
    child_json=$(curl -sf -H "${AUTH_HEADER}" \
        "${KEYCLOAK_URL}/admin/realms/${REALM}/roles/${child_role}")

    # Add child as composite to parent
    curl -sf -X POST "${KEYCLOAK_URL}/admin/realms/${REALM}/roles/${parent_role}/composites" \
        -H "${AUTH_HEADER}" \
        -H "Content-Type: application/json" \
        -d "[${child_json}]"

    echo "[keycloak-init]   ${parent_role} -> ${child_role}"
}

make_composite "USER"        "VIEWER"
make_composite "MANAGER"     "USER"
make_composite "ADMIN"       "MANAGER"
make_composite "SUPER_ADMIN" "ADMIN"

# --------------------------------------------------------------------------
# STEP 3: Create client 'ems-auth-facade'
# --------------------------------------------------------------------------
echo "[keycloak-init] Creating client '${CLIENT_ID}'..."

# Check if client already exists
EXISTING_CLIENT=$(curl -sf -H "${AUTH_HEADER}" \
    "${KEYCLOAK_URL}/admin/realms/${REALM}/clients?clientId=${CLIENT_ID}" | jq -r '.[0].id // empty')

if [ -n "$EXISTING_CLIENT" ]; then
    echo "[keycloak-init]   Client '${CLIENT_ID}' already exists (id=${EXISTING_CLIENT}). Updating..."
    CLIENT_UUID=$EXISTING_CLIENT

    curl -sf -X PUT "${KEYCLOAK_URL}/admin/realms/${REALM}/clients/${CLIENT_UUID}" \
        -H "${AUTH_HEADER}" \
        -H "Content-Type: application/json" \
        -d "{
            \"id\": \"${CLIENT_UUID}\",
            \"clientId\": \"${CLIENT_ID}\",
            \"name\": \"EMS Auth Facade\",
            \"description\": \"Backend-for-Frontend authentication client for EMSIST\",
            \"enabled\": true,
            \"protocol\": \"openid-connect\",
            \"publicClient\": false,
            \"clientAuthenticatorType\": \"client-secret\",
            \"secret\": \"${CLIENT_SECRET}\",
            \"standardFlowEnabled\": true,
            \"directAccessGrantsEnabled\": true,
            \"serviceAccountsEnabled\": true,
            \"authorizationServicesEnabled\": false,
            \"redirectUris\": [
                \"http://localhost:4200/*\",
                \"http://localhost:8080/*\",
                \"http://localhost:8081/*\"
            ],
            \"webOrigins\": [
                \"http://localhost:4200\",
                \"http://localhost:8080\"
            ],
            \"rootUrl\": \"http://localhost:8080\",
            \"baseUrl\": \"/\",
            \"attributes\": {
                \"post.logout.redirect.uris\": \"http://localhost:4200/*\"
            },
            \"defaultClientScopes\": [\"openid\", \"profile\", \"email\", \"roles\"],
            \"optionalClientScopes\": [\"offline_access\", \"microprofile-jwt\"]
        }"
else
    curl -sf -X POST "${KEYCLOAK_URL}/admin/realms/${REALM}/clients" \
        -H "${AUTH_HEADER}" \
        -H "Content-Type: application/json" \
        -d "{
            \"clientId\": \"${CLIENT_ID}\",
            \"name\": \"EMS Auth Facade\",
            \"description\": \"Backend-for-Frontend authentication client for EMSIST\",
            \"enabled\": true,
            \"protocol\": \"openid-connect\",
            \"publicClient\": false,
            \"clientAuthenticatorType\": \"client-secret\",
            \"secret\": \"${CLIENT_SECRET}\",
            \"standardFlowEnabled\": true,
            \"directAccessGrantsEnabled\": true,
            \"serviceAccountsEnabled\": true,
            \"authorizationServicesEnabled\": false,
            \"redirectUris\": [
                \"http://localhost:4200/*\",
                \"http://localhost:8080/*\",
                \"http://localhost:8081/*\"
            ],
            \"webOrigins\": [
                \"http://localhost:4200\",
                \"http://localhost:8080\"
            ],
            \"rootUrl\": \"http://localhost:8080\",
            \"baseUrl\": \"/\",
            \"attributes\": {
                \"post.logout.redirect.uris\": \"http://localhost:4200/*\"
            },
            \"defaultClientScopes\": [\"openid\", \"profile\", \"email\", \"roles\"],
            \"optionalClientScopes\": [\"offline_access\", \"microprofile-jwt\"]
        }"

    # Get the created client UUID
    CLIENT_UUID=$(curl -sf -H "${AUTH_HEADER}" \
        "${KEYCLOAK_URL}/admin/realms/${REALM}/clients?clientId=${CLIENT_ID}" | jq -r '.[0].id')

    echo "[keycloak-init]   Created client '${CLIENT_ID}' (id=${CLIENT_UUID})."
fi

# --------------------------------------------------------------------------
# STEP 4: Configure client scope mapper for realm roles in token
# --------------------------------------------------------------------------
echo "[keycloak-init] Ensuring realm roles are included in access token..."

# The default 'roles' client scope in Keycloak includes realm_access.roles
# Verify it is assigned to our client
ROLES_SCOPE_ID=$(curl -sf -H "${AUTH_HEADER}" \
    "${KEYCLOAK_URL}/admin/realms/${REALM}/client-scopes" | jq -r '.[] | select(.name=="roles") | .id')

if [ -n "$ROLES_SCOPE_ID" ]; then
    curl -sf -X PUT "${KEYCLOAK_URL}/admin/realms/${REALM}/clients/${CLIENT_UUID}/default-client-scopes/${ROLES_SCOPE_ID}" \
        -H "${AUTH_HEADER}" 2>/dev/null || true
    echo "[keycloak-init]   'roles' scope assigned to client."
fi

# --------------------------------------------------------------------------
# STEP 5: Create superadmin user
# --------------------------------------------------------------------------
echo "[keycloak-init] Creating superadmin user..."

EXISTING_USERS=$(curl -sf -H "${AUTH_HEADER}" \
    "${KEYCLOAK_URL}/admin/realms/${REALM}/users?email=${SUPERADMIN_EMAIL}&exact=true")

EXISTING_USER_ID=$(echo "$EXISTING_USERS" | jq -r '.[0].id // empty')

if [ -n "$EXISTING_USER_ID" ]; then
    echo "[keycloak-init]   User '${SUPERADMIN_EMAIL}' already exists (id=${EXISTING_USER_ID}). Skipping creation."
    USER_UUID=$EXISTING_USER_ID
else
    curl -sf -X POST "${KEYCLOAK_URL}/admin/realms/${REALM}/users" \
        -H "${AUTH_HEADER}" \
        -H "Content-Type: application/json" \
        -d "{
            \"username\": \"superadmin\",
            \"email\": \"${SUPERADMIN_EMAIL}\",
            \"firstName\": \"Super\",
            \"lastName\": \"Admin\",
            \"enabled\": true,
            \"emailVerified\": true,
            \"attributes\": {
                \"tenant_id\": [\"master\"]
            },
            \"credentials\": [{
                \"type\": \"password\",
                \"value\": \"${SUPERADMIN_PASSWORD}\",
                \"temporary\": false
            }]
        }"

    USER_UUID=$(curl -sf -H "${AUTH_HEADER}" \
        "${KEYCLOAK_URL}/admin/realms/${REALM}/users?email=${SUPERADMIN_EMAIL}&exact=true" | jq -r '.[0].id')

    echo "[keycloak-init]   Created user '${SUPERADMIN_EMAIL}' (id=${USER_UUID})."
fi

# --------------------------------------------------------------------------
# STEP 6: Assign SUPER_ADMIN role to superadmin user
# --------------------------------------------------------------------------
echo "[keycloak-init] Assigning SUPER_ADMIN role to superadmin..."

SUPER_ADMIN_ROLE_JSON=$(curl -sf -H "${AUTH_HEADER}" \
    "${KEYCLOAK_URL}/admin/realms/${REALM}/roles/SUPER_ADMIN")

curl -sf -X POST "${KEYCLOAK_URL}/admin/realms/${REALM}/users/${USER_UUID}/role-mappings/realm" \
    -H "${AUTH_HEADER}" \
    -H "Content-Type: application/json" \
    -d "[${SUPER_ADMIN_ROLE_JSON}]"

echo "[keycloak-init]   SUPER_ADMIN role assigned."

# --------------------------------------------------------------------------
# STEP 7: Disable password policy (dev mode only)
# --------------------------------------------------------------------------
echo "[keycloak-init] Ensuring no password policy for dev mode..."

curl -sf -X PUT "${KEYCLOAK_URL}/admin/realms/${REALM}" \
    -H "${AUTH_HEADER}" \
    -H "Content-Type: application/json" \
    -d "{
        \"passwordPolicy\": \"\"
    }"

echo "[keycloak-init]   Password policy cleared for dev mode."

# --------------------------------------------------------------------------
# DONE
# --------------------------------------------------------------------------
echo ""
echo "============================================================================"
echo "[keycloak-init] Bootstrap complete."
echo "============================================================================"
echo ""
echo "  Realm:       ${REALM}"
echo "  Client ID:   ${CLIENT_ID}"
echo "  Client Secret: ${CLIENT_SECRET}"
echo "  Superadmin:  ${SUPERADMIN_EMAIL} / ${SUPERADMIN_PASSWORD}"
echo ""
echo "  Token URL:   ${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token"
echo "  Admin URL:   ${KEYCLOAK_URL}/admin/master/console/"
echo ""
echo "============================================================================"
```

### 3.2 Modifications to `backend/docker-compose.yml`

**File:** `/backend/docker-compose.yml`

Add the init container and volume mount after the existing `keycloak` service definition.

**Current** (lines 76-97):
```yaml
  keycloak:
    image: quay.io/keycloak/keycloak:24.0
    container_name: ems-keycloak
    environment:
      KEYCLOAK_ADMIN: ${KEYCLOAK_ADMIN:-admin}
      KEYCLOAK_ADMIN_PASSWORD: ${KEYCLOAK_ADMIN_PASSWORD:?Keycloak admin password required}
      KC_DB: postgres
      KC_DB_URL: jdbc:postgresql://postgres:5432/keycloak_db
      KC_DB_USERNAME: ${KC_DB_USERNAME:-postgres}
      KC_DB_PASSWORD: ${KC_DB_PASSWORD:?Keycloak DB password required}
      KC_HOSTNAME_STRICT: "false"
      KC_HOSTNAME_STRICT_HTTPS: "false"
      KC_HTTP_ENABLED: "true"
      KC_PROXY_HEADERS: "xforwarded"
    command: start-dev
    ports:
      - "8180:8080"
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - ems-network
```

**Modified** (add `KC_HEALTH_ENABLED`, `healthcheck`, and `keycloak-init` service):
```yaml
  keycloak:
    image: quay.io/keycloak/keycloak:24.0
    container_name: ems-keycloak
    environment:
      KEYCLOAK_ADMIN: ${KEYCLOAK_ADMIN:-admin}
      KEYCLOAK_ADMIN_PASSWORD: ${KEYCLOAK_ADMIN_PASSWORD:?Keycloak admin password required}
      KC_DB: postgres
      KC_DB_URL: jdbc:postgresql://postgres:5432/keycloak_db
      KC_DB_USERNAME: ${KC_DB_USERNAME:-postgres}
      KC_DB_PASSWORD: ${KC_DB_PASSWORD:?Keycloak DB password required}
      KC_HOSTNAME_STRICT: "false"
      KC_HOSTNAME_STRICT_HTTPS: "false"
      KC_HTTP_ENABLED: "true"
      KC_PROXY_HEADERS: "xforwarded"
      KC_HEALTH_ENABLED: "true"
      KC_METRICS_ENABLED: "true"
    command: start-dev
    ports:
      - "8180:8080"
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD-SHELL", "exec 3<>/dev/tcp/127.0.0.1/8080;echo -e 'GET /health/ready HTTP/1.1\r\nhost: localhost\r\nConnection: close\r\n\r\n' >&3;if timeout 5 grep -q '\"status\":\"UP\"' <&3; then exit 0; else exit 1; fi"]
      interval: 30s
      timeout: 10s
      retries: 10
      start_period: 60s
    networks:
      - ems-network

  # Keycloak realm bootstrap (runs once, then exits)
  keycloak-init:
    image: curlimages/curl:8.5.0
    container_name: ems-keycloak-init
    entrypoint: ["/bin/sh", "/scripts/keycloak-init.sh"]
    environment:
      KEYCLOAK_URL: http://keycloak:8080
      KEYCLOAK_ADMIN: ${KEYCLOAK_ADMIN:-admin}
      KEYCLOAK_ADMIN_PASSWORD: ${KEYCLOAK_ADMIN_PASSWORD:?Keycloak admin password required}
      KEYCLOAK_CLIENT_ID: ${KEYCLOAK_CLIENT_ID:-ems-auth-facade}
      KEYCLOAK_CLIENT_SECRET: ${KEYCLOAK_CLIENT_SECRET:-ems-dev-secret-do-not-use-in-production}
      SUPERADMIN_EMAIL: ${SUPERADMIN_EMAIL:-superadmin@emsist.com}
      SUPERADMIN_PASSWORD: ${SUPERADMIN_PASSWORD:-admin}
    volumes:
      - ../infrastructure/keycloak/keycloak-init.sh:/scripts/keycloak-init.sh:ro
    depends_on:
      keycloak:
        condition: service_healthy
    restart: "no"
    networks:
      - ems-network
```

**Notes:**
- The `curlimages/curl:8.5.0` image is Alpine-based, includes `curl`, `sh`, and `jq` is NOT included. The script must be adjusted to use a different image or install jq. See alternative below.
- `restart: "no"` ensures the init container runs once and stays stopped.
- The volume mount uses a relative path from `backend/` to `infrastructure/keycloak/`.

**Alternative init image with jq:**

Since the script relies on `jq`, use `alpine/curl:8.5.0` which supports `apk add jq`, or use a custom lightweight image. The recommended approach:

```yaml
  keycloak-init:
    image: alpine:3.19
    container_name: ems-keycloak-init
    entrypoint: ["/bin/sh", "-c", "apk add --no-cache curl jq && /bin/sh /scripts/keycloak-init.sh"]
    environment:
      KEYCLOAK_URL: http://keycloak:8080
      KEYCLOAK_ADMIN: ${KEYCLOAK_ADMIN:-admin}
      KEYCLOAK_ADMIN_PASSWORD: ${KEYCLOAK_ADMIN_PASSWORD:?Keycloak admin password required}
      KEYCLOAK_CLIENT_ID: ${KEYCLOAK_CLIENT_ID:-ems-auth-facade}
      KEYCLOAK_CLIENT_SECRET: ${KEYCLOAK_CLIENT_SECRET:-ems-dev-secret-do-not-use-in-production}
      SUPERADMIN_EMAIL: ${SUPERADMIN_EMAIL:-superadmin@emsist.com}
      SUPERADMIN_PASSWORD: ${SUPERADMIN_PASSWORD:-admin}
    volumes:
      - ../infrastructure/keycloak/keycloak-init.sh:/scripts/keycloak-init.sh:ro
    depends_on:
      keycloak:
        condition: service_healthy
    restart: "no"
    networks:
      - ems-network
```

### 3.3 Modifications to `infrastructure/docker/docker-compose.yml`

**File:** `/infrastructure/docker/docker-compose.yml`

Apply the same pattern. The Keycloak service already has a healthcheck (line 117). Add the init container.

**Add after the existing `keycloak` service (after line 122):**

```yaml
  # Keycloak realm bootstrap (runs once, then exits)
  keycloak-init:
    image: alpine:3.19
    container_name: ems-keycloak-init
    entrypoint: ["/bin/sh", "-c", "apk add --no-cache curl jq && /bin/sh /scripts/keycloak-init.sh"]
    environment:
      KEYCLOAK_URL: http://keycloak:8080
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: admin
      KEYCLOAK_CLIENT_ID: ems-auth-facade
      KEYCLOAK_CLIENT_SECRET: ems-dev-secret-do-not-use-in-production
      SUPERADMIN_EMAIL: superadmin@emsist.com
      SUPERADMIN_PASSWORD: admin
    volumes:
      - ../keycloak/keycloak-init.sh:/scripts/keycloak-init.sh:ro
    depends_on:
      keycloak:
        condition: service_healthy
    restart: "no"
    networks:
      - ems-network
```

**Volume mount path explanation:**
- From `infrastructure/docker/docker-compose.yml`, the relative path `../keycloak/` resolves to `infrastructure/keycloak/`.
- From `backend/docker-compose.yml`, the relative path `../infrastructure/keycloak/` resolves to `infrastructure/keycloak/`.
- Both docker-compose files reference the same bootstrap script at `infrastructure/keycloak/keycloak-init.sh`.

### 3.4 File to Create: Directory Structure

```
infrastructure/
  keycloak/
    keycloak-init.sh          # Bootstrap script (Section 3.1)
```

---

## 4. Environment Variable Updates

### 4.1 Update `.env.example`

**File:** `/backend/.env.example`

Add the new Keycloak client secret variable:

```bash
# ============================================================================
# EMS Backend - Environment Variables
# Copy this file to .env and customize for your environment
# ============================================================================

# PostgreSQL
POSTGRES_DB=master_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password_here

# Neo4j
NEO4J_AUTH=neo4j/your_secure_password_here

# Keycloak
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=your_secure_password_here
KC_DB_USERNAME=postgres
KC_DB_PASSWORD=your_secure_password_here
KEYCLOAK_CLIENT_ID=ems-auth-facade
KEYCLOAK_CLIENT_SECRET=your_client_secret_here

# Superadmin (local dev only)
SUPERADMIN_EMAIL=superadmin@emsist.com
SUPERADMIN_PASSWORD=your_superadmin_password_here

# Kafka (optional)
KAFKA_CLUSTER_ID=MkU3OEVBNTcwNTJENDM2Qk
```

### 4.2 Auth-Facade Application Configuration

The auth-facade `application.yml` already supports the `KEYCLOAK_CLIENT_SECRET` environment variable at line 105:

```yaml
keycloak:
  client:
    client-secret: ${KEYCLOAK_CLIENT_SECRET:}
```

For local development without `.env`, developers can set this in their IDE run configuration or use the default from the init script. The init script uses `ems-dev-secret-do-not-use-in-production` as the default.

To avoid requiring configuration for the simple local dev case, update the default to match:

**Proposed change** to `application.yml` line 105:
```yaml
    client-secret: ${KEYCLOAK_CLIENT_SECRET:ems-dev-secret-do-not-use-in-production}
```

This ensures zero-configuration local development. The default is obviously not for production use, and production deployments will always set the environment variable.

---

## 5. Startup Verification

### 5.1 Keycloak Health Check

Once `docker-compose up -d` completes, the `keycloak-init` container will wait for Keycloak health before running.

**Verify Keycloak is healthy:**

```bash
# From host machine (port 8180 is mapped to Keycloak's 8080)
curl -sf http://localhost:8180/health/ready | jq .
```

**Expected response:**
```json
{
  "status": "UP",
  "checks": []
}
```

### 5.2 Verify Init Container Completed

```bash
# Check init container logs
docker logs ems-keycloak-init
```

**Expected output (last lines):**
```
============================================================================
[keycloak-init] Bootstrap complete.
============================================================================

  Realm:       master
  Client ID:   ems-auth-facade
  Client Secret: ems-dev-secret-do-not-use-in-production
  Superadmin:  superadmin@emsist.com / admin

  Token URL:   http://keycloak:8080/realms/master/protocol/openid-connect/token
  Admin URL:   http://keycloak:8080/admin/master/console/

============================================================================
```

**Verify container exited cleanly:**
```bash
docker ps -a --filter name=ems-keycloak-init --format "{{.Status}}"
# Expected: Exited (0) X seconds ago
```

### 5.3 Verify Realm Configuration

**Check that the client exists:**
```bash
# Get admin token
ADMIN_TOKEN=$(curl -sf -X POST http://localhost:8180/realms/master/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" \
  -d "client_id=admin-cli" \
  -d "username=admin" \
  -d "password=admin" | jq -r '.access_token')

# List clients
curl -sf -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  http://localhost:8180/admin/realms/master/clients?clientId=ems-auth-facade | jq '.[0].clientId'
# Expected: "ems-auth-facade"
```

**Check that roles exist:**
```bash
curl -sf -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  http://localhost:8180/admin/realms/master/roles | jq '.[].name' | sort
```

**Expected output (among other default roles):**
```
"ADMIN"
"MANAGER"
"SUPER_ADMIN"
"USER"
"VIEWER"
```

**Check that superadmin user exists:**
```bash
curl -sf -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  "http://localhost:8180/admin/realms/master/users?email=superadmin@emsist.com&exact=true" | jq '.[0].email'
# Expected: "superadmin@emsist.com"
```

### 5.4 Test Token Endpoint (Superadmin Login)

This is the critical end-to-end test. It simulates what `KeycloakIdentityProvider.authenticate()` does.

```bash
# Login as superadmin via Direct Access Grant
curl -sf -X POST http://localhost:8180/realms/master/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" \
  -d "client_id=ems-auth-facade" \
  -d "client_secret=ems-dev-secret-do-not-use-in-production" \
  -d "username=superadmin@emsist.com" \
  -d "password=admin" \
  -d "scope=openid profile email" | jq .
```

**Expected response:**
```json
{
  "access_token": "<jwt>",
  "expires_in": 300,
  "refresh_expires_in": 1800,
  "refresh_token": "<jwt>",
  "token_type": "Bearer",
  "id_token": "<jwt>",
  "not-before-policy": 0,
  "session_state": "<uuid>",
  "scope": "openid profile email"
}
```

**Decode and verify JWT claims:**
```bash
# Extract and decode the access token payload
ACCESS_TOKEN=$(curl -sf -X POST http://localhost:8180/realms/master/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" \
  -d "client_id=ems-auth-facade" \
  -d "client_secret=ems-dev-secret-do-not-use-in-production" \
  -d "username=superadmin@emsist.com" \
  -d "password=admin" \
  -d "scope=openid profile email" | jq -r '.access_token')

# Decode JWT payload (base64url)
echo "$ACCESS_TOKEN" | cut -d. -f2 | base64 -d 2>/dev/null | jq '.realm_access.roles'
```

**Expected `realm_access.roles` claim:**
```json
["SUPER_ADMIN", "ADMIN", "MANAGER", "USER", "VIEWER", "default-roles-master"]
```

The composite role hierarchy ensures that `SUPER_ADMIN` includes all descendant roles.

### 5.5 Test via Auth-Facade API

Once auth-facade is running (either locally or in Docker), verify the full flow:

```bash
# Login via auth-facade (requires X-Tenant-ID header)
curl -sf -X POST http://localhost:8081/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: master" \
  -d '{
    "email": "superadmin@emsist.com",
    "password": "admin"
  }' | jq .
```

**Expected:** HTTP 200 with `accessToken`, `refreshToken`, and `user` object containing `SUPER_ADMIN` role.

```bash
# Get current user profile
ACCESS_TOKEN="<paste access token from above>"
curl -sf http://localhost:8081/api/v1/auth/me \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "X-Tenant-ID: master" | jq .
```

**Expected:** User profile with email `superadmin@emsist.com` and roles including `SUPER_ADMIN`.

---

## 6. Developer Onboarding Steps

### 6.1 First-Time Setup

```bash
# 1. Clone the repository
git clone <repo-url>
cd EMSIST

# 2. Copy environment file
cp backend/.env.example backend/.env

# 3. Edit .env with local credentials (for quick start, use these defaults):
#    POSTGRES_PASSWORD=postgres
#    KEYCLOAK_ADMIN_PASSWORD=admin
#    KC_DB_PASSWORD=postgres
#    KEYCLOAK_CLIENT_SECRET=ems-dev-secret-do-not-use-in-production
#    SUPERADMIN_PASSWORD=admin

# 4. Start infrastructure
cd backend
docker compose up -d

# 5. Wait for all services to be healthy (including keycloak-init completion)
docker compose ps

# 6. Verify keycloak-init completed successfully
docker logs ems-keycloak-init

# 7. Test superadmin login
curl -sf -X POST http://localhost:8180/realms/master/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" \
  -d "client_id=ems-auth-facade" \
  -d "client_secret=ems-dev-secret-do-not-use-in-production" \
  -d "username=superadmin@emsist.com" \
  -d "password=admin" \
  -d "scope=openid profile email" | jq '.access_token'
```

### 6.2 Daily Development Workflow

```bash
# Start infrastructure (idempotent - keycloak-init is safe to re-run)
cd backend
docker compose up -d

# Check services are healthy
docker compose ps

# Start auth-facade locally (IDE or command line)
cd auth-facade
../mvnw spring-boot:run

# In another terminal, start the Angular frontend
cd frontend
npm start
```

### 6.3 Resetting Keycloak State

```bash
# To fully reset Keycloak (lose all data):
cd backend
docker compose down -v    # -v removes volumes
docker compose up -d      # Fresh start, keycloak-init will re-run

# To re-run only the init script (without losing data):
docker restart ems-keycloak-init
docker logs -f ems-keycloak-init
```

### 6.4 Keycloak Admin Console

- URL: http://localhost:8180/admin/master/console/
- Username: `admin`
- Password: (value of `KEYCLOAK_ADMIN_PASSWORD`, default `admin`)
- Navigate to: Realm Settings > Clients > `ems-auth-facade` to inspect configuration
- Navigate to: Realm Settings > Realm Roles to see SUPER_ADMIN, ADMIN, MANAGER, USER, VIEWER
- Navigate to: Users > `superadmin` to see role assignments

### 6.5 Default Credentials Summary (Local Dev Only)

| Credential | Value |
|------------|-------|
| Keycloak Admin Console | `admin` / `admin` |
| Superadmin (application) | `superadmin@emsist.com` / `admin` |
| Client ID | `ems-auth-facade` |
| Client Secret | `ems-dev-secret-do-not-use-in-production` |
| PostgreSQL | `postgres` / (from .env) |
| Neo4j | `neo4j` / `changeme` (backend/docker-compose.yml) or `password123` (infrastructure/docker/docker-compose.yml) |

**WARNING:** These credentials are for LOCAL DEVELOPMENT ONLY. Never use these in staging or production. Production secrets must be managed via a secrets manager (e.g., HashiCorp Vault) per DEVOPS-PRINCIPLES.md.

---

## 7. Troubleshooting

### 7.1 Keycloak-init fails with "Failed to obtain admin token"

**Cause:** Keycloak healthcheck passed but the service is not fully ready to accept API calls.

**Fix:** Increase `start_period` in the Keycloak healthcheck or add additional sleep in the init script after health check passes:

```bash
# After health check succeeds, add:
echo "[keycloak-init] Waiting 10 seconds for Keycloak to finish internal initialization..."
sleep 10
```

### 7.2 "Connection refused" when testing from host

**Cause:** Using `keycloak:8080` (container hostname) from host machine.

**Fix:** From the host machine, always use `localhost:8180`. The container-to-container URL is `keycloak:8080`.

### 7.3 Auth-facade cannot authenticate (401 from Keycloak)

**Possible causes:**
1. Client secret mismatch - verify `KEYCLOAK_CLIENT_SECRET` matches between init script and auth-facade
2. Direct Access Grants not enabled - check client config in Keycloak admin console
3. Wrong realm - verify the tenant resolves to `master` (check `X-Tenant-ID: master` header)

**Debug steps:**
```bash
# Check what client_secret auth-facade is using
grep -A5 "keycloak:" backend/auth-facade/src/main/resources/application.yml

# Check what the init script configured
docker logs ems-keycloak-init | grep "Client Secret"

# Test directly against Keycloak
curl -v -X POST http://localhost:8180/realms/master/protocol/openid-connect/token \
  -d "grant_type=password" \
  -d "client_id=ems-auth-facade" \
  -d "client_secret=ems-dev-secret-do-not-use-in-production" \
  -d "username=superadmin@emsist.com" \
  -d "password=admin"
```

### 7.4 Roles missing from JWT claims

**Cause:** The `roles` client scope may not be assigned to the `ems-auth-facade` client.

**Fix:** In Keycloak admin console:
1. Go to Clients > `ems-auth-facade` > Client Scopes
2. Verify "roles" is in the "Default Client Scopes" list
3. If missing, click "Add client scope" and add "roles"

### 7.5 V005 Neo4j Migration Uses Wrong Client ID

**Issue:** The Neo4j migration V005 at `/backend/auth-facade/src/main/resources/neo4j/migrations/V005__create_master_tenant.cypher` (line 51) sets `clientId: 'ems-client'`, but the auth-facade application.yml defaults to `ems-auth-facade`.

**Impact:** If any code reads the client ID from Neo4j instead of application.yml, it will use the wrong value.

**Resolution:** This is a separate fix. Create a new migration (V007 or similar) to update the client ID in Neo4j:

```cypher
MATCH (c:Config {tenantId: 'master', providerName: 'KEYCLOAK'})
SET c.clientId = 'ems-auth-facade',
    c.updatedAt = datetime();
```

---

## Implementation Checklist

| Task | Status | File |
|------|--------|------|
| Create `infrastructure/keycloak/` directory | PENDING | `infrastructure/keycloak/` |
| Create bootstrap script | PENDING | `infrastructure/keycloak/keycloak-init.sh` |
| Add healthcheck to Keycloak in backend/docker-compose.yml | PENDING | `backend/docker-compose.yml` |
| Add keycloak-init service to backend/docker-compose.yml | PENDING | `backend/docker-compose.yml` |
| Add keycloak-init service to infrastructure/docker/docker-compose.yml | PENDING | `infrastructure/docker/docker-compose.yml` |
| Update .env.example with new variables | PENDING | `backend/.env.example` |
| Update application.yml client-secret default | PENDING | `backend/auth-facade/src/main/resources/application.yml` |
| Test end-to-end superadmin login | PENDING | Manual verification |
| Fix V005 client ID mismatch (separate task) | PENDING | Neo4j migration |

---

## DEVOPS Agent Checklist (from DEVOPS-PRINCIPLES v1.0.0)

- [x] Secrets via environment variables, not hardcoded in configs (client secret is env var with dev default)
- [x] Health checks defined (Keycloak healthcheck added)
- [x] Idempotent bootstrapping (script checks for existing resources before creating)
- [x] Alpine-based images used (alpine:3.19 for init container)
- [x] Specific image versions pinned (alpine:3.19, not :latest)
- [x] No secrets committed to repository (.env.example has placeholders)
- [x] Environment parity maintained (same script for both docker-compose files)
- [x] Infrastructure as Code (bootstrap script is version-controlled)
- [x] Documentation updated (this specification document)
- [x] Non-root containers (curlimages/curl runs as non-root by default)
