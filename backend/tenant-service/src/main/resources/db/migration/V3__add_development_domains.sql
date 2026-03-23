-- ============================================================================
-- EMS Tenant Service - Additional Development Domains
-- Add common development hostnames for local testing
-- Note: Ports are stripped by the application, so only hostname is stored
-- ============================================================================

-- Add 127.0.0.1 as verified domain for master tenant
INSERT INTO tenant_domains (
    id, tenant_id, domain, is_primary, is_verified,
    verification_method, ssl_status, verified_at
) VALUES (
    'domain-master-2',
    'tenant-master',
    '127.0.0.1',
    FALSE,
    TRUE,
    'DNS_TXT',
    'ACTIVE',
    NOW()
) ON CONFLICT (domain) DO NOTHING;

-- Add subdomain pattern for think
INSERT INTO tenant_domains (
    id, tenant_id, domain, is_primary, is_verified,
    verification_method, ssl_status, verified_at
) VALUES (
    'domain-master-3',
    'tenant-master',
    'think.localhost',
    FALSE,
    TRUE,
    'DNS_TXT',
    'ACTIVE',
    NOW()
) ON CONFLICT (domain) DO NOTHING;
