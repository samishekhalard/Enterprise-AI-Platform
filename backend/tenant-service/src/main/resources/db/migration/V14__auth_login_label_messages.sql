-- ============================================================================
-- EMS Tenant Service - Auth Login Label Messages
-- Version: 14
-- Description: Seeds localized login-page label copy (AUTH-L-*) used by the
--              public login flow. Follows the same pattern as V13.
-- ============================================================================

INSERT INTO message_registry (code, type, category, http_status, default_title, default_detail)
VALUES
    ('AUTH-L-001', 'L', 'AUTH', NULL, 'Welcome to {tenantName}', NULL),
    ('AUTH-L-002', 'L', 'AUTH', NULL, 'Empower. Transform. Succeed.', NULL),
    ('AUTH-L-003', 'L', 'AUTH', NULL, 'Sign in with Email', NULL),
    ('AUTH-L-004', 'L', 'AUTH', NULL, 'Having trouble signing in?', NULL),
    ('AUTH-L-005', 'L', 'AUTH', NULL, 'Contact support', NULL),
    ('AUTH-L-006', 'L', 'AUTH', NULL, 'Email or Username', NULL),
    ('AUTH-L-007', 'L', 'AUTH', NULL, 'Enter your username', NULL),
    ('AUTH-L-008', 'L', 'AUTH', NULL, 'Password', NULL),
    ('AUTH-L-009', 'L', 'AUTH', NULL, 'Enter your password', NULL),
    ('AUTH-L-010', 'L', 'AUTH', NULL, 'Show password', NULL),
    ('AUTH-L-011', 'L', 'AUTH', NULL, 'Hide password', NULL),
    ('AUTH-L-012', 'L', 'AUTH', NULL, 'Tenant ID', NULL),
    ('AUTH-L-013', 'L', 'AUTH', NULL, 'Enter tenant ID', NULL),
    ('AUTH-L-014', 'L', 'AUTH', NULL, 'Sign In', NULL),
    ('AUTH-L-015', 'L', 'AUTH', NULL, 'Signing in...', NULL),
    ('AUTH-L-016', 'L', 'AUTH', NULL, 'Back', NULL)
ON CONFLICT (code) DO NOTHING;

INSERT INTO message_translation (code, locale_code, title, detail)
VALUES
    ('AUTH-L-001', 'ar', 'مرحبًا بك في {tenantName}', NULL),
    ('AUTH-L-002', 'ar', 'تمكين. تحويل. نجاح.', NULL),
    ('AUTH-L-003', 'ar', 'تسجيل الدخول بالبريد الإلكتروني', NULL),
    ('AUTH-L-004', 'ar', 'هل تواجه مشكلة في تسجيل الدخول؟', NULL),
    ('AUTH-L-005', 'ar', 'تواصل مع الدعم', NULL),
    ('AUTH-L-006', 'ar', 'البريد الإلكتروني أو اسم المستخدم', NULL),
    ('AUTH-L-007', 'ar', 'أدخل اسم المستخدم', NULL),
    ('AUTH-L-008', 'ar', 'كلمة المرور', NULL),
    ('AUTH-L-009', 'ar', 'أدخل كلمة المرور', NULL),
    ('AUTH-L-010', 'ar', 'إظهار كلمة المرور', NULL),
    ('AUTH-L-011', 'ar', 'إخفاء كلمة المرور', NULL),
    ('AUTH-L-012', 'ar', 'معرف المستأجر', NULL),
    ('AUTH-L-013', 'ar', 'أدخل معرف المستأجر', NULL),
    ('AUTH-L-014', 'ar', 'تسجيل الدخول', NULL),
    ('AUTH-L-015', 'ar', 'جارٍ تسجيل الدخول...', NULL),
    ('AUTH-L-016', 'ar', 'رجوع', NULL)
ON CONFLICT (code, locale_code) DO NOTHING;
