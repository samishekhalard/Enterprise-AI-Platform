# R02 Message Code Registry

**Date:** 2026-03-23
**Scope:** Tenant Management -- all user-facing messages
**Pattern:** `TEN-{TYPE}-{###}` where TYPE = S (success), W (warning), E (error), C (confirmation), I (info)
**Governance:** Each code is unique, immutable once assigned. New codes append, never reuse retired codes.

---

## Message Code Catalog

### Success Messages (TEN-S-*)

| Code | Type | HTTP | Default Title | Default Detail | Screen | Story |
|------|------|------|---------------|----------------|--------|-------|
| TEN-S-001 | Success | 201 | Tenant Created | Tenant "{name}" has been created and provisioning has started. | Wizard Complete | US-TM-01 |
| TEN-S-002 | Success | 200 | Tenant Updated | Tenant settings have been saved. | Fact Sheet Banner | US-TM-02 |
| TEN-S-003 | Success | 200 | Tenant Activated | Tenant "{name}" is now active. | Lifecycle Dialog | US-TM-04 |
| TEN-S-004 | Success | 200 | Tenant Suspended | Tenant "{name}" has been suspended. All user sessions terminated. | Lifecycle Dialog | US-TM-04 |
| TEN-S-005 | Success | 200 | Tenant Reactivated | Tenant "{name}" has been reactivated. | Lifecycle Dialog | US-TM-04 |
| TEN-S-006 | Success | 200 | Tenant Archived | Tenant "{name}" has been archived. Data retained for 90 days. | Lifecycle Dialog | US-TM-04 |
| TEN-S-007 | Success | 200 | Branding Saved | Branding changes saved. Preview available. | Branding Tab | US-TM-05 |
| TEN-S-008 | Success | 200 | Branding Published | Branding published to tenant "{name}". Changes visible to all users. | Branding Tab | US-TM-05 |
| TEN-S-009 | Success | 200 | Integration Added | Integration "{providerName}" configured for tenant "{name}". | Integrations Tab | US-TM-07 |
| TEN-S-010 | Success | 200 | User Invited | Invitation sent to {email}. | Users Tab | US-TM-08 |
| TEN-S-011 | Success | 200 | Dictionary Published | Dictionary changes published to tenant "{name}". | Dictionary Tab | US-TM-09 |
| TEN-S-012 | Success | 200 | Agent Deployed | Agent "{agentName}" deployed to tenant "{name}". | Agents Tab | US-TM-10 |
| TEN-S-013 | Success | 200 | Tenant Restored | Tenant "{name}" restored from archive. | Lifecycle Dialog | US-TM-04 |
| TEN-S-014 | Success | 200 | Tenant Active with Warnings | Tenant "{name}" is active but some provisioning steps completed with warnings. Check Health Checks tab. | Fact Sheet Banner | US-TM-01 |

### Warning Messages (TEN-W-*)

| Code | Type | HTTP | Default Title | Default Detail | Screen | Story |
|------|------|------|---------------|----------------|--------|-------|
| TEN-W-001 | Warning | -- | License Limit Near | Tenant "{name}" is at {percentage}% of seat allocation ({used}/{total}). | Fact Sheet Banner | US-TM-03 |
| TEN-W-002 | Warning | -- | Provisioning Delayed | Tenant provisioning step "{step}" is taking longer than expected. | Wizard / Banner | US-TM-01 |
| TEN-W-003 | Warning | -- | Suspension Impact | Suspending will terminate {activeSessionCount} active user sessions. | Lifecycle Dialog | US-TM-04 |
| TEN-W-004 | Warning | -- | Archive Retention | Archived tenant data will be permanently deleted after 90 days. | Lifecycle Dialog | US-TM-04 |
| TEN-W-005 | Warning | -- | Unsaved Branding | You have unsaved branding changes. Navigating away will discard them. | Branding Tab | US-TM-05 |
| TEN-W-006 | Warning | -- | Health Check Degraded | Tenant "{name}" health check "{checkName}" is degraded. | Health Checks Tab | US-TM-13 |
| TEN-W-007 | Warning | -- | Duplicate Slug | The slug "{slug}" is similar to existing tenant "{existingName}". | Wizard Step 1 | US-TM-01 |
| TEN-W-008 | Warning | -- | Dictionary Seeding Incomplete | Dictionary data tables could not be fully populated for tenant "{name}". Tenant is active but dictionary may be incomplete. | Health Checks Tab | US-TM-01 |
| TEN-W-009 | Warning | -- | Object Definition Cloning Incomplete | Object definitions could not be cloned from master for tenant "{name}". Definitions will need manual setup. | Health Checks Tab | US-TM-01 |
| TEN-W-010 | Warning | -- | Default Configuration Incomplete | Default configuration (branding, locales, templates) could not be fully applied to tenant "{name}". | Health Checks Tab | US-TM-01 |
| TEN-W-011 | Warning | -- | Admin Email Delivery Failed | Welcome email could not be delivered to tenant admin "{email}". Admin can still log in. | Create Tenant Form / Notifications | US-TM-01 |

### Error Messages (TEN-E-*)

| Code | Type | HTTP | Default Title | Default Detail | Screen | Story |
|------|------|------|---------------|----------------|--------|-------|
| TEN-E-001 | Error | 409 | Slug Already Exists | A tenant with slug "{slug}" already exists. Choose a different slug. | Wizard Step 1 | US-TM-01 |
| TEN-E-002 | Error | 422 | Invalid Tenant Name | Tenant name must be 2-100 characters. Special characters not allowed: {chars}. | Wizard Step 1 | US-TM-01 |
| TEN-E-003 | Error | 422 | Invalid Slug Format | Slug must be lowercase alphanumeric with hyphens only, 3-50 characters. | Wizard Step 1 | US-TM-01 |
| TEN-E-004 | Error | 500 | Provisioning Failed | Tenant provisioning failed at step "{step}". Contact platform administrator. | Wizard / Banner | US-TM-01 |
| TEN-E-005 | Error | 403 | Insufficient Permissions | You do not have permission to {action} for tenant "{name}". | Any | -- |
| TEN-E-006 | Error | 404 | Tenant Not Found | Tenant "{identifier}" does not exist or has been permanently deleted. | Any | -- |
| TEN-E-007 | Error | 409 | Invalid State Transition | Cannot {action} tenant "{name}" -- current state "{currentState}" does not allow this transition. | Lifecycle Dialog | US-TM-04 |
| TEN-E-008 | Error | 409 | Protected Tenant | The MASTER tenant cannot be suspended, archived, or deleted. | Lifecycle Dialog | US-TM-04 |
| TEN-E-009 | Error | 422 | Invalid Domain | Domain "{domain}" is not a valid domain format. | Wizard Step 1 | US-TM-01 |
| TEN-E-010 | Error | 409 | Domain Already Claimed | Domain "{domain}" is already assigned to tenant "{existingTenant}". | Wizard Step 1 | US-TM-01 |
| TEN-E-011 | Error | 422 | License Limit Exceeded | Cannot add user -- tenant "{name}" has reached seat limit ({used}/{total}). | Users Tab | US-TM-08 |
| TEN-E-012 | Error | 422 | Invalid Branding Asset | Image must be PNG/SVG, max 2MB, min 64x64px. | Branding Tab | US-TM-05 |
| TEN-E-013 | Error | 500 | Integration Connection Failed | Could not connect to "{providerName}": {errorDetail}. | Integrations Tab | US-TM-07 |
| TEN-E-014 | Error | 422 | Invalid Integration Config | Integration configuration is incomplete: {missingFields}. | Integrations Tab | US-TM-07 |
| TEN-E-015 | Error | 500 | Health Check Failure | Health check "{checkName}" failed for tenant "{name}": {detail}. | Health Checks Tab | US-TM-13 |
| TEN-E-016 | Error | 422 | Invalid Admin Email | The email address "{email}" is not a valid email format. | Create Tenant Form | US-TM-01 |
| TEN-E-017 | Error | 500 | Database Creation Failed | Failed to create database for tenant "{name}": {detail}. Step: {step}. | Provisioning | US-TM-01 |
| TEN-E-018 | Error | 500 | Keycloak Realm Failed | Failed to create Keycloak realm for tenant "{name}": {detail}. | Provisioning | US-TM-01 |
| TEN-E-019 | Error | 500 | Admin User Creation Failed | Failed to create tenant admin user "{email}" in Keycloak: {detail}. | Provisioning | US-TM-01 |
| TEN-E-020 | Error | 422 | No Tenant License Available | Cannot create tenant. No tenant licenses available. Contact license administrator. | Create Tenant Form | US-TM-01 |
| TEN-E-021 | Error | 422 | Insufficient Admin Seats | At least 1 Admin seat must be allocated to the new tenant. | Create Tenant Form | US-TM-01 |
| TEN-E-022 | Error | 422 | Duplicate Tenant Name | A tenant with name "{name}" already exists. Choose a different name. | Create Tenant Form | US-TM-01 |

### Confirmation Messages (TEN-C-*)

| Code | Type | HTTP | Default Title | Default Detail | Screen | Story |
|------|------|------|---------------|----------------|--------|-------|
| TEN-C-001 | Confirmation | -- | Confirm Suspension | Are you sure you want to suspend tenant "{name}"? This will terminate all active sessions ({count}). | Lifecycle Dialog | US-TM-04 |
| TEN-C-002 | Confirmation | -- | Confirm Archive | Are you sure you want to archive tenant "{name}"? Users will lose access immediately. Data retained for 90 days. | Lifecycle Dialog | US-TM-04 |
| TEN-C-003 | Confirmation | -- | Confirm Permanent Delete | Are you sure you want to permanently delete tenant "{name}"? This action CANNOT be undone. Type the tenant slug to confirm. | Lifecycle Dialog | US-TM-04 |
| TEN-C-004 | Confirmation | -- | Confirm Branding Publish | Publish branding changes to all users of tenant "{name}"? | Branding Tab | US-TM-05 |
| TEN-C-005 | Confirmation | -- | Confirm User Removal | Remove user "{userName}" from tenant "{name}"? They will lose access immediately. | Users Tab | US-TM-08 |
| TEN-C-006 | Confirmation | -- | Confirm Dictionary Publish | Publish dictionary changes? This will update object type definitions for all users. | Dictionary Tab | US-TM-09 |
| TEN-C-007 | Confirmation | -- | Confirm Restore | Restore tenant "{name}" from archive? This will reactivate the tenant in SUSPENDED state. | Lifecycle Dialog | US-TM-04 |

### Info Messages (TEN-I-*)

| Code | Type | HTTP | Default Title | Default Detail | Screen | Story |
|------|------|------|---------------|----------------|--------|-------|
| TEN-I-001 | Info | -- | Provisioning In Progress | Setting up tenant "{name}"... Step {current} of {total}: {stepName}. | Wizard / Banner | US-TM-01 |
| TEN-I-002 | Info | -- | No Tenants | No tenants found. Create your first tenant to get started. | Tenant List | -- |
| TEN-I-003 | Info | -- | Empty Tab | No {entityType} configured for this tenant yet. | Any Tab (Empty State) | -- |
| TEN-I-004 | Info | -- | Master Tenant | This is the MASTER tenant. Platform-wide settings are managed here. | Fact Sheet Banner | -- |
| TEN-I-005 | Info | -- | Read-Only Access | You have read-only access to this tenant. | Fact Sheet Banner | -- |
| TEN-I-006 | Info | -- | Audit Log Retention | Audit events older than {days} days are automatically archived. | Audit Log Tab | US-TM-12 |
| TEN-I-007 | Info | -- | Provisioning Step Completed | Provisioning step "{stepName}" completed for tenant "{name}". | Provisioning Progress | US-TM-01 |
| TEN-I-008 | Info | -- | License Allocation Summary | Allocated to tenant "{name}": {adminSeats} Admin, {userSeats} User, {viewerSeats} Viewer seats. | Create Tenant Form | US-TM-01 |

---

## Code Summary

| Type | Prefix | Count | Range |
|------|--------|-------|-------|
| Success | TEN-S | 14 | 001-014 |
| Warning | TEN-W | 11 | 001-011 |
| Error | TEN-E | 22 | 001-022 |
| Confirmation | TEN-C | 7 | 001-007 |
| Info | TEN-I | 8 | 001-008 |
| **Total** | | **62** | |

---

## Approval Matrix

| Type | UI Pattern | Dismissal | Blocking? |
|------|-----------|-----------|-----------|
| Success | Toast notification (top-right) | Auto-dismiss 5s or manual | No |
| Warning | Inline banner or toast | Manual dismiss | No |
| Error | Inline validation or toast | Manual dismiss | Yes (blocks action) |
| Confirmation | Modal dialog with explicit confirm/cancel | Explicit choice required | Yes (blocks action) |
| Info | Inline text or banner | Persistent (context-dependent) | No |

---

## Governance Rules

1. **Code format:** `TEN-{S|W|E|C|I}-{###}` -- three-digit zero-padded sequence per type.
2. **Immutability:** Once a code is assigned, it is never reused. If a message is retired, mark it `RETIRED` with date and reason in this registry.
3. **Interpolation:** All dynamic variables use `{camelCase}` syntax (e.g., `{name}`, `{activeSessionCount}`, `{providerName}`).
4. **Localization:** Default messages are English. Translations are managed via the tenant message translation service. The code is the lookup key.
5. **Screen binding:** Every message must map to at least one screen or component binding.
6. **Story traceability:** Messages tied to a user story reference the story ID. Cross-cutting messages (permissions, not-found) use `--` for the story column.
7. **New codes:** Append to the end of the relevant type section. Use the next available sequence number.
8. **Retirement format:** `| TEN-X-NNN | RETIRED | -- | (original title) | Retired {date}: {reason} | -- | -- |`

---

## Interpolation Variable Reference

| Variable | Type | Example Value | Used In |
|----------|------|---------------|---------|
| `{name}` | String | "Acme Corp" | Most messages |
| `{slug}` | String | "acme-corp" | TEN-E-001, TEN-E-003, TEN-W-007, TEN-C-003 |
| `{email}` | String | "user@example.com" | TEN-S-010 |
| `{percentage}` | Number | 85 | TEN-W-001 |
| `{used}` | Number | 85 | TEN-W-001, TEN-E-011 |
| `{total}` | Number | 100 | TEN-W-001, TEN-E-011, TEN-I-001 |
| `{step}` | String | "Database Schema" | TEN-W-002, TEN-E-004 |
| `{activeSessionCount}` | Number | 42 | TEN-W-003 |
| `{checkName}` | String | "Database Connectivity" | TEN-W-006, TEN-E-015 |
| `{existingName}` | String | "Acme Industries" | TEN-W-007 |
| `{chars}` | String | "< > & \" '" | TEN-E-002 |
| `{identifier}` | String | "acme-corp" or UUID | TEN-E-006 |
| `{action}` | String | "suspend" | TEN-E-005, TEN-E-007 |
| `{currentState}` | String | "ARCHIVED" | TEN-E-007 |
| `{domain}` | String | "acme.example.com" | TEN-E-009, TEN-E-010 |
| `{existingTenant}` | String | "Acme Corp" | TEN-E-010 |
| `{providerName}` | String | "Azure AD" | TEN-S-009, TEN-E-013 |
| `{errorDetail}` | String | "Connection timeout" | TEN-E-013 |
| `{missingFields}` | String | "clientId, clientSecret" | TEN-E-014 |
| `{detail}` | String | "Connection refused" | TEN-E-015 |
| `{count}` | Number | 12 | TEN-C-001 |
| `{userName}` | String | "John Doe" | TEN-C-005 |
| `{agentName}` | String | "Support Bot" | TEN-S-012 |
| `{current}` | Number | 3 | TEN-I-001 |
| `{stepName}` | String | "Keycloak Realm" | TEN-I-001 |
| `{entityType}` | String | "integrations" | TEN-I-003 |
| `{days}` | Number | 365 | TEN-I-006 |
| `{adminSeats}` | Number | 5 | TEN-I-008 |
| `{userSeats}` | Number | 50 | TEN-I-008 |
| `{viewerSeats}` | Number | 100 | TEN-I-008 |
