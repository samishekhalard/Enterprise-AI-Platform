-- ============================================================================
-- USER PROFILE MANAGEMENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_profiles (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keycloak_id           UUID NOT NULL UNIQUE,
    tenant_id             VARCHAR(50) NOT NULL,

    -- Identity (synced from Keycloak)
    email                 VARCHAR(255) NOT NULL,
    email_verified        BOOLEAN DEFAULT FALSE,
    first_name            VARCHAR(100),
    last_name             VARCHAR(100),

    -- Extended Profile (our data)
    display_name          VARCHAR(255),
    job_title             VARCHAR(100),
    department            VARCHAR(100),
    phone                 VARCHAR(50),
    mobile                VARCHAR(50),
    office_location       VARCHAR(255),
    employee_id           VARCHAR(50),
    employee_type         VARCHAR(50) DEFAULT 'FULL_TIME',
    manager_id            UUID REFERENCES user_profiles(id),
    avatar_url            VARCHAR(500),
    timezone              VARCHAR(50) DEFAULT 'UTC',
    locale                VARCHAR(10) DEFAULT 'en',

    -- Security info
    mfa_enabled           BOOLEAN DEFAULT FALSE,
    mfa_methods           JSONB DEFAULT '[]',
    password_last_changed TIMESTAMPTZ,
    password_expires_at   TIMESTAMPTZ,
    account_locked        BOOLEAN DEFAULT FALSE,
    lockout_end           TIMESTAMPTZ,
    failed_login_attempts INTEGER DEFAULT 0,
    last_login_at         TIMESTAMPTZ,
    last_login_ip         VARCHAR(45),

    -- Status
    status                VARCHAR(20) DEFAULT 'ACTIVE',

    -- Timestamps
    created_at            TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_user_email_tenant UNIQUE (email, tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_tenant ON user_profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_manager ON user_profiles(manager_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_keycloak ON user_profiles(keycloak_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON user_profiles(status);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
