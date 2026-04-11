-- ============================================================================
-- EMS Tenant Service - Auth UI Message Catalog
-- Version: 13
-- Description: Seeds localized auth UI copy used by the public login flow.
-- ============================================================================

INSERT INTO message_registry (code, type, category, http_status, default_title, default_detail)
VALUES
    ('AUTH-I-031', 'I', 'AUTH', NULL, 'You have been signed out successfully.', NULL),
    ('AUTH-I-032', 'I', 'AUTH', NULL, 'Your session expired. Please sign in again.', NULL),
    ('AUTH-I-033', 'I', 'AUTH', NULL, 'Code', NULL),
    ('AUTH-C-004', 'C', 'AUTH', NULL, 'Email or username and password are required.', NULL),
    ('AUTH-C-005', 'C', 'AUTH', NULL, 'Tenant ID is required.', NULL),
    ('AUTH-C-006', 'C', 'AUTH', NULL, 'Tenant ID must be a UUID or a recognized tenant alias.', NULL),
    ('AUTH-E-031', 'E', 'AUTH', NULL, 'Login failed. Please verify your credentials.', NULL),
    ('AUTH-E-032', 'E', 'AUTH', NULL, 'Unable to reach the server. Check your connection and try again.', NULL),
    ('AUTH-E-033', 'E', 'AUTH', NULL, 'Login request failed.', NULL)
ON CONFLICT (code) DO NOTHING;

INSERT INTO message_translation (code, locale_code, title, detail)
VALUES
    ('AUTH-I-031', 'ar', 'تم تسجيل خروجك بنجاح.', NULL),
    ('AUTH-I-032', 'ar', 'انتهت جلستك. يرجى تسجيل الدخول مرة أخرى.', NULL),
    ('AUTH-I-033', 'ar', 'الرمز', NULL),
    ('AUTH-C-004', 'ar', 'البريد الإلكتروني أو اسم المستخدم وكلمة المرور مطلوبة.', NULL),
    ('AUTH-C-005', 'ar', 'معرف المستأجر مطلوب.', NULL),
    ('AUTH-C-006', 'ar', 'يجب أن يكون معرف المستأجر UUID أو اسمًا مستعارًا معروفًا للمستأجر.', NULL),
    ('AUTH-E-031', 'ar', 'فشل تسجيل الدخول. يرجى التحقق من بيانات الاعتماد الخاصة بك.', NULL),
    ('AUTH-E-032', 'ar', 'تعذر الوصول إلى الخادم. تحقق من الاتصال ثم أعد المحاولة.', NULL),
    ('AUTH-E-033', 'ar', 'فشل طلب تسجيل الدخول.', NULL)
ON CONFLICT (code, locale_code) DO NOTHING;
