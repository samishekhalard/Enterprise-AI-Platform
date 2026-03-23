# ADR-013: Mobile Platform Strategy -- Phased PWA to Capacitor Approach

**Status:** Proposed
**Date:** 2026-02-26
**Decision Makers:** Architecture Team, Product Lead, Frontend Lead
**Category:** Strategic ADR (Platform Architecture)

---

## Context and Problem Statement

The EMS platform is an enterprise SaaS product targeting the UAE market and broader MENA region. It currently operates as a desktop-first Angular 21 web application. The platform needs a mobile presence for the following reasons:

### 1. Enterprise User Expectations

Enterprise users increasingly expect mobile access for:
- Approval workflows (license requests, user provisioning)
- Dashboard monitoring (tenant health, license usage, audit alerts)
- Session management (view/revoke active sessions from mobile)
- Notifications (push notifications for critical events)
- Quick reference (view user profiles, license details)

These are primarily **consumption and approval** tasks, not primary data entry tasks. The EMS admin panel is not a consumer app; it is an enterprise management tool where mobile provides supplementary access.

### 2. UAE Market Specifics

The UAE market has specific mobile requirements:

| Factor | Detail |
|--------|--------|
| **Smartphone penetration** | >96% in UAE (2025), one of the highest globally |
| **Foldable device adoption** | UAE leads MENA in foldable device adoption (Samsung Galaxy Z Fold/Flip). Enterprise users increasingly use foldable devices as primary work devices. |
| **Arabic RTL on mobile** | Arabic is an official language. Mobile interfaces must support RTL layouts, Arabic typography, and bidirectional text in compact viewports. |
| **UAE Pass mobile** | UAE Pass identity verification is mobile-native. Integration requires handling app-to-app OAuth flows on mobile. |
| **Government tender requirements** | Some government tenders mandate "mobile accessibility" without specifying native vs. web. |

### 3. Current Frontend Architecture State [VERIFIED]

The current Angular 21 frontend (at `/Users/mksulty/Claude/EMSIST/frontend/`) has:

- **Responsive breakpoints defined** in `styles.scss`: `$breakpoint-sm: 576px` through `$breakpoint-4k: 3840px`, plus `$breakpoint-2k: 1920px`.
- **Touch target compliance**: `--tp-touch-target-min: 44px` (WCAG 2.2 recommended minimum).
- **No mobile-specific optimizations**: No service worker, no web app manifest, no offline support, no push notification handling.
- **No Capacitor or Cordova dependencies**: The project is currently web-only.
- **PrimeNG migration planned** (see [ADR-012](./ADR-012-primeng-migration.md)): PrimeNG components are responsive by default, which provides a foundation for mobile layouts.

### 4. Backend API Considerations

The backend APIs currently assume browser-based access:
- **Tenant resolution**: Domain-based (`subdomain.ems.com`). Mobile apps do not have subdomains.
- **Authentication tokens**: JWT tokens managed via BFF pattern through `auth-facade`. Mobile apps need token storage strategy.
- **Session management**: Browser-centric session model. Mobile needs persistent sessions with background token refresh.

---

## Decision Drivers

1. **Time-to-market** -- The platform needs mobile presence as soon as possible for tender compliance and user expectations.
2. **Development efficiency** -- The team is a small cross-functional team (see constraint OC-01 in [02-constraints.md](../arc42/02-constraints.md)). Maintaining separate codebases for iOS and Android is not viable.
3. **Code reuse** -- Maximize reuse of the Angular codebase and PrimeNG component library.
4. **UAE Pass integration** -- Mobile must support UAE Pass app-to-app authentication flow.
5. **Foldable device support** -- Must handle variable viewport sizes, including unfolded tablet-size screens.
6. **Arabic RTL on compact viewports** -- RTL layout must work at 320px-428px viewport widths.
7. **Offline capability** -- Enterprise users in areas with intermittent connectivity need basic offline access.
8. **Push notifications** -- Critical events (security alerts, license expiry, approval requests) need mobile push.
9. **App store presence** -- "Download our app" is a business expectation for enterprise SaaS, even if the app wraps web content.

---

## Considered Alternatives

### Option 1: Phased Approach -- PWA then Capacitor then Native (if needed)

A three-phase strategy that starts with the lowest-cost, highest-reach approach and escalates only when specific triggers require it:

- **Phase 1 (PWA):** Make the Angular app a Progressive Web App with responsive design, service worker, installability, and basic offline.
- **Phase 2 (Capacitor):** Wrap the Angular app in Capacitor for native app store distribution, push notifications, biometric auth, and UAE Pass app-to-app flow.
- **Phase 3 (Native rewrite):** Only if Phase 2 proves insufficient for a specific capability.

**Strengths:**
- Each phase builds on the previous one; no wasted work.
- Phase 1 delivers mobile access in weeks, not months.
- Capacitor reuses 95%+ of Angular code.
- Team works in Angular/TypeScript throughout (no Swift/Kotlin learning curve).
- Foldable devices are just responsive breakpoints.

**Weaknesses:**
- PWA limitations on iOS (limited push notification support before iOS 16.4, no background sync).
- Capacitor apps may feel slightly less native than purpose-built apps.
- Phase transitions require planning.

### Option 2: Capacitor from Day One

Skip PWA and go directly to Capacitor.

**Strengths:**
- Immediate access to native APIs (push, biometrics, camera).
- App store presence from the start.

**Weaknesses:**
- **Delays time-to-market** -- Capacitor setup, app store provisioning, code signing, and CI/CD pipeline additions take weeks before any mobile features ship.
- **Over-engineering** -- Many enterprise features (dashboards, user lists, audit logs) work fine as responsive web pages. Native wrapping adds complexity without adding value for read-heavy screens.
- **PWA is still needed** for users who do not install the app.

**Rejected as starting point because:** It adds unnecessary complexity upfront. The PWA phase delivers mobile access faster and identifies which native capabilities are actually needed before committing to Capacitor overhead.

### Option 3: Flutter for Mobile, Angular for Web

Build a separate Flutter app for mobile, sharing no code with the Angular web app.

**Strengths:**
- Flutter produces high-quality native-feeling UIs on iOS and Android.
- Dart is a capable language for mobile development.
- Full control over native features.

**Weaknesses:**
- **Separate codebase** -- Two codebases (Angular web + Flutter mobile) to maintain with a small team.
- **No code reuse** -- Business logic, API clients, models, validation rules must be reimplemented in Dart.
- **Design system duplication** -- ThinkPLUS design system must be reimplemented in Flutter's widget system.
- **Team skill gap** -- Requires Dart/Flutter expertise that the team does not currently have.
- **Double feature development** -- Every new feature must be built twice.

**Rejected because:** A small team cannot sustain two separate codebases. The development cost is approximately 2x for every feature. This approach is only justified if the mobile app has fundamentally different UX requirements from the web app, which is not the case for an enterprise management tool.

### Option 4: React Native

Build a separate React Native app.

**Strengths:**
- Large community, extensive plugin ecosystem.
- JavaScript/TypeScript language familiarity.

**Weaknesses:**
- **Separate codebase** from Angular (no code sharing despite both being JavaScript).
- **Different component model** -- React Native components are not Angular components. No PrimeNG, no RxJS.
- **Same duplication problem as Flutter** but without Flutter's rendering quality.

**Rejected because:** Same team-size and code-duplication concerns as Flutter, without Flutter's rendering advantages.

---

## Decision

**Adopt a phased mobile strategy: Phase 1 (Responsive PWA), Phase 2 (Capacitor), Phase 3 (Flutter) -- with explicit triggers for phase transitions.**

### Phase 1: Responsive Progressive Web App [PLANNED]

**Goal:** Make the Angular 21 + PrimeNG application installable and usable on mobile devices.

**Scope:**

| Capability | Implementation |
|------------|---------------|
| Responsive layouts | PrimeNG responsive components + CSS media queries for mobile breakpoints (320px-428px, 429px-768px, 769px+) |
| Service Worker | Angular `@angular/service-worker` for offline shell, asset caching, and API response caching |
| Web App Manifest | `manifest.webmanifest` with EMS branding, splash screens, theme color, display: standalone |
| Installability | "Add to Home Screen" prompt with install banner |
| Offline support (basic) | Cached shell + last-loaded data for dashboard, user list. Online-only for mutations. |
| Push notifications (web) | Web Push API via `notification-service` for browsers that support it (Chrome, Edge, Firefox; limited iOS Safari) |
| Touch optimization | 44px minimum touch targets (already in ThinkPLUS design system), swipe gestures for navigation |
| Arabic RTL mobile | Verify all PrimeNG components render correctly in RTL at mobile widths; test with `dir="rtl"` and Arabic content |
| Foldable support | CSS `@media (horizontal-viewport-segments: 2)` for dual-screen layouts where applicable |

**Tenant Resolution for Mobile:**

Mobile PWA access cannot use subdomain-based tenant resolution (there are no subdomains when the app is installed to home screen). The strategy:

1. **Path-based tenant routing:** `/t/{tenant-slug}/administration` as an alternative to `{tenant}.ems.com/administration`.
2. **Tenant context header:** `X-Tenant-ID` header on API requests, populated from stored tenant context.
3. **Tenant selection on first launch:** If no tenant context, show tenant selector/login page that resolves tenant from user email domain.

This requires a backend change to `api-gateway` to support path-based tenant extraction alongside domain-based extraction.

**Authentication for Mobile PWA:**

| Concern | Strategy |
|---------|----------|
| Token storage | `HttpOnly` secure cookies (same as web, since PWA is still a browser context) |
| Session persistence | Service worker maintains auth state across app restarts |
| Token refresh | Background fetch for token refresh before expiry |
| UAE Pass | Standard browser redirect flow (not app-to-app yet; that requires Phase 2) |

### Phase 2: Capacitor Native Wrapper [PLANNED]

**Goal:** Distribute the Angular app through iOS App Store and Google Play Store, with access to native device APIs.

**Triggers to enter Phase 2** (ANY of these is sufficient):

| Trigger | Rationale |
|---------|-----------|
| Business requires App Store/Play Store presence | Enterprise procurement often requires a "real app" in the store |
| UAE Pass app-to-app flow required | UAE Pass recommends app-to-app OAuth for mobile, which requires native deep linking |
| Native push notifications required on iOS | Web Push on iOS Safari has limitations; native push via APNs is more reliable |
| Biometric authentication required | `WebAuthn`/`FIDO2` in PWA is limited; Capacitor `BiometricAuth` plugin is more reliable |
| Offline-first workflows required | If approval workflows must work fully offline with sync-on-reconnect |

**Scope:**

| Capability | Implementation |
|------------|---------------|
| App Store distribution | Capacitor project wrapping Angular build output |
| Native push | `@capacitor/push-notifications` for APNs (iOS) and FCM (Android) |
| Biometric auth | `@capacitor-community/biometric-auth` for Face ID, Touch ID, fingerprint |
| UAE Pass app-to-app | `@capacitor/app` deep link handling + UAE Pass SDK |
| Secure token storage | `@capacitor-community/secure-storage` (Keychain on iOS, Keystore on Android) instead of cookies |
| Camera/scanner | `@capacitor/camera` for document scanning if needed |
| Status bar / safe areas | `@capacitor/status-bar` for notch/island handling |
| Background sync | `@capacitor/background-runner` for offline queue processing |

**Architecture Changes for Phase 2:**

```
┌──────────────────────────────────────────────────┐
│  Capacitor Shell (iOS / Android)                 │
│  ┌────────────────────────────────────────────┐  │
│  │  Angular 21 + PrimeNG (same codebase)      │  │
│  │  ┌──────────────────────────────────────┐  │  │
│  │  │  Platform Service Layer [PLANNED]    │  │  │
│  │  │  - isPlatform('capacitor') checks    │  │  │
│  │  │  - Token storage adapter             │  │  │
│  │  │  - Push notification adapter         │  │  │
│  │  │  - Biometric auth adapter            │  │  │
│  │  └──────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────┐  │
│  │  Capacitor Plugins (native bridge)         │  │
│  │  - @capacitor/push-notifications           │  │
│  │  - @capacitor/app (deep links)             │  │
│  │  - @capacitor-community/biometric-auth     │  │
│  │  - @capacitor-community/secure-storage     │  │
│  └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
```

**Token Strategy for Capacitor:**

| Concern | PWA (Phase 1) | Capacitor (Phase 2) |
|---------|--------------|---------------------|
| Token storage | `HttpOnly` cookies | Secure Storage (Keychain/Keystore) |
| Token format | Session cookie from BFF | JWT in `Authorization: Bearer` header |
| Refresh | Cookie-based auto-refresh | Explicit refresh token in Secure Storage |
| Revocation | Server-side session invalidation | Revoke refresh token + clear Secure Storage |

This means `auth-facade` must support two token delivery mechanisms:
1. **Cookie-based** (existing, for web/PWA)
2. **Bearer token based** (new, for Capacitor native) -- The BFF returns tokens in the response body instead of setting cookies, and the mobile app stores them in Secure Storage.

This is a backend API change that should be designed during Phase 1 and implemented at the start of Phase 2.

### Phase 3: Flutter Native Rewrite [UNLIKELY]

**Goal:** Build a purpose-built native mobile app if Capacitor proves insufficient.

**Triggers to enter Phase 3** (ALL of these must be true):

| Trigger | Rationale |
|---------|-----------|
| Capacitor performance is measurably inadequate | App Store reviews below 3.5 stars citing performance, or measured jank in core flows |
| Complex native features required | AR, NFC, advanced camera integration, complex animations that WebView cannot handle |
| Business justifies 2x development cost | Budget and team capacity exist for parallel codebase maintenance |
| Angular/PrimeNG mobile rendering hits a hard limit | A specific capability that WebView fundamentally cannot provide |

**Assessment:** Phase 3 is unlikely for an enterprise management tool. Capacitor WebView performance on modern devices (2024+) is sufficient for form-heavy, data-display enterprise UIs. Flutter is reserved as an insurance policy, not a plan.

---

## Architecture Constraints for Mobile Readiness

Regardless of which phase is active, the following architectural constraints apply to all development from this point forward:

### Frontend Constraints

| Constraint | Description |
|------------|-------------|
| **MR-01: Responsive-first components** | All new components must be tested at 320px, 375px, 428px, 768px, 1024px, 1440px, 1920px widths. |
| **MR-02: No mouse-only interactions** | No `hover`-only reveals, no right-click-only menus, no drag-only operations without touch/keyboard alternatives. |
| **MR-03: Touch target minimum** | All interactive elements must be minimum 44x44px (already enforced via `--tp-touch-target-min`). |
| **MR-04: Platform-agnostic services** | Angular services that interact with device capabilities (storage, auth, notifications) must use an adapter/interface pattern so the implementation can be swapped between web and Capacitor. |
| **MR-05: No `window.location` for tenant resolution** | Use an injected `TenantResolver` service, not direct `window.location.hostname` parsing, to support both domain-based and path-based tenant resolution. |
| **MR-06: RTL at all breakpoints** | Arabic RTL must be tested at mobile breakpoints, not only desktop. |

### Backend Constraints

| Constraint | Description |
|------------|-------------|
| **MR-07: Dual tenant resolution** | `api-gateway` must support both domain-based (`{tenant}.ems.com`) and header-based (`X-Tenant-ID`) tenant resolution. |
| **MR-08: Bearer token support in auth-facade** | `auth-facade` must support returning tokens in response body (for mobile apps) in addition to `Set-Cookie` (for web). |
| **MR-09: Push notification infrastructure** | `notification-service` must support Web Push (VAPID) and native push (APNs/FCM) delivery channels. |
| **MR-10: API pagination** | All list endpoints must support pagination with configurable page sizes (mobile may use smaller page sizes for bandwidth). |

---

## Consequences

### Positive

- **Fastest time-to-market** -- Phase 1 (PWA) delivers mobile access in 2-3 weeks with no native development.
- **Maximum code reuse** -- Angular + PrimeNG codebase is shared across web, PWA, and Capacitor.
- **Single team** -- No need for iOS/Android specialists until Phase 3 (if ever).
- **Progressive investment** -- Each phase is triggered by actual need, not speculation.
- **Foldable support is free** -- CSS responsive design handles foldable screens without platform-specific code.
- **UAE Pass compatible** -- Phase 1 supports browser redirect; Phase 2 supports app-to-app.

### Negative

- **PWA limitations on iOS** -- Web Push arrived in iOS 16.4 but has limitations. Some enterprise iOS users may not receive push notifications until Phase 2.
- **Not a "real app" until Phase 2** -- Some enterprise buyers may require App Store presence before Phase 2.
- **Dual token strategy complexity** -- Supporting both cookie-based and bearer-token-based auth adds complexity to `auth-facade`.
- **Phase transitions require planning** -- Entering Phase 2 requires Capacitor project setup, CI/CD changes, code signing infrastructure, app store accounts.

### Neutral

- Backend services are largely unaffected until Phase 2 (only `api-gateway` tenant resolution changes in Phase 1).
- BPMN process modeler may have a degraded mobile experience due to canvas interaction complexity; this is acceptable for an enterprise tool.
- The mobile app will share the same PrimeNG component library and ThinkPLUS design system as the desktop web app.

---

## Implementation Evidence

Not applicable. Status is **Proposed**. No implementation exists yet.

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| iOS PWA limitations frustrate users | Medium | Medium | Clearly communicate PWA limitations to iOS users; prioritize Phase 2 for iOS push |
| UAE Pass app-to-app requires native sooner | Medium | High | Phase 2 trigger is explicit; Capacitor deep link support is well-documented |
| WebView performance on low-end Android | Low | Medium | PrimeNG components are lightweight; test on representative devices (Samsung A-series) |
| Foldable device CSS complexity | Low | Low | CSS viewport segments API is progressive; unfold just gets a wider viewport |
| Dual tenant resolution introduces bugs | Medium | High | Comprehensive integration tests for both path-based and domain-based resolution |
| Team underestimates Capacitor setup effort | Medium | Medium | Budget 1-2 sprints for Phase 2 infrastructure (CI/CD, code signing, store accounts) before feature work |

---

## Related Decisions

- **Depends on:** [ADR-012](./ADR-012-primeng-migration.md) -- PrimeNG provides the responsive component foundation for all mobile phases.
- **Related to:** [ADR-011](./ADR-011-multi-provider-authentication.md) -- UAE Pass mobile integration drives Phase 2 trigger.
- **Related to:** [ADR-004](./ADR-004-keycloak-authentication.md) -- Auth BFF pattern must be extended for mobile token delivery.
- **Impacts:** [ADR-007](./ADR-007-auth-facade-provider-agnostic.md) -- Provider-agnostic auth must support mobile token flows.
- **Arc42 Sections:** [04-solution-strategy.md](../arc42/04-solution-strategy.md), [02-constraints.md](../arc42/02-constraints.md), [07-deployment-view.md](../arc42/07-deployment-view.md), [08-crosscutting.md](../arc42/08-crosscutting.md)

---

## References

- [Progressive Web Apps on web.dev](https://web.dev/progressive-web-apps/)
- [Angular Service Worker Guide](https://angular.dev/ecosystem/service-workers)
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Capacitor + Angular Guide](https://capacitorjs.com/docs/getting-started/with-angular)
- [UAE Pass Integration Docs](https://docs.uaepass.ae/)
- [CSS Viewport Segments (Foldable)](https://www.w3.org/TR/css-viewport-segments/)
- [Flutter Documentation](https://flutter.dev/docs)
- [Apple PWA Support Status](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)

---

**Revision History:**

| Date | Change |
|------|--------|
| 2026-02-26 | Initial ADR proposed |
