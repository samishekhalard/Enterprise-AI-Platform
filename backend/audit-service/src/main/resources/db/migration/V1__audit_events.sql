-- ============================================================================
-- AUDIT EVENTS
-- ============================================================================

-- Drop legacy tables if they exist
DROP TABLE IF EXISTS audit_events CASCADE;

-- Audit Events table
CREATE TABLE audit_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Context
    tenant_id       VARCHAR(50) NOT NULL,
    user_id         UUID,
    username        VARCHAR(255),
    session_id      VARCHAR(100),

    -- Event Details
    event_type      VARCHAR(50) NOT NULL,
    event_category  VARCHAR(50),
    severity        VARCHAR(20) DEFAULT 'INFO',
    message         TEXT,

    -- Resource being acted upon
    resource_type   VARCHAR(100),
    resource_id     VARCHAR(255),
    resource_name   VARCHAR(255),

    -- Action details
    action          VARCHAR(20),
    outcome         VARCHAR(20) DEFAULT 'SUCCESS',
    failure_reason  TEXT,

    -- Change tracking
    old_values      JSONB,
    new_values      JSONB,

    -- Request metadata
    ip_address      VARCHAR(45),
    user_agent      VARCHAR(500),
    request_id      VARCHAR(100),
    correlation_id  VARCHAR(100),

    -- Source service
    service_name    VARCHAR(100),
    service_version VARCHAR(50),

    -- Additional context
    metadata        JSONB,

    -- Timestamp
    timestamp       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Retention
    expires_at      TIMESTAMPTZ
);

-- Indexes for common queries
CREATE INDEX idx_audit_tenant ON audit_events(tenant_id);
CREATE INDEX idx_audit_user ON audit_events(user_id);
CREATE INDEX idx_audit_event_type ON audit_events(event_type);
CREATE INDEX idx_audit_resource ON audit_events(resource_type, resource_id);
CREATE INDEX idx_audit_timestamp ON audit_events(timestamp DESC);
CREATE INDEX idx_audit_service ON audit_events(service_name);
CREATE INDEX idx_audit_correlation ON audit_events(correlation_id);
CREATE INDEX idx_audit_expires ON audit_events(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_audit_outcome ON audit_events(outcome);
CREATE INDEX idx_audit_severity ON audit_events(severity);

-- Composite indexes for common search patterns
CREATE INDEX idx_audit_tenant_timestamp ON audit_events(tenant_id, timestamp DESC);
CREATE INDEX idx_audit_tenant_type ON audit_events(tenant_id, event_type);
CREATE INDEX idx_audit_tenant_user ON audit_events(tenant_id, user_id);

-- ============================================================================
-- COMMON EVENT TYPES REFERENCE (not enforced, for documentation)
-- ============================================================================
-- Authentication:
--   LOGIN_SUCCESS, LOGIN_FAILURE, LOGOUT, PASSWORD_CHANGE, MFA_ENABLED, MFA_DISABLED
--   SESSION_CREATED, SESSION_EXPIRED, SESSION_REVOKED
--
-- User Management:
--   USER_CREATED, USER_UPDATED, USER_DELETED, USER_SUSPENDED, USER_ACTIVATED
--   ROLE_ASSIGNED, ROLE_REVOKED, PERMISSION_GRANTED, PERMISSION_REVOKED
--
-- License Management:
--   LICENSE_ASSIGNED, LICENSE_REVOKED, LICENSE_EXPIRED, FEATURE_ACCESSED
--
-- Data Operations:
--   RECORD_CREATED, RECORD_UPDATED, RECORD_DELETED, RECORD_VIEWED
--   EXPORT_INITIATED, IMPORT_COMPLETED
--
-- Security:
--   ACCESS_DENIED, SUSPICIOUS_ACTIVITY, IP_BLOCKED, RATE_LIMIT_EXCEEDED
--
-- System:
--   SERVICE_STARTED, SERVICE_STOPPED, CONFIG_CHANGED, MIGRATION_COMPLETED
