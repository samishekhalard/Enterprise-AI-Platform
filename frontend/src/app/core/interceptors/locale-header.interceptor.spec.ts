import { resolveAcceptLanguageHeader } from './locale-header.interceptor';

describe('resolveAcceptLanguageHeader', () => {
  it('prefers the browser language list when available', () => {
    expect(
      resolveAcceptLanguageHeader({
        languages: ['ar-AE', 'en-US'],
        language: 'en-US',
      }),
    ).toBe('ar-AE, en-US');
  });

  it('falls back to navigator.language when languages is empty', () => {
    expect(
      resolveAcceptLanguageHeader({
        languages: [],
        language: 'en-US',
      }),
    ).toBe('en-US');
  });

  it('returns null when the browser locale is unavailable', () => {
    expect(
      resolveAcceptLanguageHeader({
        languages: [],
        language: '',
      }),
    ).toBeNull();
  });
});
