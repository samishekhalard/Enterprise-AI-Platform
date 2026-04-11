import { HttpErrorResponse } from '@angular/common/http';

import { formatProblemHttpError } from './problem-detail';

describe('formatProblemHttpError', () => {
  it('renders localized problem details with the stable error code', () => {
    const error = new HttpErrorResponse({
      status: 503,
      statusText: 'Service Unavailable',
      error: {
        title: 'خدمة المصادقة غير متاحة',
        detail: 'أعد المحاولة بعد بضع دقائق.',
        code: 'AUTH-E-503',
      },
    });

    expect(
      formatProblemHttpError(error, {
        fallbackMessage: 'Login request failed.',
        networkFallbackMessage: 'Unable to reach the server.',
        codeLabel: 'Code',
      }),
    ).toBe('خدمة المصادقة غير متاحة\nأعد المحاولة بعد بضع دقائق.\nCode: AUTH-E-503');
  });

  it('returns a transport-safe network message for status 0 failures', () => {
    const error = new HttpErrorResponse({
      status: 0,
      statusText: 'Unknown Error',
    });

    expect(
      formatProblemHttpError(error, {
        fallbackMessage: 'Login request failed.',
        networkFallbackMessage: 'Unable to reach the server. Check your connection and try again.',
        codeLabel: 'Code',
      }),
    ).toBe('Unable to reach the server. Check your connection and try again.');
  });
});
