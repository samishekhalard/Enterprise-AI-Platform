import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { authGuard } from './auth.guard';
import { SessionService } from '../services/session.service';

describe('authGuard', () => {
  let session: { isAuthenticated: () => boolean };
  let router: { createUrlTree: (commands: unknown[], extras?: unknown) => unknown };

  beforeEach(() => {
    session = {
      isAuthenticated: () => false,
    };

    router = {
      createUrlTree: (commands: unknown[], extras?: unknown) => ({ commands, extras }),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: SessionService, useValue: session },
        { provide: Router, useValue: router },
      ],
    });
  });

  it('allows navigation when authenticated', () => {
    session.isAuthenticated = () => true;

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as never, { url: '/administration' } as never),
    );

    expect(result).toBe(true);
  });

  it('redirects unauthenticated users to login with returnUrl', () => {
    session.isAuthenticated = () => false;

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as never, { url: '/tenants?page=2' } as never),
    );
    const tree = result as unknown as {
      commands: unknown[];
      extras?: { queryParams?: { returnUrl?: string } };
    };

    expect(tree.commands).toEqual(['/auth/login']);
    expect(tree.extras?.queryParams?.returnUrl).toBe('/tenants?page=2');
  });
});
