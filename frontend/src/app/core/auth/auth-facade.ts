import { Signal } from '@angular/core';
import { Observable } from 'rxjs';
import { LoginResponse } from '../api/models';

export interface LoginCredentials {
  readonly identifier: string;
  readonly password: string;
  readonly tenantId: string;
  readonly rememberMe: boolean;
}

export abstract class AuthFacade {
  abstract readonly isAuthenticated: Signal<boolean>;
  abstract readonly message: Signal<string | null>;

  abstract login(credentials: LoginCredentials): Observable<LoginResponse>;
  abstract logout(): Observable<void>;
  abstract logoutLocal(redirectReason?: 'logged_out' | 'session_expired'): void;
  abstract getAccessToken(): string | null;
  abstract getRefreshToken(): string | null;
}
