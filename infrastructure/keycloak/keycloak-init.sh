#!/bin/sh
# ============================================================================
# Keycloak Master Realm Initialization Script
# ============================================================================
#
# Configures the Keycloak master realm for EMS local development:
#   - Creates the ems-auth-facade confidential client
#   - Creates realm roles matching the Neo4j V004 hierarchy
#   - Creates the superadmin user with SUPER_ADMIN role
#   - Assigns service account roles for admin API access
#
# This script is IDEMPOTENT -- safe to run multiple times.
# It uses the Keycloak Admin REST API via curl + jq.
#
# Environment variables (with local-dev defaults):
#   KEYCLOAK_URL             - Internal Keycloak URL (default: http://keycloak:8080)
#   KEYCLOAK_ADMIN           - Admin username (default: admin)
#   KEYCLOAK_ADMIN_PASSWORD  - Admin password (required)
#   KEYCLOAK_CLIENT_SECRET   - Client secret for ems-auth-facade (default: ems-auth-facade-secret)
#   SUPERADMIN_PASSWORD      - Superadmin user password (default: admin)
#   SUPERADMIN_TEMP_PASSWORD - Whether password is temporary (default: true)
#   FRONTEND_PUBLIC_URL      - Public frontend origin for redirect/web origins
#                              (default: https://ems.example)
#   API_GATEWAY_PUBLIC_URL   - Public API gateway origin for redirect/web origins
#                              (default: https://gateway.ems.example)
#
# ============================================================================
set -e

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
KC_URL="${KEYCLOAK_URL:-http://keycloak:8080}"
KC_ADMIN="${KEYCLOAK_ADMIN:-admin}"
KC_ADMIN_PASS="${KEYCLOAK_ADMIN_PASSWORD:?KEYCLOAK_ADMIN_PASSWORD is required}"
CLIENT_SECRET="${KEYCLOAK_CLIENT_SECRET:-ems-auth-facade-secret}"
SUPERADMIN_PASS="${SUPERADMIN_PASSWORD:-admin}"
SUPERADMIN_TEMP="${SUPERADMIN_TEMP_PASSWORD:-true}"
FRONTEND_PUBLIC_URL="${FRONTEND_PUBLIC_URL:-https://ems.example}"
API_GATEWAY_PUBLIC_URL="${API_GATEWAY_PUBLIC_URL:-https://gateway.ems.example}"
REALM="master"
CLIENT_ID="ems-auth-facade"
MASTER_TENANT_ID="68cd2a56-98c9-4ed4-8534-c299566d5b27"

# ---------------------------------------------------------------------------
# Logging helpers
# ---------------------------------------------------------------------------
log_info()  { echo "[INFO]  $(date '+%H:%M:%S') $*"; }
log_ok()    { echo "[OK]    $(date '+%H:%M:%S') $*"; }
log_skip()  { echo "[SKIP]  $(date '+%H:%M:%S') $*"; }
log_error() { echo "[ERROR] $(date '+%H:%M:%S') $*"; }
log_fatal() { echo "[FATAL] $(date '+%H:%M:%S') $*"; exit 1; }

# ---------------------------------------------------------------------------
# Wait for Keycloak to become healthy
# ---------------------------------------------------------------------------
wait_for_keycloak() {
    log_info "Waiting for Keycloak at ${KC_URL} ..."
    local retries=0
    local max_retries=60
    while [ "$retries" -lt "$max_retries" ]; do
        if curl -sf "${KC_URL}/health/ready" > /dev/null 2>&1; then
            log_ok "Keycloak is ready."
            return 0
        fi
        retries=$((retries + 1))
        log_info "Keycloak not ready yet (attempt ${retries}/${max_retries}). Retrying in 5s..."
        sleep 5
    done
    log_fatal "Keycloak did not become ready within $((max_retries * 5)) seconds."
}

# ---------------------------------------------------------------------------
# Obtain admin access token
# ---------------------------------------------------------------------------
get_admin_token() {
    log_info "Obtaining admin access token..."
    local response
    response=$(curl -sf -X POST "${KC_URL}/realms/master/protocol/openid-connect/token" \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "grant_type=password" \
        -d "client_id=admin-cli" \
        -d "username=${KC_ADMIN}" \
        -d "password=${KC_ADMIN_PASS}" 2>&1) || log_fatal "Failed to obtain admin token. Is the admin password correct?"

    TOKEN=$(echo "$response" | jq -r '.access_token')
    if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
        log_fatal "Admin token is empty. Response: ${response}"
    fi
    log_ok "Admin token obtained."
}

# ---------------------------------------------------------------------------
# Helper: authenticated API call
# ---------------------------------------------------------------------------
kc_get() {
    curl -sf -H "Authorization: Bearer ${TOKEN}" -H "Content-Type: application/json" "$@"
}

kc_post() {
    local url="$1"
    shift
    curl -sf -X POST -H "Authorization: Bearer ${TOKEN}" -H "Content-Type: application/json" "$url" "$@"
}

kc_put() {
    local url="$1"
    shift
    curl -sf -X PUT -H "Authorization: Bearer ${TOKEN}" -H "Content-Type: application/json" "$url" "$@"
}

# ============================================================================
# STEP 1: Create or update the ems-auth-facade client
# ============================================================================
configure_client() {
    log_info "--- Step 1: Configure client '${CLIENT_ID}' in realm '${REALM}' ---"

    # Check if client already exists
    local existing
    existing=$(kc_get "${KC_URL}/admin/realms/${REALM}/clients?clientId=${CLIENT_ID}" 2>/dev/null) || existing="[]"
    local client_uuid
    client_uuid=$(echo "$existing" | jq -r '.[0].id // empty')

    local client_payload
    client_payload=$(cat <<EOJSON
{
    "clientId": "${CLIENT_ID}",
    "name": "EMS Auth Facade",
    "description": "Backend-for-Frontend authentication service for EMS",
    "enabled": true,
    "publicClient": false,
    "directAccessGrantsEnabled": true,
    "standardFlowEnabled": true,
    "serviceAccountsEnabled": true,
    "authorizationServicesEnabled": false,
    "secret": "${CLIENT_SECRET}",
    "redirectUris": [
        "${FRONTEND_PUBLIC_URL%/}/*",
        "${API_GATEWAY_PUBLIC_URL%/}/*"
    ],
    "webOrigins": [
        "${FRONTEND_PUBLIC_URL%/}",
        "${API_GATEWAY_PUBLIC_URL%/}"
    ],
    "defaultClientScopes": [
        "openid",
        "profile",
        "email",
        "roles"
    ],
    "protocol": "openid-connect",
    "attributes": {
        "access.token.lifespan": "300",
        "client.session.idle.timeout": "1800"
    }
}
EOJSON
)

    if [ -n "$client_uuid" ]; then
        log_skip "Client '${CLIENT_ID}' already exists (id=${client_uuid}). Updating..."
        kc_put "${KC_URL}/admin/realms/${REALM}/clients/${client_uuid}" -d "$client_payload" 2>/dev/null \
            && log_ok "Client '${CLIENT_ID}' updated." \
            || log_error "Failed to update client '${CLIENT_ID}'."
    else
        log_info "Creating client '${CLIENT_ID}'..."
        local create_response
        create_response=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
            -H "Authorization: Bearer ${TOKEN}" \
            -H "Content-Type: application/json" \
            "${KC_URL}/admin/realms/${REALM}/clients" \
            -d "$client_payload")
        if [ "$create_response" = "201" ] || [ "$create_response" = "204" ]; then
            log_ok "Client '${CLIENT_ID}' created."
        else
            log_error "Failed to create client '${CLIENT_ID}' (HTTP ${create_response})."
            return 1
        fi
    fi

    # Re-fetch the client UUID (needed for service account role assignment)
    existing=$(kc_get "${KC_URL}/admin/realms/${REALM}/clients?clientId=${CLIENT_ID}" 2>/dev/null) || existing="[]"
    CLIENT_UUID=$(echo "$existing" | jq -r '.[0].id // empty')
    if [ -z "$CLIENT_UUID" ]; then
        log_error "Could not retrieve client UUID for '${CLIENT_ID}' after creation."
        return 1
    fi
    log_ok "Client UUID: ${CLIENT_UUID}"
}

# ============================================================================
# STEP 2: Create realm roles with composite hierarchy
# ============================================================================
configure_roles() {
    log_info "--- Step 2: Configure realm roles ---"

    # Role definitions (order matters for composites)
    local roles="VIEWER USER MANAGER ADMIN SUPER_ADMIN"

    for role in $roles; do
        local existing_role
        existing_role=$(kc_get "${KC_URL}/admin/realms/${REALM}/roles/${role}" 2>/dev/null) || existing_role=""
        if [ -n "$existing_role" ] && echo "$existing_role" | jq -e '.name' > /dev/null 2>&1; then
            log_skip "Role '${role}' already exists."
        else
            log_info "Creating role '${role}'..."
            kc_post "${KC_URL}/admin/realms/${REALM}/roles" \
                -d "{\"name\": \"${role}\", \"description\": \"EMS ${role} role\"}" 2>/dev/null \
                && log_ok "Role '${role}' created." \
                || log_error "Failed to create role '${role}'."
        fi
    done

    # Configure composite role hierarchy:
    #   SUPER_ADMIN includes ADMIN
    #   ADMIN includes MANAGER
    #   MANAGER includes USER
    #   USER includes VIEWER
    log_info "Configuring role composites..."

    set_composite "USER" "VIEWER"
    set_composite "MANAGER" "USER"
    set_composite "ADMIN" "MANAGER"
    set_composite "SUPER_ADMIN" "ADMIN"

    log_ok "Role hierarchy configured."
}

# Helper: add a child role as a composite of a parent role
set_composite() {
    local parent="$1"
    local child="$2"

    # Get child role representation (need the full object for the composites endpoint)
    local child_role
    child_role=$(kc_get "${KC_URL}/admin/realms/${REALM}/roles/${child}" 2>/dev/null) || {
        log_error "Could not fetch role '${child}' for composite assignment."
        return 1
    }

    # Check if composite already exists
    local existing_composites
    existing_composites=$(kc_get "${KC_URL}/admin/realms/${REALM}/roles/${parent}/composites" 2>/dev/null) || existing_composites="[]"
    local already_set
    already_set=$(echo "$existing_composites" | jq -r --arg child "$child" '[.[] | select(.name == $child)] | length')

    if [ "$already_set" != "0" ]; then
        log_skip "Composite ${parent} -> ${child} already set."
        return 0
    fi

    log_info "Setting composite: ${parent} includes ${child}"
    kc_post "${KC_URL}/admin/realms/${REALM}/roles/${parent}/composites" \
        -d "[${child_role}]" 2>/dev/null \
        && log_ok "Composite ${parent} -> ${child} set." \
        || log_error "Failed to set composite ${parent} -> ${child}."
}

# ============================================================================
# STEP 3: Create superadmin user
# ============================================================================
configure_superadmin() {
    log_info "--- Step 3: Configure superadmin user ---"

    # Check if user already exists
    local existing_users
    existing_users=$(kc_get "${KC_URL}/admin/realms/${REALM}/users?username=superadmin&exact=true" 2>/dev/null) || existing_users="[]"
    local user_uuid
    user_uuid=$(echo "$existing_users" | jq -r '.[0].id // empty')

    if [ -n "$user_uuid" ]; then
        log_skip "User 'superadmin' already exists (id=${user_uuid})."
    else
        log_info "Creating user 'superadmin'..."
        local user_payload
        user_payload=$(cat <<EOJSON
{
    "username": "superadmin",
    "email": "info@thinkplus.ae",
    "firstName": "Super",
    "lastName": "Admin",
    "emailVerified": true,
    "enabled": true,
    "attributes": {
        "tenant_id": ["${MASTER_TENANT_ID}"]
    },
    "credentials": [
        {
            "type": "password",
            "value": "${SUPERADMIN_PASS}",
            "temporary": ${SUPERADMIN_TEMP}
        }
    ]
}
EOJSON
)

        local create_response
        create_response=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
            -H "Authorization: Bearer ${TOKEN}" \
            -H "Content-Type: application/json" \
            "${KC_URL}/admin/realms/${REALM}/users" \
            -d "$user_payload")
        if [ "$create_response" = "201" ]; then
            log_ok "User 'superadmin' created."
        else
            log_error "Failed to create user 'superadmin' (HTTP ${create_response})."
            return 1
        fi

        # Re-fetch user UUID
        existing_users=$(kc_get "${KC_URL}/admin/realms/${REALM}/users?username=superadmin&exact=true" 2>/dev/null) || existing_users="[]"
        user_uuid=$(echo "$existing_users" | jq -r '.[0].id // empty')
    fi

    if [ -z "$user_uuid" ]; then
        log_error "Could not retrieve superadmin user UUID."
        return 1
    fi

    # Assign SUPER_ADMIN realm role
    log_info "Assigning SUPER_ADMIN role to superadmin user..."
    local super_admin_role
    super_admin_role=$(kc_get "${KC_URL}/admin/realms/${REALM}/roles/SUPER_ADMIN" 2>/dev/null) || {
        log_error "Could not fetch SUPER_ADMIN role."
        return 1
    }

    # Check if role already assigned
    local user_roles
    user_roles=$(kc_get "${KC_URL}/admin/realms/${REALM}/users/${user_uuid}/role-mappings/realm" 2>/dev/null) || user_roles="[]"
    local has_role
    has_role=$(echo "$user_roles" | jq -r '[.[] | select(.name == "SUPER_ADMIN")] | length')

    if [ "$has_role" != "0" ]; then
        log_skip "User 'superadmin' already has SUPER_ADMIN role."
    else
        kc_post "${KC_URL}/admin/realms/${REALM}/users/${user_uuid}/role-mappings/realm" \
            -d "[${super_admin_role}]" 2>/dev/null \
            && log_ok "SUPER_ADMIN role assigned to superadmin." \
            || log_error "Failed to assign SUPER_ADMIN role to superadmin."
    fi
}

# ============================================================================
# STEP 4: Add tenant_id protocol mapper to the client
#
# Keycloak does not automatically include user attributes in the JWT.
# This mapper reads the "tenant_id" user attribute and emits it as a
# top-level String claim in the access token and ID token.
# ============================================================================
configure_tenant_id_mapper() {
    log_info "--- Step 4: Configure tenant_id protocol mapper ---"

    if [ -z "$CLIENT_UUID" ]; then
        log_error "CLIENT_UUID not set. Cannot configure protocol mapper."
        return 1
    fi

    # Check if mapper already exists
    local existing_mappers
    existing_mappers=$(kc_get "${KC_URL}/admin/realms/${REALM}/clients/${CLIENT_UUID}/protocol-mappers/models" 2>/dev/null) || existing_mappers="[]"
    local already_exists
    already_exists=$(echo "$existing_mappers" | jq -r '[.[] | select(.name == "tenant_id")] | length')

    if [ "$already_exists" != "0" ]; then
        log_skip "Protocol mapper 'tenant_id' already exists."
        return 0
    fi

    local mapper_payload
    mapper_payload=$(cat <<EOJSON
{
    "name": "tenant_id",
    "protocol": "openid-connect",
    "protocolMapper": "oidc-usermodel-attribute-mapper",
    "consentRequired": false,
    "config": {
        "userinfo.token.claim": "true",
        "user.attribute": "tenant_id",
        "id.token.claim": "true",
        "access.token.claim": "true",
        "claim.name": "tenant_id",
        "jsonType.label": "String",
        "multivalued": "false",
        "aggregate.attrs": "false"
    }
}
EOJSON
)

    local http_code
    http_code=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
        -H "Authorization: Bearer ${TOKEN}" \
        -H "Content-Type: application/json" \
        "${KC_URL}/admin/realms/${REALM}/clients/${CLIENT_UUID}/protocol-mappers/models" \
        -d "$mapper_payload")

    if [ "$http_code" = "201" ]; then
        log_ok "Protocol mapper 'tenant_id' created."
    else
        log_error "Failed to create protocol mapper 'tenant_id' (HTTP ${http_code})."
    fi
}

# ============================================================================
# STEP 5: Ensure 'roles' scope is a default client scope
#
# Keycloak 24 does NOT reliably update client scopes via PUT /clients/{id}.
# The correct approach is to use the dedicated scope endpoints:
#   GET  /admin/realms/{realm}/client-scopes         → find the 'roles' scope UUID
#   PUT  /admin/realms/{realm}/clients/{id}/default-client-scopes/{scopeId}
#
# Without the 'roles' scope, Keycloak omits realm_access.roles from the JWT,
# causing downstream services to see an empty role set → 403 on protected endpoints.
# ============================================================================
configure_roles_scope() {
    log_info "--- Step 5: Ensure 'roles' is a default client scope on '${CLIENT_ID}' ---"

    if [ -z "$CLIENT_UUID" ]; then
        log_error "CLIENT_UUID not set. Cannot configure roles scope."
        return 1
    fi

    # Find the 'roles' built-in scope UUID
    local all_scopes
    all_scopes=$(kc_get "${KC_URL}/admin/realms/${REALM}/client-scopes" 2>/dev/null) || all_scopes="[]"
    local roles_scope_id
    roles_scope_id=$(echo "$all_scopes" | jq -r '.[] | select(.name == "roles") | .id // empty')

    if [ -z "$roles_scope_id" ]; then
        log_error "Built-in 'roles' client scope not found in realm '${REALM}'. Cannot assign."
        return 1
    fi
    log_info "Found 'roles' scope UUID: ${roles_scope_id}"

    # Check if 'roles' is already a default scope for the client
    local current_defaults
    current_defaults=$(kc_get "${KC_URL}/admin/realms/${REALM}/clients/${CLIENT_UUID}/default-client-scopes" 2>/dev/null) || current_defaults="[]"
    local already_default
    already_default=$(echo "$current_defaults" | jq -r '[.[] | select(.name == "roles")] | length')

    if [ "$already_default" != "0" ]; then
        log_skip "'roles' scope is already a default scope on '${CLIENT_ID}'."
        return 0
    fi

    log_info "Adding 'roles' as a default scope on client '${CLIENT_ID}'..."
    local http_code
    http_code=$(curl -s -o /dev/null -w "%{http_code}" -X PUT \
        -H "Authorization: Bearer ${TOKEN}" \
        "${KC_URL}/admin/realms/${REALM}/clients/${CLIENT_UUID}/default-client-scopes/${roles_scope_id}")

    if [ "$http_code" = "204" ] || [ "$http_code" = "200" ]; then
        log_ok "'roles' scope assigned as default on '${CLIENT_ID}'. JWT will now include realm_access.roles."
    else
        log_error "Failed to assign 'roles' scope (HTTP ${http_code}). Re-issue tokens after manually adding the scope."
    fi
}

# ============================================================================
# STEP 6: Assign service account roles for admin API access
# ============================================================================
configure_service_account_roles() {
    log_info "--- Step 6: Configure service account roles ---"

    if [ -z "$CLIENT_UUID" ]; then
        log_error "CLIENT_UUID not set. Cannot configure service account roles."
        return 1
    fi

    # Get the service account user for the ems-auth-facade client
    local sa_user
    sa_user=$(kc_get "${KC_URL}/admin/realms/${REALM}/clients/${CLIENT_UUID}/service-account-user" 2>/dev/null) || {
        log_error "Could not fetch service account user for client '${CLIENT_ID}'."
        return 1
    }
    local sa_user_uuid
    sa_user_uuid=$(echo "$sa_user" | jq -r '.id // empty')

    if [ -z "$sa_user_uuid" ]; then
        log_error "Service account user UUID is empty."
        return 1
    fi
    log_ok "Service account user UUID: ${sa_user_uuid}"

    # Find the realm-management client UUID
    local rm_clients
    rm_clients=$(kc_get "${KC_URL}/admin/realms/${REALM}/clients?clientId=realm-management" 2>/dev/null) || rm_clients="[]"

    # In the master realm, the client is called "master-realm" not "realm-management"
    local rm_uuid
    rm_uuid=$(echo "$rm_clients" | jq -r '.[0].id // empty')

    if [ -z "$rm_uuid" ]; then
        log_info "Client 'realm-management' not found. Trying 'master-realm' (master realm uses this name)..."
        rm_clients=$(kc_get "${KC_URL}/admin/realms/${REALM}/clients?clientId=master-realm" 2>/dev/null) || rm_clients="[]"
        rm_uuid=$(echo "$rm_clients" | jq -r '.[0].id // empty')
    fi

    if [ -z "$rm_uuid" ]; then
        log_error "Could not find realm-management or master-realm client."
        return 1
    fi
    log_ok "Realm management client UUID: ${rm_uuid}"

    # Roles to assign: view-users, view-events, manage-users
    local required_roles="view-users view-events manage-users"

    # Get all available client roles for realm-management
    local available_roles
    available_roles=$(kc_get "${KC_URL}/admin/realms/${REALM}/clients/${rm_uuid}/roles" 2>/dev/null) || available_roles="[]"

    # Get currently assigned client roles
    local assigned_roles
    assigned_roles=$(kc_get "${KC_URL}/admin/realms/${REALM}/users/${sa_user_uuid}/role-mappings/clients/${rm_uuid}" 2>/dev/null) || assigned_roles="[]"

    local roles_to_assign="["
    local first="true"

    for role_name in $required_roles; do
        # Check if already assigned
        local already_assigned
        already_assigned=$(echo "$assigned_roles" | jq -r --arg rn "$role_name" '[.[] | select(.name == $rn)] | length')
        if [ "$already_assigned" != "0" ]; then
            log_skip "Service account already has role '${role_name}'."
            continue
        fi

        # Get role representation from available roles
        local role_obj
        role_obj=$(echo "$available_roles" | jq -c --arg rn "$role_name" '.[] | select(.name == $rn)')
        if [ -z "$role_obj" ]; then
            log_error "Role '${role_name}' not found in realm-management client roles."
            continue
        fi

        if [ "$first" = "true" ]; then
            first="false"
        else
            roles_to_assign="${roles_to_assign},"
        fi
        roles_to_assign="${roles_to_assign}${role_obj}"
        log_info "Will assign service account role '${role_name}'."
    done

    roles_to_assign="${roles_to_assign}]"

    if [ "$roles_to_assign" = "[]" ]; then
        log_skip "All service account roles already assigned."
        return 0
    fi

    kc_post "${KC_URL}/admin/realms/${REALM}/users/${sa_user_uuid}/role-mappings/clients/${rm_uuid}" \
        -d "$roles_to_assign" 2>/dev/null \
        && log_ok "Service account roles assigned." \
        || log_error "Failed to assign service account roles."
}

# ============================================================================
# Main execution
# ============================================================================
main() {
    echo "============================================================================"
    echo " Keycloak Master Realm Initialization"
    echo " Realm: ${REALM}"
    echo " Client: ${CLIENT_ID}"
    echo " Target: ${KC_URL}"
    echo "============================================================================"
    echo ""

    wait_for_keycloak
    get_admin_token
    configure_client
    configure_roles
    configure_superadmin
    configure_tenant_id_mapper
    configure_roles_scope
    configure_service_account_roles

    echo ""
    echo "============================================================================"
    log_ok "Keycloak initialization complete."
    echo ""
    echo "  Client ID:     ${CLIENT_ID}"
    echo "  Client Secret:  ${CLIENT_SECRET}"
    echo "  Superadmin:     superadmin / (set via SUPERADMIN_PASSWORD)"
    echo "  Roles:          SUPER_ADMIN > ADMIN > MANAGER > USER > VIEWER"
    echo ""
    echo "  Token endpoint: ${KC_URL}/realms/${REALM}/protocol/openid-connect/token"
    echo "============================================================================"
}

main "$@"
