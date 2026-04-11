import { inject, Injectable, signal } from '@angular/core';
import { catchError, firstValueFrom, of } from 'rxjs';
import { ApiGatewayService } from '../api/api-gateway.service';
import { AuthUiMessage } from '../api/models';

export const AUTH_UI_MESSAGE_CODES = [
  'AUTH-I-031',
  'AUTH-I-032',
  'AUTH-I-033',
  'AUTH-C-004',
  'AUTH-C-005',
  'AUTH-C-006',
  'AUTH-E-031',
  'AUTH-E-032',
  'AUTH-E-033',
  'AUTH-L-001',
  'AUTH-L-002',
  'AUTH-L-003',
  'AUTH-L-004',
  'AUTH-L-005',
  'AUTH-L-006',
  'AUTH-L-007',
  'AUTH-L-008',
  'AUTH-L-009',
  'AUTH-L-010',
  'AUTH-L-011',
  'AUTH-L-012',
  'AUTH-L-013',
  'AUTH-L-014',
  'AUTH-L-015',
  'AUTH-L-016',
] as const;

export type AuthUiMessageCode = (typeof AUTH_UI_MESSAGE_CODES)[number];

interface LocalizedFallback {
  readonly en: string;
  readonly ar: string;
}

const AUTH_UI_FALLBACKS: Record<AuthUiMessageCode, LocalizedFallback> = {
  'AUTH-I-031': {
    en: 'You have been signed out successfully.',
    ar: 'تم تسجيل خروجك بنجاح.',
  },
  'AUTH-I-032': {
    en: 'Your session expired. Please sign in again.',
    ar: 'انتهت جلستك. يرجى تسجيل الدخول مرة أخرى.',
  },
  'AUTH-I-033': {
    en: 'Code',
    ar: 'الرمز',
  },
  'AUTH-C-004': {
    en: 'Email or username and password are required.',
    ar: 'البريد الإلكتروني أو اسم المستخدم وكلمة المرور مطلوبة.',
  },
  'AUTH-C-005': {
    en: 'Tenant ID is required.',
    ar: 'معرف المستأجر مطلوب.',
  },
  'AUTH-C-006': {
    en: 'Tenant ID must be a UUID or a recognized tenant alias.',
    ar: 'يجب أن يكون معرف المستأجر UUID أو اسمًا مستعارًا معروفًا للمستأجر.',
  },
  'AUTH-E-031': {
    en: 'Login failed. Please verify your credentials.',
    ar: 'فشل تسجيل الدخول. يرجى التحقق من بيانات الاعتماد الخاصة بك.',
  },
  'AUTH-E-032': {
    en: 'Unable to reach the server. Check your connection and try again.',
    ar: 'تعذر الوصول إلى الخادم. تحقق من الاتصال ثم أعد المحاولة.',
  },
  'AUTH-E-033': {
    en: 'Login request failed.',
    ar: 'فشل طلب تسجيل الدخول.',
  },
  'AUTH-L-001': {
    en: 'Welcome to {tenantName}',
    ar: 'مرحبًا بك في {tenantName}',
  },
  'AUTH-L-002': {
    en: 'Empower. Transform. Succeed.',
    ar: 'تمكين. تحويل. نجاح.',
  },
  'AUTH-L-003': {
    en: 'Sign in with Email',
    ar: 'تسجيل الدخول بالبريد الإلكتروني',
  },
  'AUTH-L-004': {
    en: 'Having trouble signing in?',
    ar: 'هل تواجه مشكلة في تسجيل الدخول؟',
  },
  'AUTH-L-005': {
    en: 'Contact support',
    ar: 'تواصل مع الدعم',
  },
  'AUTH-L-006': {
    en: 'Email or Username',
    ar: 'البريد الإلكتروني أو اسم المستخدم',
  },
  'AUTH-L-007': {
    en: 'Enter your username',
    ar: 'أدخل اسم المستخدم',
  },
  'AUTH-L-008': {
    en: 'Password',
    ar: 'كلمة المرور',
  },
  'AUTH-L-009': {
    en: 'Enter your password',
    ar: 'أدخل كلمة المرور',
  },
  'AUTH-L-010': {
    en: 'Show password',
    ar: 'إظهار كلمة المرور',
  },
  'AUTH-L-011': {
    en: 'Hide password',
    ar: 'إخفاء كلمة المرور',
  },
  'AUTH-L-012': {
    en: 'Tenant ID',
    ar: 'معرف المستأجر',
  },
  'AUTH-L-013': {
    en: 'Enter tenant ID',
    ar: 'أدخل معرف المستأجر',
  },
  'AUTH-L-014': {
    en: 'Sign In',
    ar: 'تسجيل الدخول',
  },
  'AUTH-L-015': {
    en: 'Signing in...',
    ar: 'جارٍ تسجيل الدخول...',
  },
  'AUTH-L-016': {
    en: 'Back',
    ar: 'رجوع',
  },
};

@Injectable({
  providedIn: 'root',
})
export class AuthUiTextService {
  private readonly api = inject(ApiGatewayService);
  private readonly textsState = signal<Partial<Record<AuthUiMessageCode, string>>>({});
  private preloadPromise: Promise<void> | null = null;

  readonly texts = this.textsState.asReadonly();

  preload(): Promise<void> {
    if (this.preloadPromise) {
      return this.preloadPromise;
    }

    this.preloadPromise = firstValueFrom(
      this.api
        .getAuthMessages(AUTH_UI_MESSAGE_CODES)
        .pipe(catchError(() => of([] as AuthUiMessage[]))),
    ).then((messages) => {
      const nextTexts: Partial<Record<AuthUiMessageCode, string>> = {};
      for (const message of messages) {
        if (isAuthUiMessageCode(message.code) && message.text.trim()) {
          nextTexts[message.code] = message.text.trim();
        }
      }
      this.textsState.set(nextTexts);
    });

    return this.preloadPromise;
  }

  text(code: AuthUiMessageCode): string {
    return this.textsState()[code] ?? pickFallbackText(code, resolvePreferredLanguage());
  }
}

function isAuthUiMessageCode(code: string): code is AuthUiMessageCode {
  return (AUTH_UI_MESSAGE_CODES as readonly string[]).includes(code);
}

function pickFallbackText(code: AuthUiMessageCode, language: string): string {
  return language === 'ar' ? AUTH_UI_FALLBACKS[code].ar : AUTH_UI_FALLBACKS[code].en;
}

function resolvePreferredLanguage(
  navigatorLike: Pick<Navigator, 'languages' | 'language'> | undefined = globalThis.navigator,
): string {
  const firstLanguage =
    navigatorLike?.languages?.find((value) => value.trim()) ?? navigatorLike?.language ?? 'en';
  return normalizeLanguage(firstLanguage);
}

function normalizeLanguage(value: string): string {
  return value.trim().split(/[-_]/)[0]?.toLowerCase() || 'en';
}
