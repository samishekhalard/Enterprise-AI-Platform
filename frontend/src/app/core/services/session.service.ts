import { Injectable, computed, signal } from '@angular/core';

const ACCESS_TOKEN_KEY = 'tp_access_token';
const REFRESH_TOKEN_KEY = 'tp_refresh_token';

@Injectable({
  providedIn: 'root',
})
export class SessionService {
  private readonly accessTokenState = signal<string | null>(this.readToken(ACCESS_TOKEN_KEY));
  private readonly refreshTokenState = signal<string | null>(this.readToken(REFRESH_TOKEN_KEY));

  readonly accessToken = this.accessTokenState.asReadonly();
  readonly refreshToken = this.refreshTokenState.asReadonly();
  readonly isAuthenticated = computed(() => Boolean(this.accessTokenState()));

  setTokens(accessToken: string | null, refreshToken: string | null, rememberMe: boolean): void {
    this.writeToken(ACCESS_TOKEN_KEY, accessToken, rememberMe);
    this.writeToken(REFRESH_TOKEN_KEY, refreshToken, rememberMe);
    this.accessTokenState.set(accessToken);
    this.refreshTokenState.set(refreshToken);
  }

  clearTokens(): void {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    this.accessTokenState.set(null);
    this.refreshTokenState.set(null);
  }

  isPersistentSession(): boolean {
    return localStorage.getItem(ACCESS_TOKEN_KEY) !== null;
  }

  getAccessTokenClaims(): Record<string, unknown> | null {
    const token = this.accessTokenState();
    if (!token) {
      return null;
    }

    return decodeJwtPayload(token);
  }

  getUserId(): string | null {
    const claims = this.getAccessTokenClaims();
    if (!claims) {
      return null;
    }

    const subject =
      asString(claims['sub']) ?? asString(claims['user_id']) ?? asString(claims['uid']) ?? null;

    return subject;
  }

  private readToken(key: string): string | null {
    return sessionStorage.getItem(key) ?? localStorage.getItem(key);
  }

  private writeToken(key: string, value: string | null, rememberMe: boolean): void {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);

    if (!value) {
      return;
    }

    if (rememberMe) {
      localStorage.setItem(key, value);
      return;
    }

    sessionStorage.setItem(key, value);
  }
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const segments = token.split('.');
  if (segments.length < 2) {
    return null;
  }

  try {
    const base64 = segments[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4 || 4)) % 4);
    const decoded = atob(padded);
    const parsed = JSON.parse(decoded);
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return null;
  }

  return null;
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}
