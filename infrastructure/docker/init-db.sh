#!/bin/bash
# ============================================================================
# EMSIST DATABASE INITIALIZATION (Per-Service Users)
# Creates databases, per-service users, and grants minimal permissions.
#
# This script replaces the previous init-db.sql to support environment
# variable interpolation for per-service credentials.
#
# Called by PostgreSQL's docker-entrypoint-initdb.d/ mechanism.
# All passwords are sourced from environment variables -- never hardcoded.
#
# IDEMPOTENCY: All CREATE DATABASE, CREATE USER, CREATE TABLE, CREATE INDEX,
# and INSERT statements use IF NOT EXISTS / ON CONFLICT DO NOTHING.
#
# Author: DBA Agent
# Date: 2026-03-03
# ADR: ADR-020 (Service Credential Management)
# Issues: INF-004, INF-010
#
# IMPORTANT: This script must be executable (chmod +x init-db.sh).
# ============================================================================

set -e

echo "========================================"
echo "EMSIST Database Initialization Starting"
echo "========================================"

# ----------------------------------------------------------------------------
# HELPER: Create database, per-service user, and grant minimal permissions.
#
# Arguments:
#   $1 - database name
#   $2 - service user name
#   $3 - environment variable name holding the password
#   $4 - privilege mode: "full" (default) or "append_only" (INSERT + SELECT only)
#
# The password is read from the environment variable named by $3.
# If the variable is empty or unset, the script aborts with an error.
# ----------------------------------------------------------------------------
create_db_and_user() {
  local db_name="$1"
  local user_name="$2"
  local password_var="$3"
  local privilege_mode="${4:-full}"
  local password="${!password_var}"

  if [ -z "$password" ]; then
    echo "ERROR: Environment variable ${password_var} is not set or empty."
    echo "       Cannot create user '${user_name}' without a password."
    echo "       Set ${password_var} in your .env file."
    exit 1
  fi

  echo "--- Creating database '${db_name}' and user '${user_name}' ---"

  # Create database (idempotent)
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    SELECT 'CREATE DATABASE ${db_name}'
      WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${db_name}')
    \gexec
EOSQL

  # Create user (idempotent) and set password
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    DO \$\$
    BEGIN
      IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${user_name}') THEN
        CREATE USER ${user_name} WITH ENCRYPTED PASSWORD '${password}';
      ELSE
        ALTER USER ${user_name} WITH ENCRYPTED PASSWORD '${password}';
      END IF;
    END
    \$\$;
EOSQL

  # Revoke PUBLIC access and grant per-service permissions
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    REVOKE ALL ON DATABASE ${db_name} FROM PUBLIC;
    GRANT CONNECT ON DATABASE ${db_name} TO ${user_name};
EOSQL

  # Grant schema-level permissions (must connect to the target database)
  if [ "$privilege_mode" = "append_only" ]; then
    # Audit-service: INSERT + SELECT only (no UPDATE, no DELETE)
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "${db_name}" <<-EOSQL
      GRANT USAGE ON SCHEMA public TO ${user_name};
      GRANT CREATE ON SCHEMA public TO ${user_name};
      GRANT SELECT, INSERT ON ALL TABLES IN SCHEMA public TO ${user_name};
      GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${user_name};
      ALTER DEFAULT PRIVILEGES IN SCHEMA public
        GRANT SELECT, INSERT ON TABLES TO ${user_name};
      ALTER DEFAULT PRIVILEGES IN SCHEMA public
        GRANT USAGE, SELECT ON SEQUENCES TO ${user_name};
EOSQL
  else
    # Full CRUD (SELECT, INSERT, UPDATE, DELETE) + DDL on own schema
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "${db_name}" <<-EOSQL
      GRANT USAGE ON SCHEMA public TO ${user_name};
      GRANT CREATE ON SCHEMA public TO ${user_name};
      GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${user_name};
      GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${user_name};
      ALTER DEFAULT PRIVILEGES IN SCHEMA public
        GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${user_name};
      ALTER DEFAULT PRIVILEGES IN SCHEMA public
        GRANT USAGE, SELECT ON SEQUENCES TO ${user_name};
EOSQL
  fi

  echo "    Database '${db_name}' and user '${user_name}' ready."
}

# ============================================================================
# STEP 1: Set password encryption to SCRAM-SHA-256 (strongest native auth)
# ============================================================================
echo ""
echo "=== Step 1: Configure SCRAM-SHA-256 password encryption ==="
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
  ALTER SYSTEM SET password_encryption = 'scram-sha-256';
  SELECT pg_reload_conf();
EOSQL

# ============================================================================
# STEP 2: Create Keycloak database and dedicated user
# (Keycloak already had a dedicated user; this preserves and improves it)
# ============================================================================
echo ""
echo "=== Step 2: Keycloak database ==="
create_db_and_user "keycloak_db" "kc_db_user" "KC_DB_PASSWORD" "full"

# Also grant ALL on keycloak_db to kc_db_user (Keycloak needs full control)
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "keycloak_db" <<-EOSQL
  GRANT ALL ON SCHEMA public TO kc_db_user;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO kc_db_user;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO kc_db_user;
EOSQL

# ============================================================================
# STEP 3: Create per-service databases and users
# ============================================================================
echo ""
echo "=== Step 3: Per-service databases and users ==="

# tenant-service -> master_db (may already exist via POSTGRES_DB env var)
create_db_and_user "master_db"        "svc_tenant"   "SVC_TENANT_PASSWORD"       "full"

# user-service -> user_db
create_db_and_user "user_db"          "svc_user"     "SVC_USER_PASSWORD"          "full"

# license-service -> license_db
create_db_and_user "license_db"       "svc_license"  "SVC_LICENSE_PASSWORD"       "full"

# notification-service -> notification_db
create_db_and_user "notification_db"  "svc_notify"   "SVC_NOTIFICATION_PASSWORD"  "full"

# audit-service -> audit_db (APPEND-ONLY: INSERT + SELECT only)
create_db_and_user "audit_db"         "svc_audit"    "SVC_AUDIT_PASSWORD"         "append_only"

# ai-service -> ai_db
create_db_and_user "ai_db"            "svc_ai"       "SVC_AI_PASSWORD"            "full"

# process-service -> process_db
create_db_and_user "process_db"       "svc_process"  "SVC_PROCESS_PASSWORD"       "full"

# ============================================================================
# STEP 4: Revoke PUBLIC from all databases (defense in depth)
# ============================================================================
echo ""
echo "=== Step 4: Revoke PUBLIC access from all databases ==="
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
  REVOKE ALL ON DATABASE keycloak_db FROM PUBLIC;
  REVOKE ALL ON DATABASE master_db FROM PUBLIC;
  REVOKE ALL ON DATABASE user_db FROM PUBLIC;
  REVOKE ALL ON DATABASE license_db FROM PUBLIC;
  REVOKE ALL ON DATABASE notification_db FROM PUBLIC;
  REVOKE ALL ON DATABASE audit_db FROM PUBLIC;
  REVOKE ALL ON DATABASE ai_db FROM PUBLIC;
  REVOKE ALL ON DATABASE process_db FROM PUBLIC;
EOSQL

# ============================================================================
# STEP 5: Initialize master_db schema (tables, triggers, seed data)
# This section preserves all logic from the original init-db.sql.
# ============================================================================
echo ""
echo "=== Step 5: Initialize master_db schema ==="
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "master_db" <<-'EOSQL'

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- TENANTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenants (
    id VARCHAR(50) PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    short_name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    logo_url VARCHAR(500),
    tenant_type VARCHAR(20) NOT NULL CHECK (tenant_type IN ('MASTER', 'DOMINANT', 'REGULAR')),
    tier VARCHAR(20) NOT NULL CHECK (tier IN ('FREE', 'STANDARD', 'PROFESSIONAL', 'ENTERPRISE')),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('ACTIVE', 'LOCKED', 'SUSPENDED', 'PENDING')),
    keycloak_realm VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by VARCHAR(50),
    CONSTRAINT valid_slug CHECK (slug ~ '^[a-z0-9-]+$')
);

CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);
CREATE INDEX IF NOT EXISTS idx_tenants_type ON tenants(tenant_type);
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);

-- ============================================================================
-- TENANT DOMAINS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenant_domains (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'domain-' || substring(gen_random_uuid()::text, 1, 8),
    tenant_id VARCHAR(50) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    domain VARCHAR(255) UNIQUE NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verification_token VARCHAR(255),
    verification_method VARCHAR(20) CHECK (verification_method IN ('DNS_TXT', 'DNS_CNAME', 'FILE')),
    ssl_status VARCHAR(20) DEFAULT 'PENDING' CHECK (ssl_status IN ('PENDING', 'PROVISIONING', 'ACTIVE', 'FAILED')),
    ssl_certificate_id VARCHAR(100),
    ssl_expires_at TIMESTAMP,
    verified_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_domains_tenant ON tenant_domains(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_domains_domain ON tenant_domains(domain);

-- ============================================================================
-- TENANT AUTH PROVIDERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenant_auth_providers (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'auth-' || substring(gen_random_uuid()::text, 1, 8),
    tenant_id VARCHAR(50) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('LOCAL', 'AZURE_AD', 'SAML', 'OIDC', 'LDAP', 'UAEPASS')),
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(100),
    icon VARCHAR(50),
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INT DEFAULT 0,
    config JSONB NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, name)
);

CREATE INDEX IF NOT EXISTS idx_tenant_auth_providers_tenant ON tenant_auth_providers(tenant_id);

-- ============================================================================
-- TENANT BRANDING TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenant_branding (
    tenant_id VARCHAR(50) PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
    primary_color VARCHAR(20) DEFAULT '#6366f1',
    primary_color_dark VARCHAR(20) DEFAULT '#4f46e5',
    secondary_color VARCHAR(20) DEFAULT '#10b981',
    logo_url VARCHAR(500),
    logo_url_dark VARCHAR(500),
    favicon_url VARCHAR(500),
    login_background_url VARCHAR(500),
    font_family VARCHAR(255) DEFAULT '''Inter'', sans-serif',
    custom_css TEXT,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TENANT SESSION CONFIG TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenant_session_config (
    tenant_id VARCHAR(50) PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
    access_token_lifetime INT DEFAULT 5,
    refresh_token_lifetime INT DEFAULT 1440,
    idle_timeout INT DEFAULT 30,
    absolute_timeout INT DEFAULT 480,
    max_concurrent_sessions INT DEFAULT 5,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TENANT MFA CONFIG TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenant_mfa_config (
    tenant_id VARCHAR(50) PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
    enabled BOOLEAN DEFAULT FALSE,
    required BOOLEAN DEFAULT FALSE,
    allowed_methods TEXT[] DEFAULT ARRAY['totp', 'email'],
    default_method VARCHAR(20) DEFAULT 'TOTP',
    grace_period_days INT DEFAULT 7,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TENANT LICENSES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenant_licenses (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'license-' || substring(gen_random_uuid()::text, 1, 8),
    tenant_id VARCHAR(50) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    license_type VARCHAR(50) NOT NULL,
    seats INT NOT NULL DEFAULT 0,
    used_seats INT NOT NULL DEFAULT 0,
    starts_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXPIRED', 'SUSPENDED')),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_licenses_tenant ON tenant_licenses(tenant_id);

-- ============================================================================
-- MASTER USERS TABLE (Superusers)
-- ============================================================================
CREATE TABLE IF NOT EXISTS master_users (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'user-' || substring(gen_random_uuid()::text, 1, 8),
    keycloak_id VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) NOT NULL CHECK (role IN ('superadmin', 'admin', 'support')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'locked', 'disabled')),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_login TIMESTAMP
);

-- ============================================================================
-- AUDIT LOGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    tenant_id VARCHAR(50),
    user_id VARCHAR(50),
    event_type VARCHAR(100) NOT NULL,
    event_category VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50),
    resource_id VARCHAR(100),
    action VARCHAR(50),
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    request_id VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_tenants_updated_at ON tenants;
CREATE TRIGGER trigger_tenants_updated_at
    BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_auth_providers_updated_at ON tenant_auth_providers;
CREATE TRIGGER trigger_auth_providers_updated_at
    BEFORE UPDATE ON tenant_auth_providers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_licenses_updated_at ON tenant_licenses;
CREATE TRIGGER trigger_licenses_updated_at
    BEFORE UPDATE ON tenant_licenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- SEED DATA: Master Tenant
-- All INSERTs use ON CONFLICT DO NOTHING for idempotency
-- ============================================================================
INSERT INTO tenants (id, uuid, full_name, short_name, slug, tenant_type, tier, status, keycloak_realm)
VALUES (
    'tenant-master',
    '68cd2a56-98c9-4ed4-8534-c299566d5b27',
    'EMSIST Platform',
    'EMSIST',
    'master',
    'MASTER',
    'ENTERPRISE',
    'ACTIVE',
    'master'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO tenant_branding (tenant_id) VALUES ('tenant-master')
ON CONFLICT (tenant_id) DO NOTHING;

INSERT INTO tenant_session_config (tenant_id) VALUES ('tenant-master')
ON CONFLICT (tenant_id) DO NOTHING;

INSERT INTO tenant_mfa_config (tenant_id) VALUES ('tenant-master')
ON CONFLICT (tenant_id) DO NOTHING;

INSERT INTO tenant_domains (tenant_id, domain, is_primary, is_verified, verified_at)
VALUES ('tenant-master', 'localhost', TRUE, TRUE, NOW())
ON CONFLICT (domain) DO NOTHING;

EOSQL

# ============================================================================
# STEP 6: Grant svc_tenant permissions on tables created in Step 5
# (DEFAULT PRIVILEGES only applies to future tables; we must also grant on
# tables that already exist from the seed schema above.)
# ============================================================================
echo ""
echo "=== Step 6: Grant svc_tenant permissions on existing master_db tables ==="
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "master_db" <<-EOSQL
  GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO svc_tenant;
  GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO svc_tenant;
EOSQL

echo ""
echo "========================================"
echo "EMSIST Database Initialization Complete"
echo "========================================"
echo ""
echo "Databases created: keycloak_db, master_db, user_db, license_db,"
echo "                   notification_db, audit_db, ai_db, process_db"
echo ""
echo "Per-service users:"
echo "  kc_db_user   -> keycloak_db      (full)"
echo "  svc_tenant   -> master_db        (full CRUD)"
echo "  svc_user     -> user_db          (full CRUD)"
echo "  svc_license  -> license_db       (full CRUD)"
echo "  svc_notify   -> notification_db  (full CRUD)"
echo "  svc_audit    -> audit_db         (append-only: INSERT + SELECT)"
echo "  svc_ai       -> ai_db           (full CRUD)"
echo "  svc_process  -> process_db       (full CRUD)"
echo ""
