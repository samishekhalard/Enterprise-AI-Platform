# Frontend Implementation Plan

**Document Version:** 1.0.0
**Status:** DRAFT
**Last Updated:** 2026-02-22

---

## Overview

This document outlines the remaining frontend work required to achieve full-stack completion of the EMS (Enterprise Management System) platform. All backend APIs are fully implemented and ready for frontend integration.

---

## Current Status

### Progress Summary

```
Backend:  ████████████████████ 100%
Frontend: ████████░░░░░░░░░░░░  40%
Overall:  ████████████░░░░░░░░  60%
```

### Architecture Roadmap Status

| Phase | Description | Status |
|-------|-------------|--------|
| **Phase 1** | User Service - Foundation | COMPLETE |
| **Phase 2** | User Service - Sessions & Devices | COMPLETE |
| **Phase 3** | License Service | COMPLETE |
| **Phase 4** | Audit Service | COMPLETE |
| **Phase 5** | Integration | COMPLETE |
| **Phase 6** | Frontend | **PARTIAL** |

---

## Backend Services (100% Complete)

| Service | Port | Tables | Key Features | Status |
|---------|------|--------|--------------|--------|
| **auth-facade** | 8081 | Valkey | Auth, MFA, Social Login, Token Management | DONE |
| **tenant-service** | 8082 | 6 | Multi-tenancy, Domains, Branding, Auth Providers | DONE |
| **user-service** | 8083 | 3 | Profiles, Sessions, Devices, Keycloak Sync | DONE |
| **license-service** | 8085 | 4 | License Pools, Seats, Feature Gates | DONE |
| **audit-service** | 8087 | 1 | Event Logging, Search, Retention | DONE |

---

## Frontend Implementation Status

### Implemented Features

| Feature | Status | Notes |
|---------|--------|-------|
| Login/Auth Flow | COMPLETE | Email/password, social SSO |
| Social SSO (Google, Azure, UAE Pass) | COMPLETE | Full OAuth integration |
| MFA Setup/Verification | COMPLETE | TOTP and Email methods |
| Tenant Resolution | COMPLETE | Domain-based routing |
| Products Module | COMPLETE | Full CRUD |
| Personas Module | COMPLETE | Full CRUD with journey mapping |
| BPMN Process Modeler | COMPLETE | Full editor with properties panel |
| Profile Page | PARTIAL | Basic skeleton only |
| Administration Page | PARTIAL | UI skeleton, limited functionality |

### Missing Features (Critical Gaps)

| Feature | Backend API | Frontend UI | Frontend Service | Priority |
|---------|-------------|-------------|------------------|----------|
| **User Management** | Ready | Missing | Missing | P0 |
| **License Management** | Ready | Missing | Missing | P0 |
| **Audit Log Viewer** | Ready | Missing | Missing | P1 |
| **Session Management** | Ready | Missing | Partial | P1 |
| **Device Management** | Ready | Missing | Missing | P1 |
| **Tenant Settings** | Ready | Skeleton | Partial | P2 |

---

## Implementation Tasks

### Phase 6A: Core Admin Services (Week 1-2)

#### 1. UserManagementService
**Effort:** 2 days
**Priority:** P0

```typescript
// Required methods
- getUsers(params: UserSearchParams): Observable<PagedResult<UserProfile>>
- getUser(userId: string): Observable<UserProfile>
- createUser(request: CreateUserRequest): Observable<UserProfile>
- updateUser(userId: string, request: UpdateUserRequest): Observable<UserProfile>
- deleteUser(userId: string): Observable<void>
- enableUser(userId: string): Observable<void>
- disableUser(userId: string): Observable<void>
- assignRole(userId: string, role: string): Observable<void>
- removeRole(userId: string, role: string): Observable<void>
```

#### 2. LicenseManagementService
**Effort:** 2 days
**Priority:** P0

```typescript
// Required methods
- getLicenseProducts(): Observable<LicenseProduct[]>
- getTenantLicenses(): Observable<TenantLicense[]>
- assignLicenseToUser(userId: string, licenseId: string): Observable<void>
- revokeLicenseFromUser(userId: string, licenseId: string): Observable<void>
- getLicenseUsage(): Observable<LicenseUsageStats>
- checkFeatureAccess(feature: string): Observable<boolean>
```

#### 3. AuditLogService (Replace localStorage)
**Effort:** 1 day
**Priority:** P1

```typescript
// Required methods
- getAuditEvents(params: AuditSearchParams): Observable<PagedResult<AuditEvent>>
- getAuditEvent(eventId: string): Observable<AuditEvent>
- getUserActivity(userId: string): Observable<AuditEvent[]>
- getResourceHistory(resourceType: string, resourceId: string): Observable<AuditEvent[]>
- exportAuditLogs(params: ExportParams): Observable<Blob>
```

---

### Phase 6B: User Management UI (Week 2-3)

#### 4. User List Page
**Effort:** 2 days
**Priority:** P0

**Components:**
- User search with filters (status, role, department)
- Sortable data table with pagination
- Bulk actions (enable/disable, assign license)
- Quick actions per row (edit, view, disable)

**Route:** `/admin/users`

#### 5. User Detail Page
**Effort:** 3 days
**Priority:** P0

**Tabs:**
- **Profile** - View/edit user profile fields
- **Sessions** - List active sessions with revoke actions
- **Devices** - List devices with trust/block actions
- **Licenses** - View/assign/revoke licenses
- **Activity** - Recent audit trail for user

**Route:** `/admin/users/:userId`

---

### Phase 6C: License Management UI (Week 3-4)

#### 6. License Dashboard
**Effort:** 2 days
**Priority:** P0

**Components:**
- License pool overview cards
- Seat usage charts (used/available/total)
- License expiration warnings
- Quick assign modal

**Route:** `/admin/licenses`

#### 7. License Assignment
**Effort:** 1 day
**Priority:** P0

**Components:**
- User search for license assignment
- License type selector
- Feature override toggles
- Bulk assignment wizard

---

### Phase 6D: Audit & Security UI (Week 4-5)

#### 8. Audit Log Viewer
**Effort:** 2 days
**Priority:** P1

**Components:**
- Advanced search form (date range, user, resource, event type)
- Results table with expandable details
- Correlation ID grouping
- Export to CSV/JSON

**Route:** `/admin/audit`

#### 9. Session Management UI
**Effort:** 1 day
**Priority:** P1

**Components:**
- Active sessions list (self-service)
- Session details (device, IP, location, last activity)
- Revoke session confirmation dialog
- "Sign out all other sessions" action

**Route:** `/profile/sessions`

#### 10. Device Management UI
**Effort:** 1 day
**Priority:** P1

**Components:**
- Registered devices list
- Device details (fingerprint, browser, OS)
- Trust/untrust toggle
- Remove device action

**Route:** `/profile/devices`

---

### Phase 6E: Configuration UI (Week 5-6)

#### 11. Tenant Settings Completion
**Effort:** 2 days
**Priority:** P2

**Missing Sections:**
- Branding editor (colors, logos, fonts)
- Auth provider configuration forms
- Session policy editor
- MFA enforcement settings
- Password policy configuration

**Route:** `/admin/settings`

---

## Data Models to Create

### User Management Models
```typescript
interface UserProfile {
  id: string;
  keycloakId: string;
  email: string;
  displayName: string;
  firstName: string;
  lastName: string;
  jobTitle?: string;
  department?: string;
  phone?: string;
  mobile?: string;
  officeLocation?: string;
  employeeId?: string;
  employeeType?: 'FULL_TIME' | 'CONTRACTOR' | 'INTERN';
  managerId?: string;
  avatarUrl?: string;
  timezone?: string;
  locale?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  mfaEnabled: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface UserDevice {
  id: string;
  deviceName: string;
  deviceType: 'DESKTOP' | 'MOBILE' | 'TABLET';
  browser: string;
  os: string;
  trusted: boolean;
  lastUsedAt: Date;
  createdAt: Date;
}

interface UserSession {
  id: string;
  deviceId: string;
  deviceName: string;
  ipAddress: string;
  location?: { city: string; country: string };
  createdAt: Date;
  lastActivity: Date;
  isCurrent: boolean;
}
```

### License Models
```typescript
interface LicenseProduct {
  id: string;
  name: string;
  description: string;
  tier: 'STARTER' | 'PRO' | 'ENTERPRISE';
  features: LicenseFeature[];
}

interface LicenseFeature {
  id: string;
  name: string;
  code: string;
  description: string;
}

interface TenantLicense {
  id: string;
  productId: string;
  productName: string;
  totalSeats: number;
  assignedSeats: number;
  availableSeats: number;
  validFrom: Date;
  validUntil: Date;
  status: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED';
}

interface UserLicenseAssignment {
  id: string;
  userId: string;
  licenseId: string;
  productName: string;
  assignedAt: Date;
  assignedBy: string;
  enabledFeatures: string[];
  disabledFeatures: string[];
}
```

### Audit Models
```typescript
interface AuditEvent {
  id: string;
  eventType: string;
  eventCategory: string;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  outcome: 'SUCCESS' | 'FAILURE';
  userId?: string;
  userEmail?: string;
  resourceType?: string;
  resourceId?: string;
  resourceName?: string;
  action: string;
  description: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  correlationId?: string;
  timestamp: Date;
}

interface AuditSearchParams {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  eventType?: string;
  resourceType?: string;
  outcome?: string;
  page: number;
  size: number;
  sort?: string;
}
```

---

## Routing Updates

### New Routes to Add

```typescript
// Admin routes
{ path: 'admin/users', component: UserListComponent },
{ path: 'admin/users/:id', component: UserDetailComponent },
{ path: 'admin/licenses', component: LicenseDashboardComponent },
{ path: 'admin/audit', component: AuditLogViewerComponent },
{ path: 'admin/settings', component: TenantSettingsComponent },

// Self-service routes
{ path: 'profile/sessions', component: MySessionsComponent },
{ path: 'profile/devices', component: MyDevicesComponent },
```

---

## Effort Summary

| Task | Effort | Priority | Dependencies |
|------|--------|----------|--------------|
| UserManagementService | 2 days | P0 | - |
| LicenseManagementService | 2 days | P0 | - |
| AuditLogService | 1 day | P1 | - |
| User List Page | 2 days | P0 | UserManagementService |
| User Detail Page | 3 days | P0 | UserManagementService |
| License Dashboard | 2 days | P0 | LicenseManagementService |
| License Assignment | 1 day | P0 | LicenseManagementService |
| Audit Log Viewer | 2 days | P1 | AuditLogService |
| Session Management UI | 1 day | P1 | - |
| Device Management UI | 1 day | P1 | - |
| Tenant Settings Completion | 2 days | P2 | - |

**Total Estimated:** ~16 development days

---

## Success Criteria

- [ ] All backend APIs have corresponding frontend services
- [ ] User management CRUD operations work end-to-end
- [ ] License assignment and revocation work correctly
- [ ] Audit logs are searchable and exportable
- [ ] Session and device management is functional
- [ ] All new pages follow UI development guidelines
- [ ] Accessibility (WCAG 2.1 AA) compliance maintained
- [ ] Unit tests for all new services
- [ ] E2E tests for critical user flows

---

## Related Documents

- [UI Development Guidelines](./UI-DEVELOPMENT-GUIDELINES.md)
- [IAM Architecture](./architecture-and-principles/IAM-ARCHITECTURE.md)
- [Authorization Architecture](./architecture-and-principles/AUTHORIZATION-ARCHITECTURE.md)
