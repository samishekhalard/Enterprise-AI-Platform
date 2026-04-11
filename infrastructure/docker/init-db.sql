-- ============================================================================
-- EMSIST DATABASE INITIALIZATION
-- Creates databases and users for all services
--
-- IDEMPOTENCY: This script is designed to be safe to run multiple times.
-- All CREATE TABLE uses IF NOT EXISTS, all CREATE INDEX uses IF NOT EXISTS,
-- all INSERT uses ON CONFLICT DO NOTHING, and triggers use DROP IF EXISTS
-- before CREATE.
--
-- Author: DBA Agent
-- Updated: 2026-03-02 (idempotency fixes for database durability)
-- ============================================================================

-- Create Keycloak database and user
SELECT 'CREATE DATABASE keycloak_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'keycloak_db')\gexec
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'keycloak') THEN
    CREATE USER keycloak WITH ENCRYPTED PASSWORD 'keycloak';
  END IF;
END $$;
GRANT ALL PRIVILEGES ON DATABASE keycloak_db TO keycloak;

-- Grant schema permissions for Keycloak
\c keycloak_db
GRANT ALL ON SCHEMA public TO keycloak;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO keycloak;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO keycloak;

-- Connect back to default
\c postgres

-- Create Master database (tenant registry) -- may already exist via POSTGRES_DB env var
SELECT 'CREATE DATABASE master_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'master_db')\gexec

-- Create Audit database
SELECT 'CREATE DATABASE audit_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'audit_db')\gexec

-- Create service databases
SELECT 'CREATE DATABASE user_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'user_db')\gexec
SELECT 'CREATE DATABASE license_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'license_db')\gexec
SELECT 'CREATE DATABASE notification_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'notification_db')\gexec
SELECT 'CREATE DATABASE ai_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'ai_db')\gexec

-- Connect to ai_db and enable extensions needed by ai-service
\c ai_db
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS vector;

-- Connect to master_db and create schema
\c master_db

-- Enable UUID extension
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
-- NOTE: Keep in sync with V1 Flyway migration + V9 (neumorphic) + V10 (jsonb)
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenant_branding (
    tenant_id            VARCHAR(50) PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
    -- Base colors
    primary_color        VARCHAR(20) DEFAULT '#428177',
    primary_color_dark   VARCHAR(20) DEFAULT '#054239',
    secondary_color      VARCHAR(20) DEFAULT '#b9a779',
    -- Asset URLs
    logo_url             VARCHAR(500),
    logo_url_dark        VARCHAR(500),
    favicon_url          VARCHAR(500),
    login_background_url VARCHAR(500),
    -- Typography & CSS
    font_family          VARCHAR(255) DEFAULT '''Gotham Rounded'', ''Nunito'', sans-serif',
    custom_css           TEXT,
    -- Neumorphic Color Controls (V9)
    surface_color        VARCHAR(20),
    text_color           VARCHAR(20),
    shadow_dark_color    VARCHAR(20),
    shadow_light_color   VARCHAR(20),
    -- Neumorphic Shape Controls (V9)
    corner_radius        INTEGER CHECK (corner_radius IS NULL OR corner_radius BETWEEN 0 AND 40),
    button_depth         INTEGER CHECK (button_depth IS NULL OR button_depth BETWEEN 0 AND 30),
    shadow_intensity     INTEGER CHECK (shadow_intensity IS NULL OR shadow_intensity BETWEEN 0 AND 100),
    soft_shadows         BOOLEAN,
    compact_nav          BOOLEAN,
    -- Per-Component Hover Behaviour (V9)
    hover_button         VARCHAR(20) CHECK (hover_button IS NULL OR hover_button IN ('lift', 'press', 'glow', 'none')),
    hover_card           VARCHAR(20) CHECK (hover_card IS NULL OR hover_card IN ('lift', 'glow', 'none')),
    hover_input          VARCHAR(20) CHECK (hover_input IS NULL OR hover_input IN ('press', 'highlight', 'none')),
    hover_nav            VARCHAR(20) CHECK (hover_nav IS NULL OR hover_nav IN ('slide', 'lift', 'highlight', 'none')),
    hover_table_row      VARCHAR(20) CHECK (hover_table_row IS NULL OR hover_table_row IN ('highlight', 'lift', 'none')),
    -- Per-Component Token Overrides JSONB (V10)
    component_tokens     JSONB CHECK (component_tokens IS NULL OR jsonb_typeof(component_tokens) = 'object'),
    updated_at           TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tb_component_tokens_gin ON tenant_branding USING gin(component_tokens);

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

-- If per-service roles exist, transfer master_db ownership to svc_tenant so
-- Flyway can run DDL migrations against the preseeded baseline tables.
DO $$
DECLARE
    r RECORD;
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'svc_tenant') THEN
        FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
            EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' OWNER TO svc_tenant';
        END LOOP;

        FOR r IN SELECT sequencename FROM pg_sequences WHERE schemaname = 'public' LOOP
            EXECUTE 'ALTER SEQUENCE public.' || quote_ident(r.sequencename) || ' OWNER TO svc_tenant';
        END LOOP;
    END IF;
END $$;

-- Init complete
