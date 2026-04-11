package com.ems.auth.i18n;

import java.util.Arrays;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

public enum AuthUiMessageType {
    SIGNED_OUT_SUCCESS("AUTH-I-031", "You have been signed out successfully.", "تم تسجيل خروجك بنجاح."),
    SESSION_EXPIRED("AUTH-I-032", "Your session expired. Please sign in again.", "انتهت جلستك. يرجى تسجيل الدخول مرة أخرى."),
    CODE_LABEL("AUTH-I-033", "Code", "الرمز"),
    CREDENTIALS_REQUIRED(
        "AUTH-C-004",
        "Email or username and password are required.",
        "البريد الإلكتروني أو اسم المستخدم وكلمة المرور مطلوبة."
    ),
    TENANT_ID_REQUIRED("AUTH-C-005", "Tenant ID is required.", "معرف المستأجر مطلوب."),
    TENANT_ID_INVALID(
        "AUTH-C-006",
        "Tenant ID must be a UUID or a recognized tenant alias.",
        "يجب أن يكون معرف المستأجر UUID أو اسمًا مستعارًا معروفًا للمستأجر."
    ),
    LOGIN_FAILED(
        "AUTH-E-031",
        "Login failed. Please verify your credentials.",
        "فشل تسجيل الدخول. يرجى التحقق من بيانات الاعتماد الخاصة بك."
    ),
    NETWORK_UNREACHABLE(
        "AUTH-E-032",
        "Unable to reach the server. Check your connection and try again.",
        "تعذر الوصول إلى الخادم. تحقق من الاتصال ثم أعد المحاولة."
    ),
    LOGIN_REQUEST_FAILED(
        "AUTH-E-033",
        "Login request failed.",
        "فشل طلب تسجيل الدخول."
    ),

    // ── Login page labels (AUTH-L-*) ──────────────────────────────────
    WELCOME_TITLE("AUTH-L-001", "Welcome to {tenantName}", "مرحبًا بك في {tenantName}"),
    TAGLINE("AUTH-L-002", "Empower. Transform. Succeed.", "تمكين. تحويل. نجاح."),
    SIGN_IN_WITH_EMAIL("AUTH-L-003", "Sign in with Email", "تسجيل الدخول بالبريد الإلكتروني"),
    TROUBLE_SIGNING_IN("AUTH-L-004", "Having trouble signing in?", "هل تواجه مشكلة في تسجيل الدخول؟"),
    CONTACT_SUPPORT("AUTH-L-005", "Contact support", "تواصل مع الدعم"),
    EMAIL_OR_USERNAME_LABEL("AUTH-L-006", "Email or Username", "البريد الإلكتروني أو اسم المستخدم"),
    USERNAME_PLACEHOLDER("AUTH-L-007", "Enter your username", "أدخل اسم المستخدم"),
    PASSWORD_LABEL("AUTH-L-008", "Password", "كلمة المرور"),
    PASSWORD_PLACEHOLDER("AUTH-L-009", "Enter your password", "أدخل كلمة المرور"),
    SHOW_PASSWORD("AUTH-L-010", "Show password", "إظهار كلمة المرور"),
    HIDE_PASSWORD("AUTH-L-011", "Hide password", "إخفاء كلمة المرور"),
    TENANT_ID_LABEL("AUTH-L-012", "Tenant ID", "معرف المستأجر"),
    TENANT_ID_PLACEHOLDER("AUTH-L-013", "Enter tenant ID", "أدخل معرف المستأجر"),
    SIGN_IN("AUTH-L-014", "Sign In", "تسجيل الدخول"),
    SIGNING_IN("AUTH-L-015", "Signing in...", "جارٍ تسجيل الدخول..."),
    BACK("AUTH-L-016", "Back", "رجوع");

    private static final Map<String, AuthUiMessageType> BY_CODE = Arrays.stream(values())
        .collect(Collectors.toUnmodifiableMap(AuthUiMessageType::code, Function.identity()));

    private final String code;
    private final String englishText;
    private final String arabicText;

    AuthUiMessageType(String code, String englishText, String arabicText) {
        this.code = code;
        this.englishText = englishText;
        this.arabicText = arabicText;
    }

    public String code() {
        return code;
    }

    public String fallbackText(Locale locale) {
        return locale != null && "ar".equalsIgnoreCase(locale.getLanguage()) ? arabicText : englishText;
    }

    public static Optional<AuthUiMessageType> fromCode(String code) {
        if (code == null || code.isBlank()) {
            return Optional.empty();
        }
        return Optional.ofNullable(BY_CODE.get(code.trim().toUpperCase(Locale.ROOT)));
    }
}
