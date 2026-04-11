-- ============================================================================
-- DEVICE MANAGEMENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_devices (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    tenant_id         VARCHAR(50) NOT NULL,

    -- Device Identity
    fingerprint       VARCHAR(255) NOT NULL,
    device_name       VARCHAR(255),
    device_type       VARCHAR(20),  -- BROWSER, MOBILE, DESKTOP, TABLET, API_CLIENT, UNKNOWN
    os_name           VARCHAR(100),
    os_version        VARCHAR(50),
    browser_name      VARCHAR(100),
    browser_version   VARCHAR(50),

    -- Trust & Approval
    trust_level       VARCHAR(20) DEFAULT 'UNKNOWN',  -- UNKNOWN, TRUSTED, BLOCKED
    is_approved       BOOLEAN DEFAULT FALSE,
    approved_by       UUID REFERENCES user_profiles(id),
    approved_at       TIMESTAMPTZ,

    -- Activity
    first_seen_at     TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    last_seen_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    last_ip_address   VARCHAR(45),
    last_location     JSONB,
    login_count       INTEGER DEFAULT 0,

    -- Timestamps
    created_at        TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_device_user_fingerprint UNIQUE (user_id, fingerprint)
);

CREATE INDEX IF NOT EXISTS idx_devices_user ON user_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_devices_tenant ON user_devices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_devices_fingerprint ON user_devices(fingerprint);
CREATE INDEX IF NOT EXISTS idx_devices_trust_level ON user_devices(trust_level);

DROP TRIGGER IF EXISTS update_user_devices_updated_at ON user_devices;
CREATE TRIGGER update_user_devices_updated_at
    BEFORE UPDATE ON user_devices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
