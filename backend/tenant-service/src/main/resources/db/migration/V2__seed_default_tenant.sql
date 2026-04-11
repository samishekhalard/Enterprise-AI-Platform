-- ============================================================================
-- EMS Tenant Service - Bootstrap Data
-- Master tenant and mandatory baseline configuration
-- ============================================================================

-- Insert default MASTER tenant
INSERT INTO tenants (
    id, uuid, full_name, short_name, slug, description,
    tenant_type, tier, status, keycloak_realm, created_by
) VALUES (
    'tenant-master',
    '68cd2a56-98c9-4ed4-8534-c299566d5b27',
    'Think Transformation Savvy',
    'Think',
    'think',
    'Master tenant for EMSIST platform',
    'MASTER',
    'ENTERPRISE',
    'ACTIVE',
    'realm-think',
    'system'
);

-- Insert default domain for master tenant
INSERT INTO tenant_domains (
    id, tenant_id, domain, is_primary, is_verified,
    verification_method, ssl_status, verified_at
) VALUES (
    'domain-master-1',
    'tenant-master',
    'localhost',
    TRUE,
    TRUE,
    'DNS_TXT',
    'ACTIVE',
    NOW()
);

-- Insert LOCAL auth provider for master tenant
INSERT INTO tenant_auth_providers (
    id, tenant_id, type, name, display_name, icon,
    is_enabled, is_primary, sort_order, config
) VALUES (
    'auth-master-local',
    'tenant-master',
    'LOCAL',
    'local',
    'Email & Password',
    'email',
    TRUE,
    TRUE,
    0,
    '{
        "passwordPolicy": {
            "minLength": 8,
            "requireUppercase": true,
            "requireLowercase": true,
            "requireNumber": true,
            "requireSpecialChar": false,
            "maxAge": 90
        },
        "lockout": {
            "maxAttempts": 5,
            "lockoutDuration": 30
        }
    }'::jsonb
);

-- Insert default branding for master tenant
INSERT INTO tenant_branding (
    tenant_id, primary_color, primary_color_dark, secondary_color,
    font_family
) VALUES (
    'tenant-master',
    '#1e3a5f',
    '#152a45',
    '#10b981',
    '''Inter'', sans-serif'
);

-- Insert default session config for master tenant
INSERT INTO tenant_session_config (
    tenant_id, access_token_lifetime, refresh_token_lifetime,
    idle_timeout, absolute_timeout, max_concurrent_sessions
) VALUES (
    'tenant-master',
    15,      -- 15 minutes access token
    10080,   -- 7 days refresh token
    30,      -- 30 minutes idle timeout
    480,     -- 8 hours absolute timeout
    5        -- max 5 concurrent sessions
);

-- Insert default MFA config for master tenant
INSERT INTO tenant_mfa_config (
    tenant_id, enabled, required, allowed_methods, default_method, grace_period_days
) VALUES (
    'tenant-master',
    TRUE,
    FALSE,
    ARRAY['totp', 'email'],
    'TOTP',
    7
);
