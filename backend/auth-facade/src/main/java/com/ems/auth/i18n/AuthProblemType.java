package com.ems.auth.i18n;

import org.springframework.http.HttpStatus;

import java.util.Locale;
import java.util.Map;

/**
 * Local fallback catalog for auth-facing problem details.
 *
 * The database-backed message registry remains authoritative. These entries are
 * only used when the registry is unavailable or a code has not been seeded yet.
 */
public enum AuthProblemType {
    INVALID_MFA_CODE(
        "AUTH-E-001",
        "invalid_mfa_code",
        HttpStatus.UNAUTHORIZED,
        "Invalid verification code",
        "Enter a valid MFA verification code and try again.",
        "رمز التحقق غير صالح",
        "أدخل رمز تحقق متعدد العوامل صالحًا ثم أعد المحاولة."
    ),
    MFA_SESSION_EXPIRED(
        "AUTH-E-002",
        "mfa_session_expired",
        HttpStatus.UNAUTHORIZED,
        "Verification session expired",
        "Start the sign-in process again and complete MFA verification.",
        "انتهت جلسة التحقق",
        "ابدأ عملية تسجيل الدخول مرة أخرى وأكمل التحقق متعدد العوامل."
    ),
    INVALID_TOKEN(
        "AUTH-E-003",
        "invalid_token",
        HttpStatus.UNAUTHORIZED,
        "Invalid or expired token",
        "The provided token is invalid or has expired.",
        "الرمز غير صالح أو منتهي الصلاحية",
        "الرمز المقدم غير صالح أو انتهت صلاحيته."
    ),
    NOT_AUTHENTICATED(
        "AUTH-E-006",
        "not_authenticated",
        HttpStatus.UNAUTHORIZED,
        "Authentication required",
        "Sign in and try again.",
        "المصادقة مطلوبة",
        "سجل الدخول ثم أعد المحاولة."
    ),
    ACCESS_DENIED(
        "AUTH-E-020",
        "access_denied",
        HttpStatus.FORBIDDEN,
        "Access denied",
        "You do not have permission to perform this action.",
        "تم رفض الوصول",
        "ليست لديك صلاحية لتنفيذ هذا الإجراء."
    ),
    MFA_REQUIRED(
        "AUTH-E-021",
        "mfa_required",
        HttpStatus.FORBIDDEN,
        "More verification required",
        "Complete MFA verification to continue.",
        "يلزم تحقق إضافي",
        "أكمل التحقق متعدد العوامل للمتابعة."
    ),
    RATE_LIMIT_EXCEEDED(
        "AUTH-E-022",
        "rate_limit_exceeded",
        HttpStatus.TOO_MANY_REQUESTS,
        "Too many attempts",
        "Try again in {retryAfterSeconds} seconds. If the problem continues, contact your administrator with code {code}.",
        "محاولات كثيرة جدًا",
        "أعد المحاولة بعد {retryAfterSeconds} ثانية. إذا استمرت المشكلة، فاتصل بالمسؤول مع الرمز {code}."
    ),
    TENANT_NOT_FOUND(
        "AUTH-E-023",
        "tenant_not_found",
        HttpStatus.NOT_FOUND,
        "Tenant not found",
        "Check the tenant ID and try again.",
        "المستأجر غير موجود",
        "تحقق من معرف المستأجر ثم أعد المحاولة."
    ),
    INVALID_OPERATION(
        "AUTH-E-027",
        "invalid_operation",
        HttpStatus.BAD_REQUEST,
        "Invalid request",
        "The requested operation is not allowed.",
        "طلب غير صالح",
        "العملية المطلوبة غير مسموح بها."
    ),
    INVALID_CREDENTIALS(
        "AUTH-E-028",
        "invalid_credentials",
        HttpStatus.UNAUTHORIZED,
        "Invalid credentials",
        "Check your email or username and password, then try again.",
        "بيانات الاعتماد غير صحيحة",
        "تحقق من البريد الإلكتروني أو اسم المستخدم وكلمة المرور ثم أعد المحاولة."
    ),
    ACCOUNT_LOCKED(
        "AUTH-E-029",
        "account_locked",
        HttpStatus.FORBIDDEN,
        "Account locked",
        "Your account is locked. Contact your administrator with code {code}.",
        "تم قفل الحساب",
        "تم قفل حسابك. اتصل بالمسؤول مع الرمز {code}."
    ),
    NO_ACTIVE_SEAT(
        "AUTH-E-030",
        "no_active_seat",
        HttpStatus.FORBIDDEN,
        "No active license seat",
        "Your account does not currently have an active license seat for this tenant. Contact your administrator with code {code}.",
        "لا توجد رخصة نشطة",
        "لا يملك حسابك حاليًا مقعد ترخيص نشطًا لهذا المستأجر. اتصل بالمسؤول مع الرمز {code}."
    ),
    MISSING_HEADER(
        "AUTH-C-002",
        "missing_header",
        HttpStatus.BAD_REQUEST,
        "Missing required header",
        "Required header '{header}' is missing.",
        "رأس مطلوب مفقود",
        "الرأس المطلوب '{header}' مفقود."
    ),
    VALIDATION_ERROR(
        "AUTH-C-003",
        "validation_error",
        HttpStatus.BAD_REQUEST,
        "Validation failed",
        "Review the request fields and try again.",
        "فشل التحقق",
        "راجع حقول الطلب ثم أعد المحاولة."
    ),
    INTERNAL_ERROR(
        "AUTH-E-500",
        "internal_error",
        HttpStatus.INTERNAL_SERVER_ERROR,
        "Authentication request failed",
        "Try again in a few minutes. If the problem continues, contact your administrator with code {code}.",
        "فشل طلب المصادقة",
        "أعد المحاولة بعد بضع دقائق. إذا استمرت المشكلة، فاتصل بالمسؤول مع الرمز {code}."
    ),
    PROVIDER_UNAVAILABLE(
        "AUTH-E-503",
        "auth_provider_unavailable",
        HttpStatus.SERVICE_UNAVAILABLE,
        "Authentication service unavailable",
        "Try again in a few minutes. If the problem continues, contact your administrator with code {code}.",
        "خدمة المصادقة غير متاحة",
        "أعد المحاولة بعد بضع دقائق. إذا استمرت المشكلة، فاتصل بالمسؤول مع الرمز {code}."
    ),
    LICENSE_SERVICE_UNAVAILABLE(
        "AUTH-E-504",
        "license_service_unavailable",
        HttpStatus.SERVICE_UNAVAILABLE,
        "License service unavailable",
        "Try again in a few minutes. If the problem continues, contact your administrator with code {code}.",
        "خدمة التراخيص غير متاحة",
        "أعد المحاولة بعد بضع دقائق. إذا استمرت المشكلة، فاتصل بالمسؤول مع الرمز {code}."
    );

    private final String code;
    private final String legacyError;
    private final HttpStatus httpStatus;
    private final String defaultTitle;
    private final String defaultDetail;
    private final String arabicTitle;
    private final String arabicDetail;

    AuthProblemType(
        String code,
        String legacyError,
        HttpStatus httpStatus,
        String defaultTitle,
        String defaultDetail,
        String arabicTitle,
        String arabicDetail
    ) {
        this.code = code;
        this.legacyError = legacyError;
        this.httpStatus = httpStatus;
        this.defaultTitle = defaultTitle;
        this.defaultDetail = defaultDetail;
        this.arabicTitle = arabicTitle;
        this.arabicDetail = arabicDetail;
    }

    public String code() {
        return code;
    }

    public String legacyError() {
        return legacyError;
    }

    public HttpStatus httpStatus() {
        return httpStatus;
    }

    public String fallbackTitle(Locale locale) {
        return isArabic(locale) ? arabicTitle : defaultTitle;
    }

    public String fallbackDetail(Locale locale, Map<String, ?> arguments) {
        String template = isArabic(locale) ? arabicDetail : defaultDetail;
        return applyArguments(template, arguments);
    }

    private boolean isArabic(Locale locale) {
        return locale != null && "ar".equalsIgnoreCase(locale.getLanguage());
    }

    private String applyArguments(String template, Map<String, ?> arguments) {
        if (arguments == null || arguments.isEmpty()) {
            return template;
        }

        String resolved = template;
        for (Map.Entry<String, ?> entry : arguments.entrySet()) {
            resolved = resolved.replace("{" + entry.getKey() + "}", String.valueOf(entry.getValue()));
        }
        return resolved;
    }
}
