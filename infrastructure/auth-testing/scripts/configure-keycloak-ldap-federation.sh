#!/bin/sh
# ==============================================================================
# Configure Keycloak LDAP User Federation
# ==============================================================================
#
# Connects Keycloak (master realm) to the OpenLDAP test server so that
# LDAP users can authenticate through Keycloak's OIDC/OAuth2 endpoints.
#
# Prerequisites:
#   - Keycloak running and healthy (port 28180 or 8180)
#   - OpenLDAP running and seeded (port 1389)
#
# Usage:
#   ./configure-keycloak-ldap-federation.sh
#
# Environment overrides:
#   KC_URL              (default: http://localhost:28180)
#   KC_ADMIN            (default: admin)
#   KC_ADMIN_PASS       (default: dev_keycloak_admin)
#   LDAP_URL            (default: ldap://openldap:389)  — use container hostname
#   LDAP_BIND_DN        (default: cn=admin,dc=ems,dc=test)
#   LDAP_BIND_PASSWORD  (default: admin)
# ==============================================================================
set -e

KC_URL="${KC_URL:-http://localhost:28180}"
KC_ADMIN="${KC_ADMIN:-admin}"
KC_ADMIN_PASS="${KC_ADMIN_PASS:-dev_keycloak_admin}"
REALM="master"

# LDAP connection — use Docker container hostname (Keycloak connects to LDAP
# inside the Docker network, not via localhost)
LDAP_URL="${LDAP_URL:-ldap://openldap:389}"
LDAP_BIND_DN="${LDAP_BIND_DN:-cn=admin,dc=ems,dc=test}"
LDAP_BIND_PASSWORD="${LDAP_BIND_PASSWORD:-admin}"
LDAP_BASE_DN="dc=ems,dc=test"
LDAP_USER_DN="ou=users,dc=ems,dc=test"
LDAP_GROUP_DN="ou=groups,dc=ems,dc=test"

log_info()  { echo "[INFO]  $(date '+%H:%M:%S') $*"; }
log_ok()    { echo "[OK]    $(date '+%H:%M:%S') $*"; }
log_error() { echo "[ERROR] $(date '+%H:%M:%S') $*"; }
log_fatal() { echo "[FATAL] $(date '+%H:%M:%S') $*"; exit 1; }

# ---------------------------------------------------------------------------
# Step 1: Get admin token
# ---------------------------------------------------------------------------
log_info "Obtaining admin token from ${KC_URL}..."
TOKEN_RESPONSE=$(curl -sf -X POST "${KC_URL}/realms/master/protocol/openid-connect/token" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "grant_type=password" \
    -d "client_id=admin-cli" \
    -d "username=${KC_ADMIN}" \
    -d "password=${KC_ADMIN_PASS}" 2>&1) || log_fatal "Failed to get admin token. Check KC_URL and credentials."

TOKEN=$(echo "$TOKEN_RESPONSE" | jq -r '.access_token')
[ -z "$TOKEN" ] || [ "$TOKEN" = "null" ] && log_fatal "Token is empty. Response: ${TOKEN_RESPONSE}"
log_ok "Admin token obtained."

# ---------------------------------------------------------------------------
# Step 2: Get realm UUID (required as parentId for user storage providers)
# ---------------------------------------------------------------------------
REALM_UUID=$(curl -sf -H "Authorization: Bearer ${TOKEN}" \
    "${KC_URL}/admin/realms/${REALM}" | jq -r '.id // empty')
[ -z "$REALM_UUID" ] && log_fatal "Could not retrieve realm UUID."
log_ok "Realm UUID: ${REALM_UUID}"

# ---------------------------------------------------------------------------
# Step 3: Check if LDAP federation already exists
# ---------------------------------------------------------------------------
log_info "Checking for existing LDAP federation..."
EXISTING=$(curl -sf -H "Authorization: Bearer ${TOKEN}" \
    "${KC_URL}/admin/realms/${REALM}/components?name=ems-ldap-test" 2>/dev/null) || EXISTING="[]"

LDAP_COMPONENT_ID=$(echo "$EXISTING" | jq -r '.[0].id // empty')

if [ -n "$LDAP_COMPONENT_ID" ]; then
    log_info "LDAP federation 'ems-ldap-test' already exists (id=${LDAP_COMPONENT_ID}). Updating..."
    HTTP_METHOD="PUT"
    COMPONENT_URL="${KC_URL}/admin/realms/${REALM}/components/${LDAP_COMPONENT_ID}"
else
    log_info "Creating new LDAP federation 'ems-ldap-test'..."
    HTTP_METHOD="POST"
    COMPONENT_URL="${KC_URL}/admin/realms/${REALM}/components"
fi

# ---------------------------------------------------------------------------
# Step 3: Create/update LDAP User Storage Provider
# ---------------------------------------------------------------------------
LDAP_PAYLOAD=$(cat <<EOJSON
{
    "name": "ems-ldap-test",
    "providerId": "ldap",
    "providerType": "org.keycloak.storage.UserStorageProvider",
    "parentId": "${REALM_UUID}",
    "config": {
        "enabled": ["true"],
        "priority": ["1"],
        "editMode": ["READ_ONLY"],
        "syncRegistrations": ["false"],
        "vendor": ["other"],

        "connectionUrl": ["${LDAP_URL}"],
        "bindDn": ["${LDAP_BIND_DN}"],
        "bindCredential": ["${LDAP_BIND_PASSWORD}"],
        "startTls": ["false"],
        "authType": ["simple"],
        "useTruststoreSpi": ["ldapsOnly"],
        "connectionPooling": ["true"],
        "connectionTimeout": ["5000"],
        "readTimeout": ["10000"],

        "usersDn": ["${LDAP_USER_DN}"],
        "userObjectClasses": ["inetOrgPerson"],
        "usernameLDAPAttribute": ["uid"],
        "rdnLDAPAttribute": ["uid"],
        "uuidLDAPAttribute": ["entryUUID"],
        "searchScope": ["1"],
        "pagination": ["true"],
        "batchSizeForSync": ["1000"],

        "importEnabled": ["true"],
        "fullSyncPeriod": ["-1"],
        "changedSyncPeriod": ["-1"],
        "cachePolicy": ["DEFAULT"],
        "evictionDay": [],
        "evictionHour": [],
        "evictionMinute": [],
        "maxLifespan": [],

        "trustEmail": ["true"],
        "allowKerberosAuthentication": ["false"],
        "useKerberosForPasswordAuthentication": ["false"],
        "validatePasswordPolicy": ["false"]
    }
}
EOJSON
)

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X ${HTTP_METHOD} \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    "${COMPONENT_URL}" \
    -d "$LDAP_PAYLOAD")

if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "204" ] || [ "$HTTP_CODE" = "200" ]; then
    log_ok "LDAP User Storage Provider configured (HTTP ${HTTP_CODE})."
else
    log_error "Failed to configure LDAP provider (HTTP ${HTTP_CODE})."
    # Fetch error details
    curl -s -X ${HTTP_METHOD} \
        -H "Authorization: Bearer ${TOKEN}" \
        -H "Content-Type: application/json" \
        "${COMPONENT_URL}" \
        -d "$LDAP_PAYLOAD" 2>&1 | head -20
    exit 1
fi

# Re-fetch the component ID (needed for sub-components)
EXISTING=$(curl -sf -H "Authorization: Bearer ${TOKEN}" \
    "${KC_URL}/admin/realms/${REALM}/components?name=ems-ldap-test" 2>/dev/null) || EXISTING="[]"
LDAP_COMPONENT_ID=$(echo "$EXISTING" | jq -r '.[0].id // empty')

if [ -z "$LDAP_COMPONENT_ID" ]; then
    log_fatal "Could not retrieve LDAP component ID after creation."
fi
log_ok "LDAP component ID: ${LDAP_COMPONENT_ID}"

# ---------------------------------------------------------------------------
# Step 4: Add attribute mappers
# ---------------------------------------------------------------------------
log_info "Configuring LDAP attribute mappers..."

# Helper to create a mapper if it doesn't exist
create_mapper() {
    local mapper_name="$1"
    local mapper_payload="$2"

    local existing_mappers
    existing_mappers=$(curl -sf -H "Authorization: Bearer ${TOKEN}" \
        "${KC_URL}/admin/realms/${REALM}/components?parent=${LDAP_COMPONENT_ID}&type=org.keycloak.storage.ldap.mappers.LDAPStorageMapper" 2>/dev/null) || existing_mappers="[]"

    local exists
    exists=$(echo "$existing_mappers" | jq -r --arg n "$mapper_name" '[.[] | select(.name == $n)] | length')

    if [ "$exists" != "0" ]; then
        log_info "  Mapper '${mapper_name}' already exists. Skipping."
        return 0
    fi

    local code
    code=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
        -H "Authorization: Bearer ${TOKEN}" \
        -H "Content-Type: application/json" \
        "${KC_URL}/admin/realms/${REALM}/components" \
        -d "$mapper_payload")

    if [ "$code" = "201" ]; then
        log_ok "  Mapper '${mapper_name}' created."
    else
        log_error "  Failed to create mapper '${mapper_name}' (HTTP ${code})."
    fi
}

# 4a. Email mapper
create_mapper "email" "$(cat <<EOJSON
{
    "name": "email",
    "providerId": "user-attribute-ldap-mapper",
    "providerType": "org.keycloak.storage.ldap.mappers.LDAPStorageMapper",
    "parentId": "${LDAP_COMPONENT_ID}",
    "config": {
        "ldap.attribute": ["mail"],
        "user.model.attribute": ["email"],
        "read.only": ["true"],
        "always.read.value.from.ldap": ["true"],
        "is.mandatory.in.ldap": ["true"],
        "is.binary.attribute": ["false"]
    }
}
EOJSON
)"

# 4b. First name mapper
create_mapper "first name" "$(cat <<EOJSON
{
    "name": "first name",
    "providerId": "user-attribute-ldap-mapper",
    "providerType": "org.keycloak.storage.ldap.mappers.LDAPStorageMapper",
    "parentId": "${LDAP_COMPONENT_ID}",
    "config": {
        "ldap.attribute": ["givenName"],
        "user.model.attribute": ["firstName"],
        "read.only": ["true"],
        "always.read.value.from.ldap": ["true"],
        "is.mandatory.in.ldap": ["false"],
        "is.binary.attribute": ["false"]
    }
}
EOJSON
)"

# 4c. Last name mapper
create_mapper "last name" "$(cat <<EOJSON
{
    "name": "last name",
    "providerId": "user-attribute-ldap-mapper",
    "providerType": "org.keycloak.storage.ldap.mappers.LDAPStorageMapper",
    "parentId": "${LDAP_COMPONENT_ID}",
    "config": {
        "ldap.attribute": ["sn"],
        "user.model.attribute": ["lastName"],
        "read.only": ["true"],
        "always.read.value.from.ldap": ["true"],
        "is.mandatory.in.ldap": ["true"],
        "is.binary.attribute": ["false"]
    }
}
EOJSON
)"

# 4d. Username mapper
create_mapper "username" "$(cat <<EOJSON
{
    "name": "username",
    "providerId": "user-attribute-ldap-mapper",
    "providerType": "org.keycloak.storage.ldap.mappers.LDAPStorageMapper",
    "parentId": "${LDAP_COMPONENT_ID}",
    "config": {
        "ldap.attribute": ["uid"],
        "user.model.attribute": ["username"],
        "read.only": ["true"],
        "always.read.value.from.ldap": ["true"],
        "is.mandatory.in.ldap": ["true"],
        "is.binary.attribute": ["false"]
    }
}
EOJSON
)"

# 4e. Group mapper — maps LDAP groups to Keycloak roles
create_mapper "group-to-role" "$(cat <<EOJSON
{
    "name": "group-to-role",
    "providerId": "role-ldap-mapper",
    "providerType": "org.keycloak.storage.ldap.mappers.LDAPStorageMapper",
    "parentId": "${LDAP_COMPONENT_ID}",
    "config": {
        "roles.dn": ["${LDAP_GROUP_DN}"],
        "role.name.ldap.attribute": ["cn"],
        "role.object.classes": ["groupOfNames"],
        "membership.ldap.attribute": ["member"],
        "membership.attribute.type": ["DN"],
        "membership.user.ldap.attribute": ["uid"],
        "roles.ldap.filter": [],
        "mode": ["LDAP_ONLY"],
        "user.roles.retrieve.strategy": ["LOAD_ROLES_BY_MEMBER_ATTRIBUTE"],
        "use.realm.roles.mapping": ["true"],
        "client.id": []
    }
}
EOJSON
)"

log_ok "Attribute mappers configured."

# ---------------------------------------------------------------------------
# Step 5: Trigger initial user sync
# ---------------------------------------------------------------------------
log_info "Triggering full LDAP user sync..."
SYNC_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
    -H "Authorization: Bearer ${TOKEN}" \
    "${KC_URL}/admin/realms/${REALM}/user-storage/${LDAP_COMPONENT_ID}/sync?action=triggerFullSync")

if [ "$SYNC_CODE" = "200" ]; then
    log_ok "LDAP full sync triggered. Users should now appear in Keycloak."
else
    log_error "LDAP sync returned HTTP ${SYNC_CODE}. Check Keycloak logs for details."
fi

# ---------------------------------------------------------------------------
# Step 6: Verify — list synced users
# ---------------------------------------------------------------------------
log_info "Verifying synced LDAP users in Keycloak..."
sleep 3  # Brief wait for sync to complete

USERS=$(curl -sf -H "Authorization: Bearer ${TOKEN}" \
    "${KC_URL}/admin/realms/${REALM}/users?max=50" 2>/dev/null) || USERS="[]"

LDAP_USERS=$(echo "$USERS" | jq -r '[.[] | select(.federationLink != null)] | length')
log_ok "Found ${LDAP_USERS} federated (LDAP) users in Keycloak."

echo "$USERS" | jq -r '.[] | select(.federationLink != null) | "  - \(.username) (\(.email // "no email"))"'

echo ""
echo "============================================================================"
echo " LDAP Federation Configuration Complete"
echo "============================================================================"
echo ""
echo "  LDAP Server:     ${LDAP_URL}"
echo "  Base DN:         ${LDAP_BASE_DN}"
echo "  Users DN:        ${LDAP_USER_DN}"
echo "  Groups DN:       ${LDAP_GROUP_DN}"
echo "  Bind DN:         ${LDAP_BIND_DN}"
echo "  Component ID:    ${LDAP_COMPONENT_ID}"
echo ""
echo "  LDAP users can now authenticate via Keycloak OIDC/OAuth2 endpoints."
echo "  Test with: ./scripts/test-all-protocols.sh"
echo "============================================================================"
