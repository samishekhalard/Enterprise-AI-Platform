# ==============================================================================
# Keycloak Init Container
# One-shot sidecar that bootstraps the Keycloak master realm for EMS.
# Exits 0 on success, non-zero on failure.
#
# Creates: ems-auth-facade client, realm role hierarchy, superadmin user,
#          and service account roles for admin API access.
# ==============================================================================
FROM alpine:3.19

RUN apk add --no-cache curl jq

COPY keycloak-init.sh /usr/local/bin/keycloak-init.sh
RUN chmod +x /usr/local/bin/keycloak-init.sh

ENTRYPOINT ["/usr/local/bin/keycloak-init.sh"]
