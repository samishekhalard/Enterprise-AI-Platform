import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { AuthUiTextService } from './auth-ui-text.service';

describe('AuthUiTextService', () => {
  let service: AuthUiTextService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(AuthUiTextService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('loads tenant-scoped auth UI messages from the API', async () => {
    const preloadPromise = service.preload();

    const req = httpTesting.expectOne((request) => {
      return request.method === 'GET' && request.url.includes('/api/v1/auth/messages');
    });
    expect(req.request.params.get('codes')).toContain('AUTH-I-031');
    req.flush([
      { code: 'AUTH-I-031', text: 'Tenant specific sign-out', locale: 'en' },
      { code: 'AUTH-E-032', text: 'Tenant network message', locale: 'en' },
    ]);

    await preloadPromise;

    expect(service.text('AUTH-I-031')).toBe('Tenant specific sign-out');
    expect(service.text('AUTH-E-032')).toBe('Tenant network message');
  });

  it('falls back to local copy when the API is unavailable', async () => {
    const preloadPromise = service.preload();

    const req = httpTesting.expectOne((request) => {
      return request.method === 'GET' && request.url.includes('/api/v1/auth/messages');
    });
    req.flush('down', { status: 503, statusText: 'Service Unavailable' });

    await preloadPromise;

    expect(service.text('AUTH-C-005')).toBe('Tenant ID is required.');
  });
});
