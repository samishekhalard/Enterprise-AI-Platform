-- ============================================================================
-- EMS Tenant Service - Tenant-Specific Message Overrides and Auth Problem Seeds
-- Version: 12
-- Description: Adds tenant-scoped message translation overrides and seeds the
--              auth-facade problem-detail catalog defaults.
-- ============================================================================

CREATE TABLE IF NOT EXISTS tenant_message_translation (
    tenant_uuid   UUID NOT NULL REFERENCES tenants(uuid) ON DELETE CASCADE,
    code          VARCHAR(20) NOT NULL REFERENCES message_registry(code) ON DELETE CASCADE,
    locale_code   VARCHAR(10) NOT NULL,
    title         VARCHAR(255) NOT NULL,
    detail        TEXT,
    created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    PRIMARY KEY (tenant_uuid, code, locale_code)
);

DROP TRIGGER IF EXISTS update_tenant_message_translation_updated_at ON tenant_message_translation;
CREATE TRIGGER update_tenant_message_translation_updated_at
    BEFORE UPDATE ON tenant_message_translation
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_tenant_message_translation_lookup
    ON tenant_message_translation(tenant_uuid, code, locale_code);

COMMENT ON TABLE tenant_message_translation IS
    'Tenant-specific message translation overrides. Falls back to global message_translation and then message_registry defaults.';

INSERT INTO message_registry (code, type, category, http_status, default_title, default_detail)
VALUES
    ('AUTH-E-001', 'E', 'AUTH', 401, 'Invalid verification code', 'Enter a valid MFA verification code and try again.'),
    ('AUTH-E-002', 'E', 'AUTH', 401, 'Verification session expired', 'Start the sign-in process again and complete MFA verification.'),
    ('AUTH-E-003', 'E', 'AUTH', 401, 'Invalid or expired token', 'The provided token is invalid or has expired.'),
    ('AUTH-E-006', 'E', 'AUTH', 401, 'Authentication required', 'Sign in and try again.'),
    ('AUTH-E-020', 'E', 'AUTH', 403, 'Access denied', 'You do not have permission to perform this action.'),
    ('AUTH-E-021', 'E', 'AUTH', 403, 'More verification required', 'Complete MFA verification to continue.'),
    ('AUTH-E-022', 'E', 'AUTH', 429, 'Too many attempts', 'Try again in {retryAfterSeconds} seconds. If the problem continues, contact your administrator with code {code}.'),
    ('AUTH-E-023', 'E', 'AUTH', 404, 'Tenant not found', 'Check the tenant ID and try again.'),
    ('AUTH-E-027', 'E', 'AUTH', 400, 'Invalid request', 'The requested operation is not allowed.'),
    ('AUTH-E-028', 'E', 'AUTH', 401, 'Invalid credentials', 'Check your email or username and password, then try again.'),
    ('AUTH-E-029', 'E', 'AUTH', 403, 'Account locked', 'Your account is locked. Contact your administrator with code {code}.'),
    ('AUTH-E-030', 'E', 'AUTH', 403, 'No active license seat', 'Your account does not currently have an active license seat for this tenant. Contact your administrator with code {code}.'),
    ('AUTH-C-002', 'C', 'AUTH', 400, 'Missing required header', 'Required header ''{header}'' is missing.'),
    ('AUTH-C-003', 'C', 'AUTH', 400, 'Validation failed', 'Review the request fields and try again.'),
    ('AUTH-E-500', 'E', 'AUTH', 500, 'Authentication request failed', 'Try again in a few minutes. If the problem continues, contact your administrator with code {code}.'),
    ('AUTH-E-503', 'E', 'AUTH', 503, 'Authentication service unavailable', 'Try again in a few minutes. If the problem continues, contact your administrator with code {code}.'),
    ('AUTH-E-504', 'E', 'AUTH', 503, 'License service unavailable', 'Try again in a few minutes. If the problem continues, contact your administrator with code {code}.')
ON CONFLICT (code) DO NOTHING;

INSERT INTO message_translation (code, locale_code, title, detail)
VALUES
    ('AUTH-E-001', 'ar', 'رمز التحقق غير صالح', 'أدخل رمز تحقق متعدد العوامل صالحًا ثم أعد المحاولة.'),
    ('AUTH-E-002', 'ar', 'انتهت جلسة التحقق', 'ابدأ عملية تسجيل الدخول مرة أخرى وأكمل التحقق متعدد العوامل.'),
    ('AUTH-E-003', 'ar', 'الرمز غير صالح أو منتهي الصلاحية', 'الرمز المقدم غير صالح أو انتهت صلاحيته.'),
    ('AUTH-E-006', 'ar', 'المصادقة مطلوبة', 'سجل الدخول ثم أعد المحاولة.'),
    ('AUTH-E-020', 'ar', 'تم رفض الوصول', 'ليست لديك صلاحية لتنفيذ هذا الإجراء.'),
    ('AUTH-E-021', 'ar', 'يلزم تحقق إضافي', 'أكمل التحقق متعدد العوامل للمتابعة.'),
    ('AUTH-E-022', 'ar', 'محاولات كثيرة جدًا', 'أعد المحاولة بعد {retryAfterSeconds} ثانية. إذا استمرت المشكلة، فاتصل بالمسؤول مع الرمز {code}.'),
    ('AUTH-E-023', 'ar', 'المستأجر غير موجود', 'تحقق من معرف المستأجر ثم أعد المحاولة.'),
    ('AUTH-E-027', 'ar', 'طلب غير صالح', 'العملية المطلوبة غير مسموح بها.'),
    ('AUTH-E-028', 'ar', 'بيانات الاعتماد غير صحيحة', 'تحقق من البريد الإلكتروني أو اسم المستخدم وكلمة المرور ثم أعد المحاولة.'),
    ('AUTH-E-029', 'ar', 'تم قفل الحساب', 'تم قفل حسابك. اتصل بالمسؤول مع الرمز {code}.'),
    ('AUTH-E-030', 'ar', 'لا توجد رخصة نشطة', 'لا يملك حسابك حاليًا مقعد ترخيص نشطًا لهذا المستأجر. اتصل بالمسؤول مع الرمز {code}.'),
    ('AUTH-C-002', 'ar', 'رأس مطلوب مفقود', 'الرأس المطلوب ''{header}'' مفقود.'),
    ('AUTH-C-003', 'ar', 'فشل التحقق', 'راجع حقول الطلب ثم أعد المحاولة.'),
    ('AUTH-E-500', 'ar', 'فشل طلب المصادقة', 'أعد المحاولة بعد بضع دقائق. إذا استمرت المشكلة، فاتصل بالمسؤول مع الرمز {code}.'),
    ('AUTH-E-503', 'ar', 'خدمة المصادقة غير متاحة', 'أعد المحاولة بعد بضع دقائق. إذا استمرت المشكلة، فاتصل بالمسؤول مع الرمز {code}.'),
    ('AUTH-E-504', 'ar', 'خدمة التراخيص غير متاحة', 'أعد المحاولة بعد بضع دقائق. إذا استمرت المشكلة، فاتصل بالمسؤول مع الرمز {code}.')
ON CONFLICT (code, locale_code) DO NOTHING;
