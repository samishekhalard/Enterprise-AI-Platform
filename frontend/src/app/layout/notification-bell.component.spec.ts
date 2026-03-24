import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { NotificationBellComponent } from './notification-bell.component';
import { NotificationService } from '../core/services/notification.service';

describe('NotificationBellComponent', () => {
  let fixture: ComponentFixture<NotificationBellComponent>;
  let component: NotificationBellComponent;
  let router: Router;
  let mockNotificationService: {
    unreadCount: ReturnType<typeof signal<number>>;
    getUnreadCount: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockNotificationService = {
      unreadCount: signal(5),
      getUnreadCount: vi.fn().mockReturnValue(of(5)),
    };

    await TestBed.configureTestingModule({
      imports: [NotificationBellComponent],
      providers: [
        provideRouter([]),
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationBellComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should show badge when unread count is > 0', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const badge = compiled.querySelector('[data-testid="notification-badge"]');
    expect(badge).toBeTruthy();
  });

  it('should not show badge when unread count is 0', () => {
    mockNotificationService.unreadCount.set(0);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const badge = compiled.querySelector('[data-testid="notification-badge"]');
    expect(badge).toBeFalsy();
  });

  it('should display 99+ when count exceeds 99', () => {
    mockNotificationService.unreadCount.set(150);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const badge = compiled.querySelector('[data-testid="notification-badge"]');
    expect(badge?.textContent?.trim()).toContain('99+');
  });

  it('should navigate to /notifications on click', () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.detectChanges();

    const bellButton = fixture.nativeElement.querySelector(
      '[data-testid="notification-bell"]',
    ) as HTMLButtonElement;
    bellButton.click();

    expect(navigateSpy).toHaveBeenCalledWith(['/notifications']);
  });

  it('should have accessible aria-label', () => {
    fixture.detectChanges();
    const bellButton = fixture.nativeElement.querySelector(
      '[data-testid="notification-bell"]',
    ) as HTMLButtonElement;
    expect(bellButton.getAttribute('aria-label')).toBe('Notifications');
  });
});
