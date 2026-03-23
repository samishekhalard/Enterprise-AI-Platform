-- ============================================================================
-- EMS Tenant Service - Database Schema
-- Version: 1.0.0
-- Database: PostgreSQL 16+
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- TENANTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenants (
    id              VARCHAR(50) PRIMARY KEY,
    uuid            UUID NOT NULL UNIQUE DEFAULT uuid_generate_v4(),
    full_name       VARCHAR(255) NOT NULL,
    short_name      VARCHAR(100) NOT NULL,
    slug            VARCHAR(100) NOT NULL UNIQUE,
    description     TEXT,
    logo_url        VARCHAR(500),
    tenant_type     VARCHAR(20) NOT NULL CHECK (tenant_type IN ('MASTER', 'DOMINANT', 'REGULAR')),
    tier            VARCHAR(20) NOT NULL CHECK (tier IN ('FREE', 'STANDARD', 'PROFESSIONAL', 'ENTERPRISE')),
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('ACTIVE', 'LOCKED', 'SUSPENDED', 'PENDING')),
    keycloak_realm  VARCHAR(100),
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by      VARCHAR(50)
);

CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);
CREATE INDEX IF NOT EXISTS idx_tenants_type ON tenants(tenant_type);
CREATE INDEX IF NOT EXISTS idx_tenants_uuid ON tenants(uuid);

-- ============================================================================
-- TENANT DOMAINS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenant_domains (
    id                  VARCHAR(50) PRIMARY KEY,
    tenant_id           VARCHAR(50) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    domain              VARCHAR(255) NOT NULL UNIQUE,
    is_primary          BOOLEAN NOT NULL DEFAULT FALSE,
    is_verified         BOOLEAN NOT NULL DEFAULT FALSE,
    verification_token  VARCHAR(255),
    verification_method VARCHAR(20) DEFAULT 'DNS_TXT' CHECK (verification_method IN ('DNS_TXT', 'DNS_CNAME', 'FILE')),
    ssl_status          VARCHAR(20) DEFAULT 'PENDING' CHECK (ssl_status IN ('PENDING', 'PROVISIONING', 'ACTIVE', 'FAILED')),
    ssl_certificate_id  VARCHAR(100),
    ssl_expires_at      TIMESTAMP WITH TIME ZONE,
    verified_at         TIMESTAMP WITH TIME ZONE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_domains_tenant ON tenant_domains(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_domains_domain ON tenant_domains(domain);
CREATE INDEX IF NOT EXISTS idx_tenant_domains_verified ON tenant_domains(is_verified);

-- ============================================================================
-- TENANT AUTH PROVIDERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenant_auth_providers (
    id              VARCHAR(50) PRIMARY KEY,
    tenant_id       VARCHAR(50) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    type            VARCHAR(20) NOT NULL CHECK (type IN ('LOCAL', 'AZURE_AD', 'SAML', 'OIDC', 'LDAP', 'UAEPASS')),
    name            VARCHAR(100) NOT NULL,
    display_name    VARCHAR(100),
    icon            VARCHAR(50),
    is_enabled      BOOLEAN NOT NULL DEFAULT TRUE,
    is_primary      BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order      INTEGER DEFAULT 0,
    config          JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_auth_providers_tenant ON tenant_auth_providers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_auth_providers_type ON tenant_auth_providers(type);
CREATE INDEX IF NOT EXISTS idx_tenant_auth_providers_enabled ON tenant_auth_providers(is_enabled);

-- ============================================================================
-- TENANT BRANDING TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenant_branding (
    tenant_id           VARCHAR(50) PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
    primary_color       VARCHAR(20) DEFAULT '#6366f1',
    primary_color_dark  VARCHAR(20) DEFAULT '#4f46e5',
    secondary_color     VARCHAR(20) DEFAULT '#10b981',
    logo_url            VARCHAR(500),
    logo_url_dark       VARCHAR(500),
    favicon_url         VARCHAR(500),
    login_background_url VARCHAR(500),
    font_family         VARCHAR(100) DEFAULT '''Inter'', sans-serif',
    custom_css          TEXT,
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TENANT SESSION CONFIG TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenant_session_config (
    tenant_id               VARCHAR(50) PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
    access_token_lifetime   INTEGER NOT NULL DEFAULT 5,      -- minutes
    refresh_token_lifetime  INTEGER NOT NULL DEFAULT 1440,   -- 24 hours in minutes
    idle_timeout            INTEGER NOT NULL DEFAULT 30,     -- minutes
    absolute_timeout        INTEGER NOT NULL DEFAULT 480,    -- 8 hours in minutes
    max_concurrent_sessions INTEGER NOT NULL DEFAULT 5,
    updated_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TENANT MFA CONFIG TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenant_mfa_config (
    tenant_id           VARCHAR(50) PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
    enabled             BOOLEAN NOT NULL DEFAULT FALSE,
    required            BOOLEAN NOT NULL DEFAULT FALSE,
    allowed_methods     TEXT[] DEFAULT ARRAY['totp', 'email'],
    default_method      VARCHAR(20) DEFAULT 'TOTP' CHECK (default_method IN ('TOTP', 'SMS', 'EMAIL', 'WEBAUTHN')),
    grace_period_days   INTEGER DEFAULT 7,
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TRIGGER: Update updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_tenants_updated_at ON tenants;
CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tenant_auth_providers_updated_at ON tenant_auth_providers;
CREATE TRIGGER update_tenant_auth_providers_updated_at
    BEFORE UPDATE ON tenant_auth_providers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tenant_branding_updated_at ON tenant_branding;
CREATE TRIGGER update_tenant_branding_updated_at
    BEFORE UPDATE ON tenant_branding
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tenant_session_config_updated_at ON tenant_session_config;
CREATE TRIGGER update_tenant_session_config_updated_at
    BEFORE UPDATE ON tenant_session_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tenant_mfa_config_updated_at ON tenant_mfa_config;
CREATE TRIGGER update_tenant_mfa_config_updated_at
    BEFORE UPDATE ON tenant_mfa_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
