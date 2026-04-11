#!/bin/sh
# ==============================================================================
# Configure Keycloak LDAP Federation — Forum Systems Public Server
# ==============================================================================
#
# Adds the public Forum Systems LDAP test server as a second User Storage
# Provider in Keycloak, allowing you to test with external LDAP alongside
# the local OpenLDAP instance.
#
# Forum Systems LDAP:
#   Host:     ldap.forumsys.com
#   Port:     389
#   Bind DN:  cn=read-only-admin,dc=example,dc=com
#   Password: password
#   Base DN:  dc=example,dc=com
#   Users:    tesla, einstein, newton, galileo, euler, gauss, riemann, curie
#
# Usage: ./configure-forumsys-ldap.sh
# ==============================================================================
set -e

KC_URL="${KC_URL:-http://localhost:28180}"
KC_ADMIN="${KC_ADMIN:-admin}"
KC_ADMIN_PASS="${KC_ADMIN_PASS:-dev_keycloak_admin}"
REALM="master"

LDAP_URL="ldap://ldap.forumsys.com:389"
LDAP_BIND_DN="cn=read-only-admin,dc=example,dc=com"
LDAP_BIND_PASSWORD="password"
LDAP_BASE_DN="dc=example,dc=com"
LDAP_USER_DN="dc=example,dc=com"

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
    -d "password=${KC_ADMIN_PASS}" 2>&1) || log_fatal "Failed to get admin token."

TOKEN=$(echo "$TOKEN_RESPONSE" | jq -r '.access_token')
[ -z "$TOKEN" ] || [ "$TOKEN" = "null" ] && log_fatal "Token is empty."
log_ok "Admin token obtained."

# ---------------------------------------------------------------------------
# Step 2: Get realm UUID (required as parentId for user storage providers)
# ---------------------------------------------------------------------------
REALM_UUID=$(curl -sf -H "Authorization: Bearer ${TOKEN}" \
    "${KC_URL}/admin/realms/${REALM}" | jq -r '.id // empty')
[ -z "$REALM_UUID" ] && log_fatal "Could not retrieve realm UUID."
log_ok "Realm UUID: ${REALM_UUID}"

# ---------------------------------------------------------------------------
# Step 3: Check if ForumSys federation already exists
# ---------------------------------------------------------------------------
log_info "Checking for existing ForumSys LDAP federation..."
EXISTING=$(curl -sf -H "Authorization: Bearer ${TOKEN}" \
    "${KC_URL}/admin/realms/${REALM}/components?name=forumsys-ldap-test" 2>/dev/null) || EXISTING="[]"

COMPONENT_ID=$(echo "$EXISTING" | jq -r '.[0].id // empty')

if [ -n "$COMPONENT_ID" ]; then
    log_info "ForumSys LDAP federation already exists (id=${COMPONENT_ID}). Updating..."
    HTTP_METHOD="PUT"
    COMPONENT_URL="${KC_URL}/admin/realms/${REALM}/components/${COMPONENT_ID}"
else
    log_info "Creating ForumSys LDAP federation..."
    HTTP_METHOD="POST"
    COMPONENT_URL="${KC_URL}/admin/realms/${REALM}/components"
fi

# ---------------------------------------------------------------------------
# Step 3: Create/update LDAP User Storage Provider
# ---------------------------------------------------------------------------
LDAP_PAYLOAD=$(cat <<EOJSON
{
    "name": "forumsys-ldap-test",
    "providerId": "ldap",
    "providerType": "org.keycloak.storage.UserStorageProvider",
    "parentId": "${REALM_UUID}",
    "config": {
        "enabled": ["true"],
        "priority": ["2"],
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
        "connectionTimeout": ["10000"],
        "readTimeout": ["10000"],

        "usersDn": ["${LDAP_USER_DN}"],
        "userObjectClasses": ["inetOrgPerson"],
        "usernameLDAPAttribute": ["uid"],
        "rdnLDAPAttribute": ["uid"],
        "uuidLDAPAttribute": ["entryUUID"],
        "searchScope": ["1"],
        "pagination": ["false"],

        "importEnabled": ["true"],
        "fullSyncPeriod": ["-1"],
        "changedSyncPeriod": ["-1"],
        "cachePolicy": ["DEFAULT"],

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
    log_ok "ForumSys LDAP federation configured (HTTP ${HTTP_CODE})."
else
    log_error "Failed to configure ForumSys LDAP (HTTP ${HTTP_CODE})."
    exit 1
fi

# Re-fetch component ID
EXISTING=$(curl -sf -H "Authorization: Bearer ${TOKEN}" \
    "${KC_URL}/admin/realms/${REALM}/components?name=forumsys-ldap-test" 2>/dev/null) || EXISTING="[]"
COMPONENT_ID=$(echo "$EXISTING" | jq -r '.[0].id // empty')
log_ok "ForumSys component ID: ${COMPONENT_ID}"

# ---------------------------------------------------------------------------
# Step 4: Add attribute mappers
# ---------------------------------------------------------------------------
log_info "Configuring attribute mappers..."

create_mapper() {
    local mapper_name="$1"
    local mapper_payload="$2"

    local existing_mappers
    existing_mappers=$(curl -sf -H "Authorization: Bearer ${TOKEN}" \
        "${KC_URL}/admin/realms/${REALM}/components?parent=${COMPONENT_ID}&type=org.keycloak.storage.ldap.mappers.LDAPStorageMapper" 2>/dev/null) || existing_mappers="[]"

    local exists
    exists=$(echo "$existing_mappers" | jq -r --arg n "$mapper_name" '[.[] | select(.name == $n)] | length')

    if [ "$exists" != "0" ]; then
        log_info "  Mapper '${mapper_name}' already exists."
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

create_mapper "forumsys-email" "$(cat <<EOJSON
{
    "name": "forumsys-email",
    "providerId": "user-attribute-ldap-mapper",
    "providerType": "org.keycloak.storage.ldap.mappers.LDAPStorageMapper",
    "parentId": "${COMPONENT_ID}",
    "config": {
        "ldap.attribute": ["mail"],
        "user.model.attribute": ["email"],
        "read.only": ["true"],
        "always.read.value.from.ldap": ["true"],
        "is.mandatory.in.ldap": ["false"],
        "is.binary.attribute": ["false"]
    }
}
EOJSON
)"

create_mapper "forumsys-firstname" "$(cat <<EOJSON
{
    "name": "forumsys-firstname",
    "providerId": "user-attribute-ldap-mapper",
    "providerType": "org.keycloak.storage.ldap.mappers.LDAPStorageMapper",
    "parentId": "${COMPONENT_ID}",
    "config": {
        "ldap.attribute": ["cn"],
        "user.model.attribute": ["firstName"],
        "read.only": ["true"],
        "always.read.value.from.ldap": ["true"],
        "is.mandatory.in.ldap": ["false"],
        "is.binary.attribute": ["false"]
    }
}
EOJSON
)"

create_mapper "forumsys-lastname" "$(cat <<EOJSON
{
    "name": "forumsys-lastname",
    "providerId": "user-attribute-ldap-mapper",
    "providerType": "org.keycloak.storage.ldap.mappers.LDAPStorageMapper",
    "parentId": "${COMPONENT_ID}",
    "config": {
        "ldap.attribute": ["sn"],
        "user.model.attribute": ["lastName"],
        "read.only": ["true"],
        "always.read.value.from.ldap": ["true"],
        "is.mandatory.in.ldap": ["false"],
        "is.binary.attribute": ["false"]
    }
}
EOJSON
)"

create_mapper "forumsys-username" "$(cat <<EOJSON
{
    "name": "forumsys-username",
    "providerId": "user-attribute-ldap-mapper",
    "providerType": "org.keycloak.storage.ldap.mappers.LDAPStorageMapper",
    "parentId": "${COMPONENT_ID}",
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

create_mapper "forumsys-groups" "$(cat <<EOJSON
{
    "name": "forumsys-groups",
    "providerId": "role-ldap-mapper",
    "providerType": "org.keycloak.storage.ldap.mappers.LDAPStorageMapper",
    "parentId": "${COMPONENT_ID}",
    "config": {
        "roles.dn": ["dc=example,dc=com"],
        "role.name.ldap.attribute": ["ou"],
        "role.object.classes": ["groupOfUniqueNames"],
        "membership.ldap.attribute": ["uniqueMember"],
        "membership.attribute.type": ["DN"],
        "membership.user.ldap.attribute": ["uid"],
        "roles.ldap.filter": [],
        "mode": ["READ_ONLY"],
        "user.roles.retrieve.strategy": ["LOAD_ROLES_BY_MEMBER_ATTRIBUTE"],
        "use.realm.roles.mapping": ["true"],
        "client.id": []
    }
}
EOJSON
)"

log_ok "Attribute mappers configured."

# ---------------------------------------------------------------------------
# Step 5: Trigger sync
# ---------------------------------------------------------------------------
log_info "Triggering full LDAP sync for ForumSys..."
SYNC_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
    -H "Authorization: Bearer ${TOKEN}" \
    "${KC_URL}/admin/realms/${REALM}/user-storage/${COMPONENT_ID}/sync?action=triggerFullSync")

if [ "$SYNC_CODE" = "200" ]; then
    log_ok "ForumSys LDAP sync triggered."
else
    log_error "Sync returned HTTP ${SYNC_CODE}."
fi

# ---------------------------------------------------------------------------
# Step 6: Test authentication
# ---------------------------------------------------------------------------
sleep 2
log_info "Testing ForumSys user authentication via Keycloak..."

TEST_RESPONSE=$(curl -sf -X POST "${KC_URL}/realms/${REALM}/protocol/openid-connect/token" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "grant_type=password" \
    -d "client_id=ems-auth-facade" \
    -d "client_secret=${KC_CLIENT_SECRET:-ems-auth-facade-secret}" \
    -d "username=tesla" \
    -d "password=password" \
    -d "scope=openid" 2>&1) || TEST_RESPONSE=""

TEST_TOKEN=$(echo "$TEST_RESPONSE" | jq -r '.access_token // empty')

if [ -n "$TEST_TOKEN" ] && [ "$TEST_TOKEN" != "null" ]; then
    log_ok "ForumSys user 'tesla' authenticated via Keycloak OIDC!"
    JWT_PAYLOAD=$(echo "$TEST_TOKEN" | cut -d'.' -f2 | base64 -d 2>/dev/null || echo "$TEST_TOKEN" | cut -d'.' -f2 | base64 -D 2>/dev/null || echo "{}")
    EMAIL=$(echo "$JWT_PAYLOAD" | jq -r '.email // "N/A"' 2>/dev/null)
    SUB=$(echo "$JWT_PAYLOAD" | jq -r '.sub // "N/A"' 2>/dev/null)
    echo "  Email: ${EMAIL}"
    echo "  Sub:   ${SUB}"
else
    log_error "Could not authenticate ForumSys user 'tesla'. This may be due to network access."
    echo "  Response: $(echo "$TEST_RESPONSE" | head -c 200)"
fi

echo ""
echo "============================================================================"
echo " ForumSys LDAP Federation Complete"
echo "============================================================================"
echo ""
echo "  LDAP Server:  ${LDAP_URL}"
echo "  Base DN:      ${LDAP_BASE_DN}"
echo "  Component ID: ${COMPONENT_ID}"
echo ""
echo "  Test users (all passwords: 'password'):"
echo "    tesla, einstein, newton, galileo, euler, gauss, riemann, curie"
echo ""
echo "  Groups: mathematicians, scientists, chemists, italians"
echo "============================================================================"
