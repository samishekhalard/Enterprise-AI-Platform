import { TestBed } from '@angular/core/testing';
import { NavigationCancel, Router } from '@angular/router';
import { signal } from '@angular/core';
import { Subject } from 'rxjs';
import { MessageService } from 'primeng/api';
import { App } from './app';
import { AuthFacade } from './core/auth/auth-facade';

describe('App', () => {
  const routerEvents = new Subject<NavigationCancel>();
  const routerStub = {
    events: routerEvents.asObservable(),
    navigated: false,
    url: '/administration',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        {
          provide: Router,
          useValue: routerStub,
        },
        MessageService,
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

  it('releases the splash screen when initial navigation is canceled', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance as App & { appReady: () => boolean };

    expect(app.appReady()).toBe(false);

    routerEvents.next(new NavigationCancel(1, '/administration', 'guard redirect'));

    expect(app.appReady()).toBe(true);
  });
});
