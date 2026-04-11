-- ============================================================================
-- SESSION MANAGEMENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_sessions (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    tenant_id         VARCHAR(50) NOT NULL,
    device_id         UUID REFERENCES user_devices(id),

    -- Session Info
    session_token     VARCHAR(500) NOT NULL UNIQUE,
    refresh_token_id  VARCHAR(255),

    -- Location
    ip_address        VARCHAR(45),
    user_agent        TEXT,
    location          JSONB,

    -- Timestamps
    created_at        TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    last_activity     TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    expires_at        TIMESTAMPTZ NOT NULL,

    -- Flags
    is_remembered     BOOLEAN DEFAULT FALSE,
    mfa_verified      BOOLEAN DEFAULT FALSE,

    -- Status
    status            VARCHAR(20) DEFAULT 'ACTIVE',  -- ACTIVE, EXPIRED, REVOKED, LOGGED_OUT
    revoked_at        TIMESTAMPTZ,
    revoked_by        UUID REFERENCES user_profiles(id),
    revoke_reason     VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_tenant ON user_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON user_sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(session_token);

-- Scheduled job to expire old sessions (run this via pg_cron or application scheduler)
-- UPDATE user_sessions SET status = 'EXPIRED' WHERE expires_at < CURRENT_TIMESTAMP AND status = 'ACTIVE';
