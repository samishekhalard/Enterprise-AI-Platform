-- ============================================================================
-- LICENSE MANAGEMENT
-- ============================================================================

-- Drop legacy tables if they exist with incompatible schema
-- (This service uses its own flyway history table: flyway_schema_history_license)
DROP TABLE IF EXISTS user_license_assignments CASCADE;
DROP TABLE IF EXISTS license_features CASCADE;
DROP TABLE IF EXISTS tenant_licenses CASCADE;
DROP TABLE IF EXISTS license_products CASCADE;

-- License Products (e.g., EMSIST Starter, EMSIST Pro, EMSIST Enterprise)
CREATE TABLE license_products (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(100) NOT NULL UNIQUE,
    display_name    VARCHAR(255) NOT NULL,
    description     TEXT,
    monthly_price   DECIMAL(10, 2),
    annual_price    DECIMAL(10, 2),
    is_active       BOOLEAN DEFAULT TRUE,
    sort_order      INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- License Features (features included in each product)
CREATE TABLE license_features (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id    UUID NOT NULL REFERENCES license_products(id) ON DELETE CASCADE,
    feature_key   VARCHAR(100) NOT NULL,
    display_name  VARCHAR(255) NOT NULL,
    description   TEXT,
    is_core       BOOLEAN DEFAULT FALSE,
    created_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_feature_product_key UNIQUE (product_id, feature_key)
);

CREATE INDEX idx_features_product ON license_features(product_id);
CREATE INDEX idx_features_key ON license_features(feature_key);

-- Tenant Licenses (license pools per tenant)
CREATE TABLE tenant_licenses (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       VARCHAR(50) NOT NULL,
    product_id      UUID NOT NULL REFERENCES license_products(id),

    -- Seat Management
    total_seats     INTEGER NOT NULL,
    assigned_seats  INTEGER DEFAULT 0,

    -- Validity
    valid_from      DATE NOT NULL,
    valid_until     DATE NOT NULL,

    -- Billing
    billing_cycle   VARCHAR(20) DEFAULT 'MONTHLY',  -- MONTHLY, ANNUAL
    auto_renew      BOOLEAN DEFAULT TRUE,

    -- Status
    status          VARCHAR(20) DEFAULT 'ACTIVE',  -- ACTIVE, SUSPENDED, EXPIRED, CANCELLED

    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_tenant_license_product UNIQUE (tenant_id, product_id),
    CONSTRAINT chk_seats CHECK (assigned_seats >= 0 AND assigned_seats <= total_seats),
    CONSTRAINT chk_validity CHECK (valid_until >= valid_from)
);

CREATE INDEX idx_tenant_licenses_tenant ON tenant_licenses(tenant_id);
CREATE INDEX idx_tenant_licenses_product ON tenant_licenses(product_id);
CREATE INDEX idx_tenant_licenses_valid ON tenant_licenses(valid_until);
CREATE INDEX idx_tenant_licenses_status ON tenant_licenses(status);

-- User License Assignments (seat assignments)
CREATE TABLE user_license_assignments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL,
    tenant_license_id   UUID NOT NULL REFERENCES tenant_licenses(id) ON DELETE CASCADE,

    -- Feature Overrides
    enabled_features    JSONB DEFAULT '[]',   -- Features explicitly enabled
    disabled_features   JSONB DEFAULT '[]',   -- Features explicitly disabled

    -- Audit
    assigned_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    assigned_by         UUID,

    CONSTRAINT uk_user_license UNIQUE (user_id, tenant_license_id)
);

CREATE INDEX idx_user_license_user ON user_license_assignments(user_id);
CREATE INDEX idx_user_license_tenant ON user_license_assignments(tenant_license_id);

-- ============================================================================
-- SEED DATA: Default License Products
-- ============================================================================

INSERT INTO license_products (name, display_name, description, monthly_price, annual_price, sort_order) VALUES
('EMSIST_STARTER', 'EMSIST Starter', 'Basic features for small teams', 9.99, 99.99, 1),
('EMSIST_PRO', 'EMSIST Pro', 'Advanced features for growing teams', 29.99, 299.99, 2),
('EMSIST_ENTERPRISE', 'EMSIST Enterprise', 'Full feature set for large organizations', 99.99, 999.99, 3)
ON CONFLICT (name) DO NOTHING;

-- Starter Features
INSERT INTO license_features (product_id, feature_key, display_name, description, is_core) VALUES
((SELECT id FROM license_products WHERE name = 'EMSIST_STARTER'), 'basic_workflows', 'Basic Workflows', 'Create and manage basic workflows', TRUE),
((SELECT id FROM license_products WHERE name = 'EMSIST_STARTER'), 'basic_reports', 'Basic Reports', 'Access to standard reports', TRUE),
((SELECT id FROM license_products WHERE name = 'EMSIST_STARTER'), 'email_notifications', 'Email Notifications', 'Email notification support', TRUE)
ON CONFLICT (product_id, feature_key) DO NOTHING;

-- Pro Features (includes Starter + more)
INSERT INTO license_features (product_id, feature_key, display_name, description, is_core) VALUES
((SELECT id FROM license_products WHERE name = 'EMSIST_PRO'), 'basic_workflows', 'Basic Workflows', 'Create and manage basic workflows', TRUE),
((SELECT id FROM license_products WHERE name = 'EMSIST_PRO'), 'basic_reports', 'Basic Reports', 'Access to standard reports', TRUE),
((SELECT id FROM license_products WHERE name = 'EMSIST_PRO'), 'email_notifications', 'Email Notifications', 'Email notification support', TRUE),
((SELECT id FROM license_products WHERE name = 'EMSIST_PRO'), 'advanced_workflows', 'Advanced Workflows', 'Complex workflow automation', FALSE),
((SELECT id FROM license_products WHERE name = 'EMSIST_PRO'), 'advanced_reports', 'Advanced Reports', 'Custom and advanced reporting', FALSE),
((SELECT id FROM license_products WHERE name = 'EMSIST_PRO'), 'api_access', 'API Access', 'REST API access for integrations', FALSE),
((SELECT id FROM license_products WHERE name = 'EMSIST_PRO'), 'webhooks', 'Webhooks', 'Webhook notifications', FALSE)
ON CONFLICT (product_id, feature_key) DO NOTHING;

-- Enterprise Features (includes Pro + more)
INSERT INTO license_features (product_id, feature_key, display_name, description, is_core) VALUES
((SELECT id FROM license_products WHERE name = 'EMSIST_ENTERPRISE'), 'basic_workflows', 'Basic Workflows', 'Create and manage basic workflows', TRUE),
((SELECT id FROM license_products WHERE name = 'EMSIST_ENTERPRISE'), 'basic_reports', 'Basic Reports', 'Access to standard reports', TRUE),
((SELECT id FROM license_products WHERE name = 'EMSIST_ENTERPRISE'), 'email_notifications', 'Email Notifications', 'Email notification support', TRUE),
((SELECT id FROM license_products WHERE name = 'EMSIST_ENTERPRISE'), 'advanced_workflows', 'Advanced Workflows', 'Complex workflow automation', FALSE),
((SELECT id FROM license_products WHERE name = 'EMSIST_ENTERPRISE'), 'advanced_reports', 'Advanced Reports', 'Custom and advanced reporting', FALSE),
((SELECT id FROM license_products WHERE name = 'EMSIST_ENTERPRISE'), 'api_access', 'API Access', 'REST API access for integrations', FALSE),
((SELECT id FROM license_products WHERE name = 'EMSIST_ENTERPRISE'), 'webhooks', 'Webhooks', 'Webhook notifications', FALSE),
((SELECT id FROM license_products WHERE name = 'EMSIST_ENTERPRISE'), 'ai_persona', 'AI Persona', 'AI-powered persona features', FALSE),
((SELECT id FROM license_products WHERE name = 'EMSIST_ENTERPRISE'), 'custom_branding', 'Custom Branding', 'White-label customization', FALSE),
((SELECT id FROM license_products WHERE name = 'EMSIST_ENTERPRISE'), 'sso_integration', 'SSO Integration', 'SAML/OIDC single sign-on', FALSE),
((SELECT id FROM license_products WHERE name = 'EMSIST_ENTERPRISE'), 'audit_logs', 'Audit Logs', 'Full audit trail access', FALSE),
((SELECT id FROM license_products WHERE name = 'EMSIST_ENTERPRISE'), 'priority_support', 'Priority Support', '24/7 priority support', FALSE)
ON CONFLICT (product_id, feature_key) DO NOTHING;
