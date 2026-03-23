import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { App } from './app';
import { AuthFacade } from './core/auth/auth-facade';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        {
          provide: AuthFacade,
          useValue: {
            isAuthenticated: signal(false),
            message: signal(null),
            login: () => {
              throw new Error('Not implemented in test.');
            },
            logout: () => {
              throw new Error('Not implemented in test.');
            },
            logoutLocal: () => {
              throw new Error('Not implemented in test.');
            },
            getAccessToken: () => null,
            getRefreshToken: () => null,
          } satisfies AuthFacade,
        },
      ],
    }).compileComponents();
  });

  it('should create the app shell', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
