-- ============================================================================
-- EMS Tenant Service - Per-Service Routing Metadata and Message Control Plane
-- Version: 8
-- Description: Adds per-service graph routing metadata, locale support,
--              provisioning step tracking, and centralized message registry.
-- Author: Codex
-- Date: 2026-03-16
-- Notes:
--   - Current runtime still uses tenants.id as the legacy string primary key.
--   - New Chunk A control-plane structures are anchored on tenants.uuid to keep
--     the target UUID-first contract viable during the transition.
-- ============================================================================

-- Ensure trigger helper exists when baseline migrations skip V1.
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 1. ALIGN TENANT STATUS CHECK CONSTRAINT WITH PROVISIONING LIFECYCLE
-- ============================================================================

ALTER TABLE tenants DROP CONSTRAINT IF EXISTS tenants_status_check;

ALTER TABLE tenants ADD CONSTRAINT tenants_status_check
    CHECK (status IN (
        'PENDING',
        'PROVISIONING',
        'PROVISIONING_FAILED',
        'ACTIVE',
        'SUSPENDED',
        'LOCKED',
        'DELETION_PENDING',
        'DELETION_FAILED',
        'DELETED',
        'RESTORING',
        'DECOMMISSIONED'
    ));

-- ============================================================================
-- 2. ADD PER-SERVICE ROUTING AND LOCALE COLUMNS TO TENANTS
-- ============================================================================

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS auth_db_name VARCHAR(255);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS definitions_db_name VARCHAR(255);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS identity_endpoint VARCHAR(512);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS baseline_version VARCHAR(50);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS default_locale VARCHAR(10) NOT NULL DEFAULT 'en';

CREATE INDEX IF NOT EXISTS idx_tenants_auth_db_name ON tenants(auth_db_name);
CREATE INDEX IF NOT EXISTS idx_tenants_definitions_db_name ON tenants(definitions_db_name);
CREATE INDEX IF NOT EXISTS idx_tenants_default_locale ON tenants(default_locale);

COMMENT ON COLUMN tenants.auth_db_name IS
    'Authoritative Neo4j database name for auth-facade routing (format: tenant_{slug}_auth)';
COMMENT ON COLUMN tenants.definitions_db_name IS
    'Authoritative Neo4j database name for definition-service routing (format: tenant_{slug}_definitions)';
COMMENT ON COLUMN tenants.identity_endpoint IS
    'Reserved identity routing endpoint for future physical identity separation';
COMMENT ON COLUMN tenants.baseline_version IS
    'Control-plane copy of the tenant definition baseline version (e.g., V003)';
COMMENT ON COLUMN tenants.default_locale IS
    'Tenant default locale used for localized data fallback and message resolution';

-- ============================================================================
-- 3. TENANT LOCALES
-- ============================================================================

CREATE TABLE IF NOT EXISTS tenant_locales (
    tenant_uuid  UUID NOT NULL REFERENCES tenants(uuid) ON DELETE CASCADE,
    locale_code  VARCHAR(10) NOT NULL,
    created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    PRIMARY KEY (tenant_uuid, locale_code)
);

CREATE INDEX IF NOT EXISTS idx_tenant_locales_locale_code ON tenant_locales(locale_code);

INSERT INTO tenant_locales (tenant_uuid, locale_code)
SELECT uuid, COALESCE(default_locale, 'en')
FROM tenants
ON CONFLICT (tenant_uuid, locale_code) DO NOTHING;

ALTER TABLE tenants DROP CONSTRAINT IF EXISTS fk_tenants_default_locale;
ALTER TABLE tenants ADD CONSTRAINT fk_tenants_default_locale
    FOREIGN KEY (uuid, default_locale)
    REFERENCES tenant_locales(tenant_uuid, locale_code)
    DEFERRABLE INITIALLY DEFERRED;

COMMENT ON TABLE tenant_locales IS
    'Supported locales per tenant. Default locale must exist here before commit.';

-- ============================================================================
-- 4. PROVISIONING STEP TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS tenant_provisioning_steps (
    id            BIGSERIAL PRIMARY KEY,
    tenant_uuid   UUID NOT NULL REFERENCES tenants(uuid) ON DELETE CASCADE,
    step_name     VARCHAR(50) NOT NULL,
    step_order    INT NOT NULL,
    status        VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    error_message TEXT,
    completed_at  TIMESTAMP WITH TIME ZONE,
    created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_tenant_provisioning_step UNIQUE (tenant_uuid, step_name),
    CONSTRAINT tenant_provisioning_steps_status_check
        CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED'))
);

DROP TRIGGER IF EXISTS update_tenant_provisioning_steps_updated_at ON tenant_provisioning_steps;
CREATE TRIGGER update_tenant_provisioning_steps_updated_at
    BEFORE UPDATE ON tenant_provisioning_steps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_tenant_provisioning_steps_tenant_uuid
    ON tenant_provisioning_steps(tenant_uuid);
CREATE INDEX IF NOT EXISTS idx_tenant_provisioning_steps_status
    ON tenant_provisioning_steps(status);
CREATE INDEX IF NOT EXISTS idx_tenant_provisioning_steps_order
    ON tenant_provisioning_steps(step_order);

COMMENT ON TABLE tenant_provisioning_steps IS
    'Durable per-step orchestration state for tenant provisioning and retry.';

-- ============================================================================
-- 5. CENTRALIZED MESSAGE REGISTRY (ADR-031)
-- ============================================================================

CREATE TABLE IF NOT EXISTS message_registry (
    code            VARCHAR(20) PRIMARY KEY,
    type            CHAR(1) NOT NULL,
    category        VARCHAR(50) NOT NULL,
    http_status     INT,
    default_title   VARCHAR(255) NOT NULL,
    default_detail  TEXT,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT message_registry_type_check
        CHECK (type IN ('E', 'W', 'C', 'I', 'S', 'L'))
);

CREATE TABLE IF NOT EXISTS message_translation (
    code           VARCHAR(20) NOT NULL REFERENCES message_registry(code) ON DELETE CASCADE,
    locale_code    VARCHAR(10) NOT NULL,
    title          VARCHAR(255) NOT NULL,
    detail         TEXT,
    created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    PRIMARY KEY (code, locale_code)
);

DROP TRIGGER IF EXISTS update_message_registry_updated_at ON message_registry;
CREATE TRIGGER update_message_registry_updated_at
    BEFORE UPDATE ON message_registry
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_message_translation_updated_at ON message_translation;
CREATE TRIGGER update_message_translation_updated_at
    BEFORE UPDATE ON message_translation
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_message_registry_category ON message_registry(category);
CREATE INDEX IF NOT EXISTS idx_message_translation_locale_code ON message_translation(locale_code);

COMMENT ON TABLE message_registry IS
    'Centralized message registry hosted in tenant-service master_db per ADR-031.';
COMMENT ON TABLE message_translation IS
    'Localized message translations keyed by code + locale.';

-- Shared COM-* vocabulary seeded here because tenant-service owns the registry.
INSERT INTO message_registry (code, type, category, http_status, default_title, default_detail)
VALUES
    ('COM-I-001', 'I', 'STATUS', NULL, 'Active', 'Represents an active state.'),
    ('COM-I-002', 'I', 'STATUS', NULL, 'Inactive', 'Represents an inactive state.'),
    ('COM-I-003', 'I', 'STATUS', NULL, 'Pending', 'Represents a pending state.'),
    ('COM-I-004', 'I', 'STATUS', NULL, 'Suspended', 'Represents a suspended state.'),
    ('COM-I-005', 'I', 'BOOLEAN', NULL, 'True', 'Represents the boolean value true.'),
    ('COM-I-006', 'I', 'BOOLEAN', NULL, 'False', 'Represents the boolean value false.'),
    ('COM-I-007', 'I', 'BOOLEAN', NULL, 'Yes', 'Represents an affirmative value.'),
    ('COM-I-008', 'I', 'BOOLEAN', NULL, 'No', 'Represents a negative value.')
ON CONFLICT (code) DO NOTHING;

INSERT INTO message_translation (code, locale_code, title, detail)
VALUES
    ('COM-I-001', 'ar', 'نشط', 'يمثل حالة نشطة.'),
    ('COM-I-002', 'ar', 'غير نشط', 'يمثل حالة غير نشطة.'),
    ('COM-I-003', 'ar', 'قيد الانتظار', 'يمثل حالة معلقة.'),
    ('COM-I-004', 'ar', 'معلق', 'يمثل حالة معلقة من قبل النظام أو الإدارة.'),
    ('COM-I-005', 'ar', 'صحيح', 'يمثل القيمة المنطقية صحيح.'),
    ('COM-I-006', 'ar', 'خطأ', 'يمثل القيمة المنطقية خطأ.'),
    ('COM-I-007', 'ar', 'نعم', 'يمثل قيمة تأكيدية.'),
    ('COM-I-008', 'ar', 'لا', 'يمثل قيمة سلبية.')
ON CONFLICT (code, locale_code) DO NOTHING;
