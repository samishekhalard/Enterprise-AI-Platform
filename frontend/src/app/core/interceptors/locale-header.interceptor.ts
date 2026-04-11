import { HttpInterceptorFn } from '@angular/common/http';

export const localeHeaderInterceptor: HttpInterceptorFn = (request, next) => {
  const requestTargetsApi = request.url.includes('/api/');
  const hasLocaleHeader = request.headers.has('Accept-Language');
  const acceptLanguage = resolveAcceptLanguageHeader();

  if (!requestTargetsApi || hasLocaleHeader || !acceptLanguage) {
    return next(request);
  }

  return next(
    request.clone({
      setHeaders: {
        'Accept-Language': acceptLanguage,
      },
    }),
  );
};

export function resolveAcceptLanguageHeader(
  navigatorLike: Pick<Navigator, 'languages' | 'language'> | undefined = globalThis.navigator,
): string | null {
  if (!navigatorLike) {
    return null;
  }

  const languages = navigatorLike.languages?.filter((language) => language.trim()) ?? [];
  if (languages.length > 0) {
    return languages.join(', ');
  }

  const fallbackLanguage = navigatorLike.language?.trim();
  return fallbackLanguage ? fallbackLanguage : null;
}
