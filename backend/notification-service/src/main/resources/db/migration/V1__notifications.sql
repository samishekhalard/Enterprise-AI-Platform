-- ============================================================================
-- NOTIFICATION SERVICE
-- ============================================================================

-- Drop legacy tables if they exist
DROP TABLE IF EXISTS notification_preferences CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS notification_templates CASCADE;

-- ============================================================================
-- NOTIFICATION TEMPLATES
-- ============================================================================

CREATE TABLE notification_templates (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           VARCHAR(50),
    code                VARCHAR(100) NOT NULL,
    name                VARCHAR(100) NOT NULL,
    description         TEXT,
    type                VARCHAR(20) NOT NULL,
    category            VARCHAR(50) NOT NULL,
    subject_template    VARCHAR(500),
    body_template       TEXT NOT NULL,
    body_html_template  TEXT,
    variables           JSONB,
    is_active           BOOLEAN DEFAULT TRUE,
    is_system           BOOLEAN DEFAULT FALSE,
    locale              VARCHAR(10) DEFAULT 'en',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_template_code_type_tenant UNIQUE (tenant_id, code, type)
);

CREATE INDEX idx_template_tenant ON notification_templates(tenant_id);
CREATE INDEX idx_template_code ON notification_templates(code);
CREATE INDEX idx_template_type ON notification_templates(type);
CREATE INDEX idx_template_active ON notification_templates(is_active);

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================

CREATE TABLE notifications (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           VARCHAR(50) NOT NULL,
    user_id             UUID NOT NULL,
    type                VARCHAR(20) NOT NULL,
    category            VARCHAR(50) NOT NULL,
    subject             VARCHAR(500) NOT NULL,
    body                TEXT NOT NULL,
    body_html           TEXT,
    template_id         UUID REFERENCES notification_templates(id),
    template_data       JSONB,
    status              VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    recipient_address   VARCHAR(255),
    sent_at             TIMESTAMPTZ,
    delivered_at        TIMESTAMPTZ,
    read_at             TIMESTAMPTZ,
    failed_at           TIMESTAMPTZ,
    failure_reason      TEXT,
    retry_count         INTEGER DEFAULT 0,
    max_retries         INTEGER DEFAULT 3,
    priority            VARCHAR(10) DEFAULT 'NORMAL',
    scheduled_at        TIMESTAMPTZ,
    action_url          VARCHAR(500),
    action_label        VARCHAR(100),
    metadata            JSONB,
    correlation_id      VARCHAR(100),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at          TIMESTAMPTZ
);

CREATE INDEX idx_notification_tenant ON notifications(tenant_id);
CREATE INDEX idx_notification_user ON notifications(user_id);
CREATE INDEX idx_notification_status ON notifications(status);
CREATE INDEX idx_notification_type ON notifications(type);
CREATE INDEX idx_notification_created ON notifications(created_at DESC);
CREATE INDEX idx_notification_scheduled ON notifications(scheduled_at) WHERE scheduled_at IS NOT NULL;
CREATE INDEX idx_notification_expires ON notifications(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_notification_tenant_user ON notifications(tenant_id, user_id);
CREATE INDEX idx_notification_correlation ON notifications(correlation_id);

-- ============================================================================
-- NOTIFICATION PREFERENCES
-- ============================================================================

CREATE TABLE notification_preferences (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id                   VARCHAR(50) NOT NULL,
    user_id                     UUID NOT NULL,
    email_enabled               BOOLEAN DEFAULT TRUE,
    push_enabled                BOOLEAN DEFAULT TRUE,
    sms_enabled                 BOOLEAN DEFAULT FALSE,
    in_app_enabled              BOOLEAN DEFAULT TRUE,
    system_notifications        BOOLEAN DEFAULT TRUE,
    marketing_notifications     BOOLEAN DEFAULT FALSE,
    transactional_notifications BOOLEAN DEFAULT TRUE,
    alert_notifications         BOOLEAN DEFAULT TRUE,
    quiet_hours_enabled         BOOLEAN DEFAULT FALSE,
    quiet_hours_start           VARCHAR(5),
    quiet_hours_end             VARCHAR(5),
    timezone                    VARCHAR(50) DEFAULT 'UTC',
    digest_enabled              BOOLEAN DEFAULT FALSE,
    digest_frequency            VARCHAR(20) DEFAULT 'DAILY',
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_preference_tenant_user UNIQUE (tenant_id, user_id)
);

CREATE INDEX idx_pref_tenant_user ON notification_preferences(tenant_id, user_id);

-- ============================================================================
-- SEED DATA: System Templates
-- ============================================================================

INSERT INTO notification_templates (code, name, description, type, category, subject_template, body_template, body_html_template, variables, is_system, locale) VALUES
('WELCOME', 'Welcome Email', 'Sent to new users upon registration', 'EMAIL', 'SYSTEM',
 'Welcome to EMSIST, [[${firstName}]]!',
 'Hello [[${firstName}]],\n\nWelcome to EMSIST! Your account has been created successfully.\n\nBest regards,\nThe EMSIST Team',
 '<h1>Welcome to EMSIST!</h1><p>Hello [[${firstName}]],</p><p>Your account has been created successfully.</p><p>Best regards,<br>The EMSIST Team</p>',
 '["firstName", "email", "tenantName"]', TRUE, 'en'),

('PASSWORD_RESET', 'Password Reset', 'Password reset request notification', 'EMAIL', 'TRANSACTIONAL',
 'Reset Your EMSIST Password',
 'Hello [[${firstName}]],\n\nWe received a request to reset your password. Click the link below to reset it:\n\n[[${resetLink}]]\n\nThis link expires in [[${expiresIn}]] minutes.\n\nIf you did not request this, please ignore this email.',
 '<h1>Password Reset Request</h1><p>Hello [[${firstName}]],</p><p>Click the button below to reset your password:</p><p><a href="[[${resetLink}]]" style="background:#007bff;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">Reset Password</a></p><p>This link expires in [[${expiresIn}]] minutes.</p>',
 '["firstName", "resetLink", "expiresIn"]', TRUE, 'en'),

('EMAIL_VERIFICATION', 'Email Verification', 'Email address verification', 'EMAIL', 'TRANSACTIONAL',
 'Verify Your Email Address',
 'Hello [[${firstName}]],\n\nPlease verify your email address by clicking the link below:\n\n[[${verificationLink}]]\n\nThis link expires in [[${expiresIn}]] hours.',
 '<h1>Verify Your Email</h1><p>Hello [[${firstName}]],</p><p>Click the button below to verify your email:</p><p><a href="[[${verificationLink}]]" style="background:#28a745;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">Verify Email</a></p>',
 '["firstName", "verificationLink", "expiresIn"]', TRUE, 'en'),

('LOGIN_ALERT', 'New Login Alert', 'Alert for new login from unknown device', 'EMAIL', 'ALERT',
 'New Login to Your EMSIST Account',
 'Hello [[${firstName}]],\n\nA new login to your account was detected:\n\nDevice: [[${deviceInfo}]]\nLocation: [[${location}]]\nTime: [[${loginTime}]]\n\nIf this was not you, please secure your account immediately.',
 '<h1>New Login Detected</h1><p>Hello [[${firstName}]],</p><p>A new login was detected:</p><ul><li>Device: [[${deviceInfo}]]</li><li>Location: [[${location}]]</li><li>Time: [[${loginTime}]]</li></ul><p>If this was not you, please <a href="[[${secureAccountLink}]]">secure your account</a>.</p>',
 '["firstName", "deviceInfo", "location", "loginTime", "secureAccountLink"]', TRUE, 'en'),

('LICENSE_EXPIRING', 'License Expiration Warning', 'Warning about expiring license', 'EMAIL', 'ALERT',
 'Your EMSIST License is Expiring Soon',
 'Hello [[${firstName}]],\n\nYour [[${licenseName}]] license will expire on [[${expirationDate}]].\n\nRenew now to avoid service interruption.',
 '<h1>License Expiring Soon</h1><p>Hello [[${firstName}]],</p><p>Your <strong>[[${licenseName}]]</strong> license will expire on <strong>[[${expirationDate}]]</strong>.</p><p><a href="[[${renewLink}]]" style="background:#ffc107;color:black;padding:10px 20px;text-decoration:none;border-radius:5px;">Renew Now</a></p>',
 '["firstName", "licenseName", "expirationDate", "renewLink"]', TRUE, 'en')

ON CONFLICT (tenant_id, code, type) DO NOTHING;
