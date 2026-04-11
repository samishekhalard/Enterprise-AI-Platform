# ISSUE-004: Browser Back/Forward Shows Login for Authenticated Admin Sessions

## Metadata

- **Issue ID:** ISSUE-004
- **Status:** Open
- **Priority:** High
- **Category:** UX / Authorization
- **Reported On:** 2026-03-03
- **Affected Areas:** `frontend` router history handling, `auth/login` route behavior, `administration` section navigation

## Summary

Authenticated admin users can reach the Login page via browser Back from `Administration -> Tenant Management` without being logged out, and Forward then returns them to Tenant Management. This creates a non-standard navigation loop and misleads users into thinking session state is inconsistent.

This is reproducible from Tenant Management directly and from other administration tabs (for example, License Management), where Back first goes to Tenant Management and then to Login.

## Trigger / Problem Statement

- Triggered by browser history navigation (Back then Forward) after successful login to Administration.
- This matters now because it degrades core admin UX and creates false signals of session/auth instability.

## Environment

- **Environment:** local
- **Frontend build/tag:** `0.1.0` (workspace version)
- **Backend build/tag:** `0.1.0` (workspace version)
- **Browser/Device:** Chrome (desktop)
- **User/Role:** master tenant admin
- **Tenant Context:** master tenant

## Steps to Reproduce

### Scenario 1

1. Sign in as master tenant admin (landing route goes to Tenant Management).
2. Click browser Back.
3. Observe Login page appears, while user session is still active.
4. Click browser Forward.
5. Observe user returns to Tenant Management.

### Scenario 2

1. Sign in as master tenant admin.
2. Go to Administration `section=license-manager`.
3. Click browser Back (returns to Tenant Management).
4. Click browser Back again (navigates to Login page, still authenticated).
5. Click browser Forward (returns to Tenant Management).

## Expected Result

Back/Forward should follow standard authenticated navigation semantics. Login should not be shown to already-authenticated users during normal history traversal unless they explicitly log out or the session expires.

## Actual Result

Back navigation can display Login despite active tokens, and Forward bounces user back to Tenant Management, creating a confusing login/admin history loop.

## Evidence Collected

- Screenshot(s): `<to attach>`
- Logs: `<to attach>`
- API trace (request/response + status): No logout/session-expired API call required to reproduce; issue is client-side routing/history behavior.
- Code references:
  - `frontend/src/app/features/auth/login.page.ts:128` (`navigateByUrl(returnUrl)` after login does not replace login entry in history)
  - `frontend/src/app/app.routes.ts:24` (`/auth/login` route has no guard to redirect authenticated users away)
  - `frontend/src/app/features/administration/administration.page.ts:104` (section changes call `router.navigate` and create additional history entries via query params)
  - `frontend/src/app/core/services/session.service.ts:15` (`isAuthenticated` depends on token presence; no token clear in this flow)

## Root Cause

### Confirmed Root Cause

The behavior is caused by browser history and route-guard flow, not by session token loss:

1. After successful login, navigation to return URL uses `navigateByUrl(returnUrl)` without `replaceUrl`, leaving `/auth/login` in browser history.
2. `/auth/login` is publicly routable and does not redirect authenticated users, so Back can render Login even when tokens are still valid.
3. Administration section changes (`?section=...`) push extra history states, which is why non-default tabs first back to Tenant Management before reaching the retained Login entry.

### Contributing Factors

- Login page shows auth form by default and does not short-circuit when `isAuthenticated === true`.
- UX expectation is based on authenticated app-shell behavior, but login route is treated as normal history destination.
- Query-param-based admin tab navigation increases history depth and amplifies confusion.

## Remediation Actions

1. On successful login, navigate to return URL with history replacement (`replaceUrl: true`) so `/auth/login` is removed from back stack.
2. Add authenticated-user redirect for `/auth/login` (route guard or login-page init redirect) to prevent rendering login when tokens are present.
3. Adjust administration section navigation history strategy (`replaceUrl` for section-only changes or equivalent) to avoid unnecessary history noise.

## Verification Plan

1. Re-run both scenarios and confirm Back does not expose Login for authenticated users.
2. Verify Forward returns expected prior page only when a real previous page exists.
3. Validate explicit logout and session-expired flows still route to Login correctly with proper reason messaging.

## Acceptance Criteria

- [ ] Back from authenticated Administration pages does not show Login unless session is invalid or user logged out.
- [ ] Forward navigation does not create Login/Tenant Management loop artifacts.
- [ ] Login, logout, and session-expired flows still behave as designed.

## Risks / Dependencies

- Route/history changes can affect current expectations for deep-link/back behavior in other sections.
- Requires alignment across login page, router config, and admin section navigation.

## Related

- `docs/issues/open/ISSUE-002-tenant-auth-providers-access-denied.md`
- `docs/issues/open/ISSUE-003-license-admin-403-gateway-routing.md`
