# On-Premise Licensing Model Business Requirements

| Field | Value |
|-------|-------|
| **Document ID** | REQ-LIC-001 |
| **Epic** | E-003: On-Premise Tiered Licensing Model |
| **Business Objective** | BO-003: Enable offline, file-based license activation and enforcement with hierarchical tiers (Application, Tenant, User-Seat) suitable for air-gapped enterprise deployments |
| **Version** | 1.0.0 |
| **Created** | 2026-02-26 |
| **Author** | BA Agent |
| **Status** | DRAFT - Pending Stakeholder Validation |
| **Supersedes** | Portions of RBAC-LICENSING-REQUIREMENTS.md (SaaS billing model replaced by on-premise file import) |
| **Related Documents** | REQ-RBAC-001, REQ-AUTH-001, ADR-004 (Keycloak), ADR-007 (Provider-Agnostic Auth) |
| **Priority** | Must Have |

---

## Requirements Traceability

```
BO-003: On-Premise Tiered Licensing
  |
  +-- E-003: On-Premise Tiered Licensing Model
      |
      +-- US-003a: Application License Activation (file import)
      +-- US-003b: Tenant License Provisioning
      +-- US-003c: User Tier License Assignment (seat-based)
      +-- US-003d: License Renewal (offline)
      +-- US-003e: License Expiry and Grace Period
      +-- US-003f: License Status Dashboard
      +-- US-003g: Master Tenant Superadmin Lifecycle
      +-- US-003h: Login Flow with Auth Method Selection
      +-- US-003i: Seat Limit Enforcement
      +-- US-003j: Feature Gate by License Tier
```

---

## 1. Business Context

### 1.1 Deployment Model Change

EMSIST is transitioning from a SaaS-only model to an **on-premise enterprise application** deployed at client sites. This changes licensing fundamentally:

| Aspect | Previous (SaaS) | New (On-Premise) |
|--------|-----------------|-------------------|
| License validation | Cloud API phone-home | Offline file-based validation, no phone-home |
| License delivery | Online subscription portal | Signed license file delivered out-of-band |
| Billing | Monthly/Annual auto-charge | Perpetual or term-based, invoiced separately |
| Activation | Automatic on purchase | Manual import by superadmin at client site |
| Renewal | Auto-renew toggle | New license file generated and imported |
| Network requirement | Internet required | None (air-gapped environments supported) |
| Pricing | Per-seat monthly/annual | Per-tier seat packs (e.g., 5 Tenant-Admin + 20 Power User + 50 Contributor + unlimited Viewer) |

### 1.2 License Hierarchy

The licensing model is a strict three-level hierarchy:

```
Application License (1 per installation)
    |
    +-- Tenant License (1 per tenant)
    |       |
    |       +-- User Tier: Tenant-Admin (seat count)
    |       +-- User Tier: Power User (seat count)
    |       +-- User Tier: Contributor (seat count)
    |       +-- User Tier: Viewer (seat count or unlimited)
    |
    +-- Tenant License (another tenant)
            |
            +-- ... (same user tiers)
```

### 1.3 Business Drivers

1. **Air-gapped deployments** -- Government and defense clients require zero outbound network for license checks
2. **Data sovereignty** -- License data must reside entirely within the on-premise installation
3. **Predictable capacity** -- Clients purchase known seat counts per tier, enabling infrastructure sizing
4. **Separation of concerns** -- Platform entitlement (Application License) is distinct from tenant entitlement (Tenant License) which is distinct from individual access (User Tier License)

---

## 2. Business Object Model

### 2.1 Core Business Objects

#### Application License

**Description:** The top-level entitlement that activates the entire EMSIST platform installation. Without a valid Application License, the system does not start (beyond an activation screen). There is exactly one Application License per deployment.

**Attributes:**

| Attribute | Business Meaning | Required | Rules |
|-----------|------------------|----------|-------|
| License Key | Unique identifier of this license | Yes | Issued by vendor; globally unique |
| Customer Name | Legal name of the purchasing organization | Yes | Max 255 characters |
| Installation Identifier | Fingerprint of the target installation | Yes | Generated at first boot; ties license to hardware |
| Max Tenants | Maximum number of tenants allowed | Yes | Positive integer; minimum 1 |
| Valid From | Date the license becomes active | Yes | Cannot be in the future at activation time |
| Valid Until | Date the license expires | Yes | Must be after Valid From |
| Grace Period Days | Number of days after expiry during which the system remains read-only | Yes | Default 30; minimum 0 |
| Edition | Product edition | Yes | One of: Standard, Professional, Enterprise |
| Issued At | Timestamp when the license file was generated | Yes | Set by vendor |
| Issuer Signature | Cryptographic signature ensuring tamper-proof file | Yes | Validated at import |
| Status | Current operational state | Yes | One of: Active, Expired, Grace, Revoked |

**Relationships:**

| Relationship | Related Entity | Cardinality | Description |
|--------------|----------------|-------------|-------------|
| Contains | Tenant License | 1:N | An application license authorizes one or more tenant licenses |

**Business Rules:**
- BR-100: Exactly one Application License may be active per installation
- BR-101: The license file must be cryptographically signed; the system rejects tampered files
- BR-102: The Installation Identifier is generated once at first boot and cannot be changed
- BR-103: A license file is bound to a specific Installation Identifier; importing a license meant for a different installation is rejected
- BR-104: When the Application License expires, the system enters a grace period (read-only mode) before fully locking
- BR-105: The Edition governs which features are available platform-wide (see Feature Matrix, Section 4)

**Tenant Scope:** Global (not tenant-scoped)

---

#### Tenant License

**Description:** An entitlement within an Application License that activates a specific tenant and defines its seat allocations across user tiers. Each tenant requires its own Tenant License.

**Attributes:**

| Attribute | Business Meaning | Required | Rules |
|-----------|------------------|----------|-------|
| Tenant Identifier | Which tenant this license activates | Yes | Must match an existing tenant |
| Tenant Display Name | Human-readable name for the licensed tenant | Yes | Max 255 characters |
| Valid From | Activation date for this tenant | Yes | Cannot be before Application License Valid From |
| Valid Until | Expiry date for this tenant | Yes | Cannot be after Application License Valid Until |
| Max Tenant-Admin Seats | Number of Tenant-Admin seats | Yes | Positive integer; minimum 1 |
| Max Power User Seats | Number of Power User seats | Yes | Non-negative integer |
| Max Contributor Seats | Number of Contributor seats | Yes | Non-negative integer |
| Max Viewer Seats | Number of Viewer seats | Yes | Non-negative integer; 0 means unlimited |
| SSO Enabled | Whether this tenant may configure external identity providers | Yes | Boolean; governed by Application License Edition |
| Custom Branding Enabled | Whether this tenant may customize its branding | Yes | Boolean |
| AI Features Enabled | Whether this tenant has access to AI capabilities | Yes | Boolean; requires Enterprise edition |
| Status | Current operational state | Yes | One of: Active, Expired, Suspended |

**Relationships:**

| Relationship | Related Entity | Cardinality | Description |
|--------------|----------------|-------------|-------------|
| Belongs to | Application License | N:1 | Every tenant license is part of an application license |
| Contains | User Tier Seat Allocation | 1:N | A tenant license defines seat counts per user tier |
| Activates | Tenant | 1:1 | A tenant license activates exactly one tenant |

**Business Rules:**
- BR-110: A tenant cannot be activated (status set to Active) without a valid Tenant License
- BR-111: Tenant License validity dates must fall within the Application License validity dates
- BR-112: The sum of all tenant licenses' total seats (all tiers) cannot exceed the maximum seats specified in the Application License Edition limits
- BR-113: Each tenant must have at least 1 Tenant-Admin seat
- BR-114: When a Tenant License expires, tenant users cannot authenticate; existing sessions are allowed to complete but no new logins
- BR-115: Max Viewer Seats of 0 means "unlimited" -- no cap on Viewer seats for this tenant

**Tenant Scope:** Global (licenses are managed by the master tenant superadmin, not by individual tenants)

---

#### User Tier License (Seat Allocation)

**Description:** A seat assignment that grants an individual user access at a specific capability tier within their tenant. Each user occupies exactly one seat in one tier at any given time.

**Attributes:**

| Attribute | Business Meaning | Required | Rules |
|-----------|------------------|----------|-------|
| User | The individual who holds this seat | Yes | Must be a user within the same tenant |
| Tier | The access tier for this seat | Yes | One of: Tenant-Admin, Power User, Contributor, Viewer |
| Assigned At | When the seat was allocated | Yes | Set automatically at assignment time |
| Assigned By | Who allocated the seat | Yes | Must be a Tenant-Admin or Superadmin |
| Status | Whether the seat is active | Yes | One of: Active, Revoked |

**Relationships:**

| Relationship | Related Entity | Cardinality | Description |
|--------------|----------------|-------------|-------------|
| Occupies seat in | Tenant License | N:1 | Each seat belongs to one tenant license |
| Assigned to | User | 1:1 (per tier per tenant) | A user holds at most one seat per tenant |
| Maps to | Role | 1:1 | Each tier corresponds to a platform role |

**Business Rules:**
- BR-120: A user can hold at most one seat tier per tenant (no dual-tier assignments)
- BR-121: When a seat is assigned, the assigned count for that tier is incremented; when revoked, it is decremented
- BR-122: A seat assignment is rejected if the tier's assigned count equals or exceeds its maximum seats
- BR-123: Revoking a seat does not delete the user; the user remains in the system with no license (cannot access licensed features)
- BR-124: Changing a user's tier revokes the old seat and assigns a new one in the target tier (must have availability in the target tier)
- BR-125: The Superadmin on the master tenant does NOT consume a seat in any Tenant License (see Section 6)

**Tenant Scope:** Tenant-Scoped

---

### 2.2 License File

**Description:** A cryptographically signed document that encodes the Application License and all Tenant Licenses for an installation. The license file is the unit of delivery and import.

**Attributes:**

| Attribute | Business Meaning | Required | Rules |
|-----------|------------------|----------|-------|
| File Format | How the license is encoded | Yes | Signed JSON (JWS) or signed XML; human-readable payload with tamper-proof signature |
| Payload | Application License + all Tenant Licenses | Yes | Must include full hierarchy |
| Signature Algorithm | Cryptographic algorithm used | Yes | Minimum RSA-2048 or Ed25519 |
| Public Key Fingerprint | Identifies which vendor key to use for verification | Yes | Must match the embedded vendor public key |

**Business Rules:**
- BR-130: The license file is verified using a vendor public key embedded in the application at build time
- BR-131: The license file is self-contained; no network call is needed to validate it
- BR-132: The license file may be re-imported to update seat counts or extend validity (new file replaces old)
- BR-133: The system retains a history of imported license files for audit purposes

**Tenant Scope:** Global

---

## 3. License-to-Role Mapping

### 3.1 Tier-to-Role Correspondence

Each User Tier License maps to exactly one Keycloak role. The role hierarchy in the auth-facade (RBAC graph) is preserved:

| User Tier License | Keycloak Role | Role Hierarchy Level | Scope |
|-------------------|---------------|----------------------|-------|
| (Superadmin -- no license) | SUPER_ADMIN | 5 (highest) | Master tenant only |
| Tenant-Admin | ADMIN | 4 | Single tenant |
| Power User | MANAGER | 3 | Single tenant |
| Contributor | USER | 2 | Single tenant |
| Viewer | VIEWER | 1 (lowest) | Single tenant |

**Business Rules:**
- BR-140: The tier name is a business concept; the role name is a system concept. They are linked but not identical.
- BR-141: SUPER_ADMIN is NOT a license tier. It is a special role for the master tenant superadmin that exists outside the licensing model.
- BR-142: Role inheritance applies: a Tenant-Admin (ADMIN) inherits all capabilities of MANAGER, USER, and VIEWER.
- BR-143: When a user's tier license is revoked, their corresponding Keycloak role is also removed. The user retains no role (or falls back to an unauthenticated state at next login).
- BR-144: A user's effective role is determined by their seat tier, not by manual role assignment. License assignment drives role assignment -- they are synchronized.

### 3.2 Existing Role Hierarchy (from auth-facade RoleNode)

The following role hierarchy already exists in the RBAC graph and remains unchanged:

```
SUPER_ADMIN
    |-- INHERITS_FROM --> ADMIN
        |-- INHERITS_FROM --> MANAGER
            |-- INHERITS_FROM --> USER
                |-- INHERITS_FROM --> VIEWER
```

**Key Principle:** License tier assignment is the single source of truth for a user's role. The system must synchronize: when a user is assigned a "Power User" seat, they automatically receive the MANAGER role (and transitively, USER and VIEWER).

### 3.3 Application License Edition-to-Feature Mapping

The Application License Edition restricts which features the entire installation can use, regardless of tenant licenses:

| Feature Category | Standard | Professional | Enterprise |
|-----------------|----------|--------------|------------|
| Max tenants | 3 | 10 | Unlimited |
| External SSO (Azure AD, LDAP, SAML, UAE Pass) | No | Yes | Yes |
| AI Assistant | No | No | Yes |
| Custom Branding per Tenant | No | Yes | Yes |
| Advanced Process Modeling | No | Yes | Yes |
| Audit Log Retention (days) | 90 | 365 | Unlimited |
| Priority Support Entitlement | No | No | Yes |

---

## 4. Feature Matrix per License Tier

### 4.1 User Tier Feature Matrix

This matrix defines what each user tier can access, assuming the tenant's license and the application license edition both permit the feature:

| Feature | Viewer | Contributor | Power User | Tenant-Admin |
|---------|--------|-------------|------------|--------------|
| **Dashboard** | View only | View only | View + configure | Full access |
| **Process Modeler** | View published processes | Create/edit own drafts | Create/edit/publish all | Full access + delete |
| **Product Management** | View product list | View product details | Create/edit products | Full access + delete |
| **AI Assistant** | Use AI chat (if edition allows) | Use AI chat + save conversations | Use AI chat + manage agents | Full access + manage knowledge bases |
| **User Management** | View own profile only | View own profile only | View team members | Full CRUD on all tenant users |
| **Identity Provider Config** | No access | No access | No access | Full CRUD (if SSO edition allows) |
| **Tenant Branding** | No access | No access | No access | Full CRUD (if branding enabled) |
| **License Status View** | No access | No access | View summary | Full details + seat management |
| **Audit Logs** | No access | No access | View own actions | View all tenant audit logs |
| **Reports** | View standard reports | View + export standard reports | View + export + create custom reports | Full access + schedule reports |
| **Notifications** | Receive notifications | Receive + configure own preferences | Receive + configure + manage templates | Full access |
| **Administration Page** | No access | No access | No access | Full access to tenant admin sections |
| **Master Administration** | No access | No access | No access | No access (Superadmin only) |

### 4.2 Superadmin Capabilities (Outside License Tiers)

The Superadmin operates on the master tenant and is NOT bound by license tiers or seat counts:

| Capability | Superadmin |
|------------|------------|
| Create/delete/suspend tenants | Yes |
| Import license files | Yes |
| View all tenant license statuses | Yes |
| Manage Tenant License seat allocations | Yes |
| Access any tenant's data (cross-tenant) | Yes |
| Manage the master tenant's identity providers | Yes |
| View platform-wide audit logs | Yes |
| Perform initial setup (first boot wizard) | Yes |
| Manage their own profile | Yes |
| Access regular tenant features (Process Modeler, AI, etc.) | No -- Superadmin is for administration only |

### 4.3 Feature Gating Logic (Three-Layer)

Access to any feature requires passing three checks in order:

```
1. Application License Edition check
   -- Does the edition include this feature category?
   -- If NO --> Feature hidden platform-wide

2. Tenant License check
   -- Does this tenant's license enable this feature?
   -- Is the tenant license valid (not expired)?
   -- If NO --> Feature hidden for this tenant

3. User Tier check
   -- Does the user's seat tier grant access to this feature?
   -- If NO --> Feature hidden/disabled for this user
```

**Business Rules:**
- BR-150: All three layers must pass for a feature to be accessible
- BR-151: If the Application License Edition does not include a feature, no tenant or user can access it regardless of their tier
- BR-152: If a feature is hidden due to licensing, the UI must not show it at all (not show it disabled). The feature should be invisible, not grayed out.
- BR-153: Feature checks must be performant. Results should be computed at login and refreshed on license changes, not on every page load.

---

## 5. Seat Counting Rules

### 5.1 Counting Mechanics

| Rule | Description |
|------|-------------|
| One seat per user per tenant | A user occupies exactly one tier seat. A user cannot hold both a Power User and Contributor seat. |
| Mixed tiers allowed | A tenant can have a mix of tiers (e.g., 2 Tenant-Admin + 5 Power User + 20 Contributor + unlimited Viewer) |
| Seat consumed on assignment | The seat count increments when a user is assigned to a tier, not when they first log in |
| Seat freed on revocation | The seat count decrements when a user's tier assignment is revoked |
| Tier change = revoke + assign | Upgrading or downgrading a user's tier first frees the old seat, then claims the new one. Both tiers must be checked atomically. |
| Deactivated users hold seats | A deactivated (disabled) user still consumes a seat until explicitly revoked. This is intentional for temporary leaves of absence. |
| Deleted users free seats | When a user is deleted from the system, their seat is automatically freed. |

### 5.2 Seat Limit Enforcement

| Scenario | System Behavior |
|----------|-----------------|
| Assign user when tier has 0 available seats | Reject the assignment. Display message: "No available {tier} seats. {assigned}/{max} seats in use." |
| Assign user when tier has available seats | Accept assignment. Increment assigned count. |
| Assign user who already has a different tier | If target tier has availability: revoke old tier, assign new tier. If target tier is full: reject entirely (do not revoke old tier). |
| Bulk import users exceeding seat count | Accept up to seat limit, reject remainder. Report which users were assigned and which were rejected with reason. |
| Tenant License expires while users have seats | Users retain their seat records but cannot authenticate. When a new license is imported, existing seat assignments carry over if within the new seat limits. If seats exceed new limits, excess assignments enter a "pending review" state. |

### 5.3 Viewer Seat Handling

| Rule | Description |
|------|-------------|
| Unlimited Viewers | When Max Viewer Seats = 0 in the Tenant License, Viewer seats are unlimited |
| Capped Viewers | When Max Viewer Seats > 0, standard seat counting applies |
| Default for new users | When a new user is created without an explicit tier, they are NOT automatically assigned Viewer. A Tenant-Admin must explicitly assign a tier. |

### 5.4 Master Tenant Superadmin and Seat Counting

| Rule | Description |
|------|-------------|
| Superadmin does not consume seats | The master tenant superadmin account is system-provisioned and does not count against any Tenant License seat allocation |
| Master tenant has no Tenant License requirement | The master tenant itself does not need a Tenant License. It exists outside the licensing model for platform administration only. |
| Master tenant users (if any beyond superadmin) | If additional users are created on the master tenant (e.g., for support), they would need a Tenant License for the master tenant. However, by default, the master tenant has only the superadmin. |

---

## 6. Master Tenant vs Regular Tenant Boundary

### 6.1 Capability Comparison

| Capability | Master Tenant Superadmin | Regular Tenant Admin (Tenant-Admin tier) |
|------------|--------------------------|------------------------------------------|
| Create new tenants | Yes | No |
| Delete/suspend tenants | Yes | No |
| Import license files | Yes | No |
| View all tenant license statuses | Yes | Only own tenant |
| Assign/revoke seat tiers for own tenant | No (delegates to Tenant-Admins) | Yes |
| Manage own tenant's identity providers | Yes (master tenant IdP) | Yes (own tenant IdP, if SSO edition allows) |
| Access cross-tenant data | Yes (SUPER_ADMIN role) | No (tenant isolation enforced) |
| Manage own tenant's users | Yes (master tenant users only) | Yes (own tenant users only) |
| Configure platform-wide settings | Yes | No |
| View platform-wide audit logs | Yes | No (own tenant logs only) |
| Access Process Modeler / Products / AI | No -- Superadmin is administration only | Yes, per license tier |
| Login method | Username + password (LOCAL provider) | Per tenant's configured auth providers |

### 6.2 Superadmin Account Lifecycle

| Phase | Behavior |
|-------|----------|
| **First Boot** | System creates the master tenant ("tenant-master") and prompts for superadmin credentials. The superadmin account is created in Keycloak's master realm with SUPER_ADMIN role. |
| **Initial Setup** | Superadmin imports the Application License file, creates the first regular tenant(s), and assigns initial Tenant Licenses. |
| **Ongoing Operations** | Superadmin remains active for tenant management, license renewal, and platform oversight. The account is always accessible. |
| **Day-to-Day Usage** | Regular users do NOT see or interact with the master tenant. It is hidden from the tenant selection UI for non-superadmin users. |
| **Password Management** | Superadmin password follows the same security rules as any other user. MFA is strongly recommended but not enforced by default (first-boot convenience). |
| **Deactivation** | The superadmin account CANNOT be deactivated or deleted (the master tenant is protected, and the superadmin is the only user with SUPER_ADMIN role). |

### 6.3 Master Tenant Visibility

| Context | Visible? |
|---------|----------|
| Login screen tenant selection | Only if user enters credentials matching the master tenant's domain |
| Administration > Tenant Manager | Visible as a protected, non-deletable entry |
| Tenant License list | Not listed (master tenant has no Tenant License) |
| Cross-tenant user search | Not visible to regular tenant admins |
| Audit logs | Master tenant actions visible only to Superadmin |

**Business Rules:**
- BR-160: The master tenant is created automatically at first boot and cannot be recreated
- BR-161: The master tenant is always type=MASTER, isProtected=true, and cannot transition to any other type
- BR-162: SUPER_ADMIN role is exclusively assignable to users on the master tenant
- BR-163: The Superadmin account cannot be deleted or deactivated
- BR-164: After initial setup, the Superadmin remains active. There is no "setup-only then disable" behavior.
- BR-165: The master tenant does not consume a slot against the Application License's Max Tenants limit

---

## 7. Login Flow with Auth Method Selection

### 7.1 Login Screen Requirements

| Requirement | Description |
|-------------|-------------|
| Identifier field | Accepts email address OR username |
| Tenant resolution | System resolves the user's tenant from the identifier (email domain matching or explicit tenant selector) |
| Default auth method | Once tenant is resolved, the tenant's primary (default) authentication method is presented first |
| Alternative methods | Other enabled auth methods for the tenant are listed below the default form as secondary options |
| Auth method ordering | Auth methods are sorted by the sort_order attribute on the TenantAuthProvider entity |
| Superadmin login | The master tenant uses LOCAL (username + password) as its only auth method |

### 7.2 Auth Method Priority Rules

| Rule | Description |
|------|-------------|
| Primary method first | The TenantAuthProvider with isPrimary=true is shown as the main login form |
| Alternatives below | Non-primary enabled providers are shown as "Or sign in with..." options below the main form |
| Edition restriction | If the Application License Edition does not include SSO, only LOCAL auth is available regardless of tenant configuration |
| Tier restriction on SSO | SSO auth methods are available to all user tiers within a tenant. Auth method access is NOT restricted by user tier -- it is a tenant-level configuration. |
| Disabled providers hidden | TenantAuthProviders with isEnabled=false are not shown |

### 7.3 Identifier Resolution Flow

```
User enters identifier (email or username)
    |
    +-- If email format (contains @):
    |       |-- Extract domain from email
    |       |-- Look up TenantDomain where domain matches
    |       |-- If found: resolve to that tenant
    |       |-- If not found: show error "No tenant found for this email domain"
    |
    +-- If username format (no @):
    |       |-- Require explicit tenant selection (dropdown or subdomain)
    |       |-- Look up user by username within the selected tenant
    |
    +-- Once tenant resolved:
            |-- Fetch tenant's enabled auth providers (sorted by sort_order)
            |-- Present primary provider as main form
            |-- List alternatives below
```

### 7.4 Auth Methods vs License Tiers

| Auth Method Type | Standard Edition | Professional Edition | Enterprise Edition |
|-----------------|------------------|----------------------|--------------------|
| LOCAL (username + password) | Yes | Yes | Yes |
| OIDC (Azure AD, etc.) | No | Yes | Yes |
| SAML | No | Yes | Yes |
| LDAP | No | Yes | Yes |
| UAE Pass | No | Yes | Yes |

**Business Rules:**
- BR-170: All tiers of users within a tenant use the same auth methods. Auth method is a tenant-level, not user-level, decision.
- BR-171: The LOCAL provider is always available regardless of edition (it is the fallback)
- BR-172: If a tenant has configured an external SSO provider but the Application License is downgraded to Standard, the SSO provider becomes disabled and users fall back to LOCAL
- BR-173: The login screen must support both left-to-right (LTR) and right-to-left (RTL) layouts for Arabic support
- BR-174: Username login requires a tenant context (subdomain, dropdown, or prior resolution) because usernames are only unique within a tenant, not globally

---

## 8. User Stories

### US-003a: Application License Activation

**As a** Superadmin
**I want** to import a license file during first boot or from the administration page
**So that** the EMSIST platform is activated for my organization with the correct edition and tenant limits

#### Acceptance Criteria

**AC-1: First Boot License Import (Main Scenario)**

**Given** the EMSIST platform has been installed for the first time and no Application License exists
**When** the Superadmin navigates to the first-boot wizard
**Then** the system displays a "License Activation" step with a file upload area
**And** the file upload area accepts files with extension .lic or .json
**And** a text field is available for pasting a license key string as an alternative to file upload

**AC-2: Valid License File Accepted**

**Given** the Superadmin uploads a license file
**When** the file has a valid cryptographic signature AND the Installation Identifier matches AND the Valid From date is not in the future
**Then** the system displays the license details: Customer Name, Edition, Max Tenants, Valid From, Valid Until, and the list of included Tenant Licenses with their seat allocations
**And** the Superadmin is prompted to confirm activation with a "Activate License" button
**And** upon confirmation, the Application License status is set to Active

**AC-3: Invalid Signature Rejected**

**Given** the Superadmin uploads a license file
**When** the cryptographic signature is invalid or the file has been tampered with
**Then** the system displays an error message: "Invalid license file. The file signature could not be verified. Please contact your vendor."
**And** the license is NOT activated
**And** an audit log entry is created with category "LICENSE" and action "ACTIVATION_FAILED" and reason "INVALID_SIGNATURE"

**AC-4: Wrong Installation Rejected**

**Given** the Superadmin uploads a license file meant for a different installation
**When** the Installation Identifier in the file does not match the current installation's identifier
**Then** the system displays an error message: "This license file is intended for a different installation. Expected: {current-id}, Found: {file-id}."
**And** the license is NOT activated

**AC-5: Expired License Rejected at Activation**

**Given** the Superadmin uploads a license file
**When** the Valid Until date is in the past
**Then** the system displays an error message: "This license has expired on {Valid Until}. Please request a renewed license from your vendor."
**And** the license is NOT activated

**AC-6: License Replacement (Existing License)**

**Given** an Application License is already active
**When** the Superadmin navigates to Administration > License Management and uploads a new license file
**Then** the system displays a comparison: current license details vs new license details, highlighting changes (edition change, seat count changes, validity period changes)
**And** the Superadmin is prompted to confirm with "Replace License"
**And** upon confirmation, the old license is archived and the new license becomes active
**And** an audit log entry is created with action "LICENSE_REPLACED"

**AC-7: Installation Identifier Display**

**Given** the Superadmin navigates to Administration > License Management
**When** the page loads
**Then** the Installation Identifier is displayed prominently (for sending to the vendor when requesting a license file)
**And** a "Copy to Clipboard" button is available next to the identifier

#### Business Rules
- BR-100, BR-101, BR-102, BR-103, BR-104, BR-105, BR-130, BR-131, BR-132, BR-133

#### Priority
Must Have

#### Dependencies
- First-boot wizard infrastructure (US-003g)
- Cryptographic validation capability in license-service

---

### US-003b: Tenant License Provisioning

**As a** Superadmin
**I want** to view and manage the tenant licenses included in the imported license file
**So that** I can activate tenants with their correct seat allocations

#### Acceptance Criteria

**AC-1: Tenant Licenses Displayed After Import (Main Scenario)**

**Given** the Superadmin has successfully imported an Application License
**When** the Superadmin navigates to Administration > Tenant Manager
**Then** each tenant listed shows its license status: Active, Expired, or "No License"
**And** each licensed tenant shows a summary: "{assigned}/{max} seats per tier"

**AC-2: Tenant License Details View**

**Given** the Superadmin clicks on a tenant in the Tenant Manager
**When** the tenant detail panel opens
**Then** a "License" tab shows: Tenant License status, Valid From, Valid Until, and a table of seat tiers:

| Tier | Max Seats | Assigned | Available |
|------|-----------|----------|-----------|
| Tenant-Admin | {max} | {assigned} | {available} |
| Power User | {max} | {assigned} | {available} |
| Contributor | {max} | {assigned} | {available} |
| Viewer | {max or "Unlimited"} | {assigned} | {available or "Unlimited"} |

**AC-3: Auto-Activation on License Import**

**Given** the Application License file includes Tenant Licenses for tenants that already exist in the system
**When** the license is imported and activated
**Then** the matching Tenant Licenses are automatically applied to the existing tenants (matched by Tenant Identifier)
**And** tenants that exist in the license but not in the system are shown as "Pending Creation" with a "Create Tenant" action

**AC-4: License for Non-Existent Tenant**

**Given** the Application License file includes a Tenant License for tenant identifier "tenant-acme"
**When** no tenant with identifier "tenant-acme" exists in the system
**Then** the system displays a notice: "Tenant 'tenant-acme' is licensed but does not yet exist. Create it?"
**And** a "Create Tenant" button is available to provision the tenant with pre-filled license details

**AC-5: Empty State -- No Tenant Licenses**

**Given** the Application License has been imported but includes zero Tenant Licenses
**When** the Superadmin navigates to Tenant Manager
**Then** the system displays: "No tenants are licensed. Please import an updated license file that includes tenant allocations."

#### Business Rules
- BR-110, BR-111, BR-112, BR-113, BR-114, BR-115, BR-165

#### Priority
Must Have

#### Dependencies
- US-003a (Application License Activation)
- Tenant Manager UI

---

### US-003c: User Tier License Assignment

**As a** Tenant-Admin
**I want** to assign users to license tiers (Tenant-Admin, Power User, Contributor, Viewer)
**So that** each user has the appropriate level of access to platform features

#### Acceptance Criteria

**AC-1: Assign User to Tier (Main Scenario)**

**Given** the Tenant-Admin navigates to their tenant's User Management page
**And** the tenant has a valid Tenant License with available seats in the "Contributor" tier
**When** the Tenant-Admin selects a user who currently has no tier assigned and clicks "Assign License Tier"
**Then** a dialog presents the available tiers with current availability:

| Tier | Available Seats |
|------|-----------------|
| Tenant-Admin | {n} of {max} |
| Power User | {n} of {max} |
| Contributor | {n} of {max} |
| Viewer | {n} of {max or "Unlimited"} |

**And** the Tenant-Admin selects "Contributor" and confirms
**And** the user is assigned the Contributor tier, the assigned seat count increments, and the user receives the USER role in Keycloak

**AC-2: No Available Seats**

**Given** the "Power User" tier has 5 max seats and 5 assigned seats
**When** the Tenant-Admin attempts to assign another user to the Power User tier
**Then** the "Power User" row in the tier selection dialog is disabled with the message "No seats available (5/5)"
**And** the Tenant-Admin cannot select it

**AC-3: Change User Tier (Upgrade)**

**Given** a user is currently assigned the "Contributor" tier
**And** the "Power User" tier has available seats
**When** the Tenant-Admin selects "Change Tier" on the user and selects "Power User"
**Then** the system atomically revokes the Contributor seat and assigns a Power User seat
**And** the user's Keycloak role is changed from USER to MANAGER
**And** the Contributor assigned count decrements by 1 and the Power User assigned count increments by 1

**AC-4: Change User Tier (Target Full)**

**Given** a user is currently assigned the "Contributor" tier
**And** the "Power User" tier has 0 available seats
**When** the Tenant-Admin attempts to change the user's tier to "Power User"
**Then** the system rejects the change: "Cannot change tier: Power User has no available seats (5/5)."
**And** the user retains their Contributor tier (no partial change)

**AC-5: Revoke User Tier**

**Given** a user is assigned the "Contributor" tier
**When** the Tenant-Admin clicks "Revoke License" on the user and confirms the action
**Then** the user's tier assignment is removed, the assigned seat count decrements, and the user's Keycloak role (USER) is removed
**And** the user can no longer access licensed features but their account remains in the system

**AC-6: Bulk Assignment**

**Given** the Tenant-Admin selects multiple users (checkbox selection) who have no tier
**When** the Tenant-Admin clicks "Assign Tier to Selected" and chooses "Viewer"
**Then** the system assigns each selected user the Viewer tier up to the available seat limit
**And** if 10 users are selected but only 7 Viewer seats remain, 7 are assigned and 3 are rejected
**And** a summary is shown: "7 users assigned to Viewer. 3 users could not be assigned: no available seats."

**AC-7: Permissions -- Only Tenant-Admin Can Assign**

**Given** a user with the "Contributor" tier (USER role) navigates to User Management
**When** the page loads
**Then** the "Assign License Tier", "Change Tier", and "Revoke License" buttons are NOT visible (the user lacks the ADMIN role required for these actions)

#### Business Rules
- BR-120, BR-121, BR-122, BR-123, BR-124, BR-125, BR-140, BR-141, BR-142, BR-143, BR-144

#### Priority
Must Have

#### Dependencies
- US-003b (Tenant License Provisioning)
- User Management page
- Keycloak role synchronization in auth-facade

---

### US-003d: License Renewal (Offline)

**As a** Superadmin
**I want** to renew the platform license by importing a new license file
**So that** the platform and tenants continue to function beyond the original expiry date without requiring internet connectivity

#### Acceptance Criteria

**AC-1: Renew Before Expiry (Main Scenario)**

**Given** the current Application License is active with Valid Until = 2027-03-01
**And** the Superadmin obtains a new license file from the vendor with Valid Until = 2028-03-01
**When** the Superadmin navigates to Administration > License Management and uploads the new file
**Then** the system displays a comparison:
  - Current: Valid until 2027-03-01
  - New: Valid until 2028-03-01
**And** the Superadmin confirms the replacement
**And** the new license becomes active with the extended validity
**And** all existing tenant licenses and seat assignments are preserved if the new file includes the same tenants

**AC-2: Renew During Grace Period**

**Given** the Application License has expired and the system is in grace period (read-only mode)
**When** the Superadmin imports a renewed license file
**Then** the system exits grace period and returns to full Active status
**And** all users regain full read-write access immediately

**AC-3: Seat Count Changes on Renewal**

**Given** the current Tenant License for "tenant-acme" has 10 Power User seats, all 10 assigned
**And** the new license file reduces Power User seats for "tenant-acme" to 8
**When** the Superadmin imports the new license
**Then** the system displays a warning: "Tenant 'tenant-acme' has 10 Power User seats assigned but the new license allows only 8. 2 seats are over-allocated."
**And** the Superadmin must choose: "Accept and require Tenant-Admin to resolve" or "Cancel import"
**And** if accepted, the over-allocated seats are flagged as "Pending Review" for the Tenant-Admin

**AC-4: Tenant Removed from Renewal**

**Given** the current license includes tenants "acme" and "globex"
**And** the new license file includes only "acme"
**When** the Superadmin imports the new license
**Then** the system warns: "Tenant 'globex' is not included in the new license. Its license will be revoked."
**And** the Superadmin must confirm before proceeding

#### Business Rules
- BR-100, BR-101, BR-103, BR-104, BR-132, BR-133

#### Priority
Must Have

#### Dependencies
- US-003a (Application License Activation)

---

### US-003e: License Expiry and Grace Period

**As a** platform user
**I want** the system to degrade gracefully when the license expires
**So that** my data is not lost and I have time to renew

#### Acceptance Criteria

**AC-1: Active License (Main Scenario -- Happy Path)**

**Given** the Application License is Active and the current date is before Valid Until
**When** any user logs in and accesses the platform
**Then** the platform operates normally with full read-write access per the user's license tier

**AC-2: 30-Day Warning**

**Given** the Application License Valid Until is within 30 days of the current date
**When** the Superadmin logs in
**Then** a persistent banner is displayed: "License expires in {N} days on {Valid Until}. Please renew."
**And** the banner includes a link to Administration > License Management

**AC-3: 7-Day Warning to All Admins**

**Given** the Application License Valid Until is within 7 days
**When** any user with the Tenant-Admin tier or SUPER_ADMIN role logs in
**Then** a warning banner is displayed: "Platform license expires in {N} days. Contact your administrator."

**AC-4: Expired -- Grace Period Active**

**Given** the Application License has passed its Valid Until date
**And** the Grace Period Days is 30
**When** any user logs in during the grace period
**Then** the platform is in read-only mode: users can view all data but cannot create, update, or delete
**And** a prominent banner states: "License expired. Platform is in read-only mode. {N} days remaining in grace period."

**AC-5: Grace Period Exhausted -- Platform Locked**

**Given** the grace period has also passed
**When** any user attempts to log in
**Then** the login is rejected with message: "Platform license has expired. Please contact your administrator."
**And** only the Superadmin can log in, and they see only the License Management page for importing a renewed license

**AC-6: Tenant License Expiry (Independent of Application)**

**Given** the Application License is Active
**But** a specific Tenant License for "tenant-acme" has expired
**When** a user belonging to "tenant-acme" attempts to log in
**Then** the login is rejected with message: "Your organization's license has expired. Please contact your administrator."
**And** users of other tenants are unaffected

#### Business Rules
- BR-104, BR-114

#### Priority
Must Have

#### Dependencies
- US-003a (Application License Activation)
- Expiry check scheduled job or login-time validation

---

### US-003f: License Status Dashboard

**As a** Superadmin or Tenant-Admin
**I want** to view a dashboard showing license status, seat utilization, and expiry information
**So that** I can manage seat capacity and plan for renewals proactively

#### Acceptance Criteria

**AC-1: Superadmin Dashboard (Main Scenario)**

**Given** the Superadmin navigates to Administration > License Management
**When** the page loads
**Then** a dashboard displays:
  - **Application License** card: Edition, Customer Name, Valid From, Valid Until, days remaining, Installation Identifier
  - **Tenant Overview** table: Tenant Name, License Status, Total Seats (all tiers), Assigned Seats, Utilization %, Expiry Date
  - **Platform Totals** summary: Total tenants licensed, total seats across all tenants, total seats assigned

**AC-2: Tenant-Admin Dashboard**

**Given** a Tenant-Admin navigates to their tenant's Administration > License section
**When** the page loads
**Then** they see only their own tenant's license details:
  - License status, Valid From, Valid Until
  - Seat utilization table by tier (same format as AC-2 in US-003b)

**AC-3: Pagination for Tenant List**

**Given** the platform has more than 20 licensed tenants
**When** the Superadmin views the Tenant Overview table
**Then** the table is paginated with 20 rows per page
**And** pagination controls (first, previous, page numbers, next, last) are shown below the table

**AC-4: Sorting**

**Given** the Superadmin views the Tenant Overview table
**When** the Superadmin clicks on a column header (e.g., "Utilization %")
**Then** the table sorts by that column in ascending order
**And** clicking again toggles to descending order

**AC-5: Filtering**

**Given** the Superadmin views the Tenant Overview table
**When** the Superadmin enters a search term in the filter field
**Then** the table filters to show only tenants whose name contains the search term

**AC-6: Empty State -- No License**

**Given** no Application License has been imported
**When** the Superadmin navigates to License Management
**Then** the page shows: "No license activated. Import a license file to get started." with a file upload area

**AC-7: Export License Report**

**Given** the Superadmin views the License Management dashboard
**When** the Superadmin clicks "Export Report"
**Then** a CSV file is downloaded containing: Tenant Name, License Status, Tier, Max Seats, Assigned Seats, Available Seats, Valid Until

#### Business Rules
- BR-100, BR-105, BR-150

#### Priority
Should Have

#### Dependencies
- US-003a (Application License Activation)
- US-003b (Tenant License Provisioning)

---

### US-003g: Master Tenant Superadmin Lifecycle

**As a** system installer
**I want** the master tenant and superadmin account to be created during first boot
**So that** the platform can be administered from the very first use

#### Acceptance Criteria

**AC-1: First Boot Wizard (Main Scenario)**

**Given** the EMSIST platform is started for the first time (no existing database state)
**When** the installer navigates to the platform URL
**Then** the system presents a first-boot wizard with the following steps:
  1. **Welcome** -- Platform introduction and prerequisites check
  2. **Superadmin Credentials** -- Create the superadmin username (default: "superadmin") and password (minimum 12 characters, must include uppercase, lowercase, digit, special character)
  3. **License Activation** -- Upload the Application License file (see US-003a)
  4. **Summary** -- Confirm settings and complete setup
**And** the wizard cannot be re-entered after completion

**AC-2: Master Tenant Auto-Created**

**Given** the first-boot wizard completes step 2 (Superadmin Credentials)
**When** setup finishes
**Then** the master tenant is created with:
  - id: "tenant-master"
  - tenantType: MASTER
  - isProtected: true
  - status: ACTIVE
  - Only LOCAL auth provider configured

**AC-3: Superadmin Account Created in Keycloak**

**Given** the first-boot wizard completes step 2
**When** the account is provisioned
**Then** a user is created in Keycloak with:
  - Username: as entered by installer
  - Role: SUPER_ADMIN
  - Realm: master tenant's realm
  - Temporary password: false (password is final)
**And** the user is stored in the auth-facade graph with SUPER_ADMIN role relationship

**AC-4: Superadmin Cannot Be Deleted**

**Given** the Superadmin is logged in
**When** the Superadmin navigates to User Management for the master tenant
**Then** the superadmin's account row shows a lock icon and the "Delete" action is disabled
**And** hovering over the lock shows tooltip: "System account. Cannot be deleted."

**AC-5: Subsequent Boots Skip Wizard**

**Given** the first-boot wizard has been completed previously
**When** the platform is restarted
**Then** the system boots directly to the login page (no wizard)

#### Business Rules
- BR-160, BR-161, BR-162, BR-163, BR-164

#### Priority
Must Have

#### Dependencies
- Keycloak realm provisioning
- Database migration for master tenant

---

### US-003h: Login Flow with Auth Method Selection

**As a** user
**I want** to log in using my email or username with my tenant's preferred authentication method
**So that** I can access the platform using my organization's identity system

#### Acceptance Criteria

**AC-1: Email Login with Domain Resolution (Main Scenario)**

**Given** the user navigates to the EMSIST login page
**When** the user enters their email address "john@acme.com" in the identifier field
**Then** the system resolves the tenant by matching the domain "acme.com" to a TenantDomain record
**And** the tenant's primary (isPrimary=true) auth method is displayed as the main login form (e.g., "Sign in with Azure AD" button)
**And** alternative enabled auth methods are listed below: "Or sign in with: Local Password, LDAP"

**AC-2: Username Login with Tenant Selection**

**Given** the user navigates to the login page
**When** the user enters a username (no @ character) "john.doe"
**Then** the system presents a tenant selector (dropdown of available tenants)
**And** once a tenant is selected, the tenant's auth methods are displayed as in AC-1

**AC-3: Default Auth Method Shown First**

**Given** the tenant "acme" has three auth providers:
  - Azure AD (isPrimary=true, sortOrder=1)
  - LDAP (isPrimary=false, sortOrder=2)
  - LOCAL (isPrimary=false, sortOrder=3)
**When** the tenant is resolved
**Then** Azure AD is shown as the main login action (large button)
**And** LDAP and LOCAL are shown as secondary options below, sorted by sortOrder

**AC-4: Fallback to LOCAL Only**

**Given** the tenant's Application License is Standard edition (no SSO)
**But** the tenant has Azure AD configured
**When** the user enters their email and the tenant is resolved
**Then** only the LOCAL password form is shown (Azure AD is suppressed due to edition restriction)

**AC-5: Invalid Email Domain**

**Given** the user enters "john@unknowndomain.com"
**When** no TenantDomain record matches "unknowndomain.com"
**Then** the system displays: "We could not find an organization for this email domain. Please check your email or select your organization manually."
**And** a "Select Organization" link is provided to switch to manual tenant selection

**AC-6: RTL (Arabic) Layout Support**

**Given** the user's browser locale is set to Arabic (ar)
**When** the login page renders
**Then** the entire layout is mirrored for right-to-left reading
**And** form labels, placeholders, error messages, and auth method descriptions are in Arabic (if translations exist)
**And** the identifier field text input direction is LTR (for email addresses and usernames)

**AC-7: Tenant Suspended**

**Given** the tenant "acme" has status=SUSPENDED
**When** the user enters "john@acme.com"
**Then** the system displays: "Your organization's access has been suspended. Please contact your administrator."
**And** no auth methods are shown

#### Business Rules
- BR-170, BR-171, BR-172, BR-173, BR-174

#### Priority
Must Have

#### Dependencies
- TenantDomain entity with domain-to-tenant mapping
- AuthProviderType enum (already exists: LOCAL, AZURE_AD, SAML, OIDC, LDAP, UAEPASS)

---

### US-003i: Seat Limit Enforcement

**As a** system
**I want** to enforce seat limits in real time during user-to-tier assignment
**So that** tenant administrators cannot over-allocate seats beyond their license

#### Acceptance Criteria

**AC-1: Real-Time Availability Check (Main Scenario)**

**Given** the Tenant-Admin opens the "Assign License Tier" dialog for a user
**When** the dialog loads
**Then** the current seat availability per tier is fetched from the license-service and displayed in real time
**And** tiers with 0 available seats are visually disabled (grayed out, not clickable)

**AC-2: Concurrent Assignment Race Condition**

**Given** two Tenant-Admins simultaneously attempt to assign the last available Power User seat
**When** both submit at the same time
**Then** only one assignment succeeds (enforced by optimistic locking on the TenantLicenseEntity version field)
**And** the second Tenant-Admin receives: "Seat assignment failed: another administrator just assigned the last available Power User seat. Please refresh and try again."

**AC-3: Seat Count Consistency After Error**

**Given** a seat assignment fails mid-transaction (e.g., Keycloak role assignment fails after seat count increment)
**When** the error occurs
**Then** the entire transaction is rolled back: seat count returns to its pre-assignment value
**And** the user is NOT left in a partially-assigned state

**AC-4: Login-Time Seat Validation**

**Given** a user has an assigned tier
**When** the user logs in
**Then** the seat validation service verifies the user has an active seat assignment in a valid (non-expired) Tenant License
**And** if the seat is valid, login proceeds and the user's feature set is computed based on their tier
**And** if the seat is revoked or the license is expired, the user is denied access

#### Business Rules
- BR-120, BR-121, BR-122

#### Priority
Must Have

#### Dependencies
- Optimistic locking on TenantLicenseEntity (already implemented via @Version)
- SeatValidationService (already implemented)

---

### US-003j: Feature Gate by License Tier

**As a** platform user
**I want** the system to show or hide features based on my license tier
**So that** I only see features I am entitled to use

#### Acceptance Criteria

**AC-1: Feature Visibility at Login (Main Scenario)**

**Given** a user with the "Contributor" tier logs in
**When** the frontend loads
**Then** the navigation menu shows only features available to the Contributor tier (see Feature Matrix Section 4.1)
**And** features not available (e.g., Administration, Identity Provider Config) are NOT rendered in the navigation

**AC-2: Application Edition Gate**

**Given** the Application License is Standard edition (no AI features)
**And** a user with "Power User" tier logs in
**When** the navigation menu loads
**Then** the "AI Assistant" menu item is NOT shown (even though Power User tier normally includes it) because the edition does not support it

**AC-3: Feature Check Endpoint**

**Given** the frontend needs to check if a specific feature is available
**When** the frontend calls the feature-gate check for feature key "ai_persona"
**Then** the response indicates whether the feature is available (considering all three layers: edition, tenant license, user tier)
**And** the response is cached to avoid repeated checks on every page navigation

**AC-4: Graceful Degradation for Direct URL Access**

**Given** a user with "Viewer" tier directly navigates to a URL for a feature they do not have (e.g., /admin/identity-providers)
**When** the page attempts to load
**Then** the system redirects to a "Feature Not Available" page with the message: "This feature is not included in your current license. Contact your administrator for access."
**And** an audit log entry is created for the unauthorized feature access attempt

**AC-5: Feature Set Refresh on Tier Change**

**Given** a user is logged in with the "Contributor" tier
**And** a Tenant-Admin upgrades the user to "Power User" while the user is logged in
**When** the user refreshes the page or navigates to a new section
**Then** the user's feature set is re-evaluated and the navigation updates to reflect the Power User tier capabilities

#### Business Rules
- BR-150, BR-151, BR-152, BR-153

#### Priority
Must Have

#### Dependencies
- FeatureGateService (already implemented)
- Frontend navigation guard tied to feature-gate checks

---

## 9. Business Rules Catalog

| ID | Rule | Entities Affected | Priority |
|----|------|-------------------|----------|
| BR-100 | Exactly one Application License may be active per installation | Application License | Must Have |
| BR-101 | License file must be cryptographically signed; tampered files are rejected | Application License, License File | Must Have |
| BR-102 | Installation Identifier is generated once at first boot and is immutable | Application License | Must Have |
| BR-103 | License file is bound to a specific Installation Identifier | Application License, License File | Must Have |
| BR-104 | Expired Application License triggers grace period (read-only), then lockout | Application License | Must Have |
| BR-105 | Application License Edition governs platform-wide feature availability | Application License | Must Have |
| BR-110 | Tenant cannot be activated without a valid Tenant License | Tenant, Tenant License | Must Have |
| BR-111 | Tenant License validity must fall within Application License validity | Tenant License, Application License | Must Have |
| BR-112 | Sum of all tenant seat allocations cannot exceed edition limits | Tenant License, Application License | Should Have |
| BR-113 | Each Tenant License must include at least 1 Tenant-Admin seat | Tenant License | Must Have |
| BR-114 | Expired Tenant License blocks new logins for that tenant's users | Tenant License, User | Must Have |
| BR-115 | Max Viewer Seats = 0 means unlimited Viewer seats | Tenant License | Must Have |
| BR-120 | A user holds at most one seat tier per tenant | User Tier License | Must Have |
| BR-121 | Seat count increments on assignment, decrements on revocation | User Tier License, Tenant License | Must Have |
| BR-122 | Assignment is rejected when tier is at max capacity | User Tier License, Tenant License | Must Have |
| BR-123 | Revoking a seat does not delete the user account | User Tier License, User | Must Have |
| BR-124 | Tier change is atomic: revoke old + assign new | User Tier License | Must Have |
| BR-125 | Master tenant superadmin does not consume a seat | User Tier License, Superadmin | Must Have |
| BR-130 | License file is verified using embedded vendor public key (no network) | License File | Must Have |
| BR-131 | License validation is fully offline | License File | Must Have |
| BR-132 | Re-importing a license file replaces the previous one | License File, Application License | Must Have |
| BR-133 | System retains history of imported license files for audit | License File | Should Have |
| BR-140 | Tier name (business) maps to role name (system); they are linked | User Tier License, Role | Must Have |
| BR-141 | SUPER_ADMIN is not a license tier | Role | Must Have |
| BR-142 | Role inheritance applies to tier-mapped roles | Role | Must Have |
| BR-143 | Revoking a tier removes the corresponding Keycloak role | User Tier License, Role | Must Have |
| BR-144 | License tier is the single source of truth for user role assignment | User Tier License, Role | Must Have |
| BR-150 | All three license layers must pass for feature access | Application License, Tenant License, User Tier License | Must Have |
| BR-151 | Edition restriction overrides all lower layers | Application License | Must Have |
| BR-152 | Unlicensed features are hidden (not disabled) in the UI | Feature Gate | Must Have |
| BR-153 | Feature checks are cached; computed at login, refreshed on license change | Feature Gate | Should Have |
| BR-160 | Master tenant is auto-created at first boot and cannot be recreated | Tenant | Must Have |
| BR-161 | Master tenant is type=MASTER, isProtected=true, immutable type | Tenant | Must Have |
| BR-162 | SUPER_ADMIN role is exclusive to master tenant users | Role, Tenant | Must Have |
| BR-163 | Superadmin account cannot be deleted or deactivated | User (Superadmin) | Must Have |
| BR-164 | Superadmin remains active after initial setup (no "setup-only" mode) | User (Superadmin) | Must Have |
| BR-165 | Master tenant does not count against Max Tenants limit | Tenant, Application License | Must Have |
| BR-170 | Auth methods are tenant-level, not user-level | Tenant, Auth Provider | Must Have |
| BR-171 | LOCAL auth provider is always available regardless of edition | Auth Provider, Application License | Must Have |
| BR-172 | Edition downgrade disables SSO providers; users fall back to LOCAL | Auth Provider, Application License | Must Have |
| BR-173 | Login screen supports RTL layout for Arabic | Login Flow | Must Have |
| BR-174 | Username login requires tenant context (usernames are unique per tenant only) | Login Flow, User | Must Have |

---

## 10. Data Models (Business View)

### 10.1 Application License

| Attribute Name | Business Meaning | Required | Validation Rules |
|----------------|------------------|----------|------------------|
| License Key | Unique vendor-issued identifier | Yes | Format: UUID or vendor-specific format |
| Customer Name | Organization that purchased the license | Yes | Max 255 characters |
| Installation Identifier | Hardware/environment fingerprint | Yes | Generated at first boot; read-only after |
| Edition | Platform edition | Yes | Standard, Professional, or Enterprise |
| Max Tenants | Maximum number of regular tenants | Yes | Positive integer, minimum 1 |
| Valid From | License start date | Yes | Date; cannot be in the future at import time |
| Valid Until | License end date | Yes | Date; must be after Valid From |
| Grace Period Days | Read-only days after expiry | Yes | Integer 0-365; default 30 |
| Status | Operational state | Yes | Active, Expired, Grace, Revoked |
| Issued At | When the vendor generated the file | Yes | Timestamp |
| Signature | Cryptographic signature | Yes | Verified against embedded public key |

**Tenant Scope:** Global

### 10.2 Tenant License

| Attribute Name | Business Meaning | Required | Validation Rules |
|----------------|------------------|----------|------------------|
| Tenant Identifier | Target tenant | Yes | Must match existing or pending tenant |
| Tenant Display Name | Human-readable name | Yes | Max 255 characters |
| Valid From | Tenant license start | Yes | Within Application License range |
| Valid Until | Tenant license end | Yes | Within Application License range |
| Max Tenant-Admin Seats | Tenant-Admin seat cap | Yes | Positive integer, minimum 1 |
| Max Power User Seats | Power User seat cap | Yes | Non-negative integer |
| Max Contributor Seats | Contributor seat cap | Yes | Non-negative integer |
| Max Viewer Seats | Viewer seat cap (0=unlimited) | Yes | Non-negative integer |
| SSO Enabled | External IdP allowed | Yes | Boolean |
| Custom Branding Enabled | Branding customization allowed | Yes | Boolean |
| AI Features Enabled | AI capabilities allowed | Yes | Boolean |
| Status | Operational state | Yes | Active, Expired, Suspended |

**Tenant Scope:** Global (managed by Superadmin)

### 10.3 User Tier License (Seat Assignment)

| Attribute Name | Business Meaning | Required | Validation Rules |
|----------------|------------------|----------|------------------|
| User | Who holds the seat | Yes | Must be within the same tenant |
| Tier | Access level | Yes | Tenant-Admin, Power User, Contributor, or Viewer |
| Tenant License | Which license pool | Yes | Must be the user's tenant's active license |
| Assigned At | When the seat was granted | Yes | Timestamp; auto-set |
| Assigned By | Who granted the seat | Yes | Must be Tenant-Admin or Superadmin |
| Status | Seat state | Yes | Active or Revoked |

**Tenant Scope:** Tenant-Scoped

### 10.4 License File (Import History)

| Attribute Name | Business Meaning | Required | Validation Rules |
|----------------|------------------|----------|------------------|
| File Name | Original uploaded file name | Yes | Max 255 characters |
| File Hash | SHA-256 hash of the file content | Yes | For deduplication and audit |
| Imported At | When the file was imported | Yes | Timestamp |
| Imported By | Who imported the file | Yes | Must be Superadmin |
| License Key | Application License Key from the file | Yes | Links to Application License |
| Previous License Key | License key that was replaced (if any) | No | Null for first import |
| Result | Import outcome | Yes | Success, Failed-Signature, Failed-Installation, Failed-Expired |

**Tenant Scope:** Global

---

## 11. Glossary Updates

| Term | Definition |
|------|------------|
| Application License | The top-level entitlement that activates the entire EMSIST installation for a specific customer and hardware fingerprint |
| Tenant License | A sub-entitlement within the Application License that activates a specific tenant and defines its seat allocations |
| User Tier License | A seat assignment that grants an individual user access at a specific capability tier (Tenant-Admin, Power User, Contributor, Viewer) |
| Seat | A single user-tier allocation within a Tenant License. One seat = one user at one tier. |
| Edition | The Application License level (Standard, Professional, Enterprise) that determines platform-wide feature availability |
| Installation Identifier | A unique hardware/environment fingerprint generated at first boot, used to bind license files to a specific deployment |
| Grace Period | The number of days after license expiry during which the platform remains accessible in read-only mode |
| License File | A cryptographically signed document containing the full license hierarchy (Application + Tenant Licenses) |
| Air-Gapped | A deployment environment with no outbound internet connectivity |
| First-Boot Wizard | A one-time setup workflow that runs when the platform is started for the first time |

---

## 12. Impact Analysis: SaaS to On-Premise Migration

### 12.1 Existing Entities Affected

| Existing Entity/Concept | Change Required |
|--------------------------|-----------------|
| LicenseProductEntity (Starter, Pro, Enterprise) | **Replace** with Application License Edition concept. Products are no longer SaaS tiers with monthly/annual pricing. They become Editions baked into the license file. |
| TenantLicenseEntity | **Refactor** to represent on-premise Tenant Licenses from the license file instead of online subscriptions. Remove billing_cycle, auto_renew, monthly/annual pricing. Add per-tier seat caps. |
| UserLicenseAssignmentEntity | **Extend** to include explicit tier (Tenant-Admin, Power User, Contributor, Viewer) instead of a generic product reference. |
| LicenseFeatureEntity | **Keep** but features are now governed by Edition + Tenant License flags + User Tier rather than product-specific feature lists. |
| LicenseStatus enum (ACTIVE, EXPIRED, SUSPENDED) | **Extend** with GRACE state for the grace period. |
| TenantTier enum (FREE, STANDARD, PROFESSIONAL, ENTERPRISE) | **Align** with Application License Edition (Standard, Professional, Enterprise). Remove FREE (no free tier in on-premise). |
| SeatValidationService | **Extend** to validate against per-tier seat caps, not just generic seat counts. |
| FeatureGateService | **Extend** to implement three-layer check (Edition, Tenant License flags, User Tier). |

### 12.2 New Entities Required

| New Entity | Purpose |
|------------|---------|
| Application License | Top-level platform entitlement (does not exist today) |
| License File Import History | Audit trail of imported license files |
| Installation Identity | Generated-at-first-boot fingerprint |

### 12.3 Removed Concepts

| Removed | Reason |
|---------|--------|
| Monthly/Annual pricing | On-premise uses perpetual/term licenses, billing handled externally |
| Auto-renew toggle | No online billing; renewal is manual file import |
| Billing cycle | Not applicable to on-premise |
| SaaS product tiers (Starter, Pro, Enterprise as purchasable subscriptions) | Replaced by Edition concept embedded in license file |

---

## 13. Validation Rules Summary

### 13.1 License File Import Validation

| Check | Condition | Error Message |
|-------|-----------|---------------|
| Signature valid | File signature verified against vendor public key | "Invalid license file. The file signature could not be verified." |
| Installation match | File Installation ID = current Installation ID | "This license file is intended for a different installation." |
| Not expired | Valid Until >= current date | "This license has expired on {date}." |
| Valid date range | Valid Until > Valid From | "Invalid license: expiry date is before start date." |
| Edition recognized | Edition is Standard, Professional, or Enterprise | "Unrecognized license edition: {edition}." |
| Tenant count within limit | Number of Tenant Licenses <= Max Tenants | "License exceeds tenant limit: {count} tenants in file but edition allows {max}." |
| Each tenant has admin seat | Every Tenant License has Max Tenant-Admin Seats >= 1 | "Tenant '{name}' must have at least 1 Tenant-Admin seat." |

### 13.2 Seat Assignment Validation

| Check | Condition | Error Message |
|-------|-----------|---------------|
| Tenant license active | Tenant License status = Active | "Your organization's license is not active." |
| Seats available | Assigned seats for tier < Max seats for tier | "No available {tier} seats. {assigned}/{max} seats in use." |
| User not already assigned | User does not already hold a seat in any tier | "User already has a {current-tier} seat. Change tier instead." |
| Assigner authorized | Assigner has ADMIN or SUPER_ADMIN role | "You do not have permission to assign license tiers." |

---

## 14. Non-Functional Requirements (Business View)

| Requirement | Target | Rationale |
|-------------|--------|-----------|
| License validation must work fully offline | Zero network calls | Air-gapped deployments |
| License file import must complete within 5 seconds | 5s max | UX: superadmin should not wait |
| Seat assignment must complete within 2 seconds | 2s max | UX: tenant-admin assigns seats frequently |
| Feature gate check latency | < 50ms (cached) | Navigation responsiveness |
| License file size | < 1 MB | Reasonable for file transfer in air-gapped environments |
| Grace period must be configurable per license | 0-365 days | Vendor flexibility per customer contract |
| License import history must be retained indefinitely | No expiry | Audit compliance |

---

## Appendix A: Open Questions (Pending Stakeholder Validation)

| ID | Question | Context | Impact |
|----|----------|---------|--------|
| Q-LIC-01 | Should the license file format be JWS (JSON Web Signature) or a custom signed XML? | Affects license-service implementation | SA/DEV decision; BA recommends JWS for simplicity |
| Q-LIC-02 | What generates the Installation Identifier -- a hardware fingerprint (MAC, CPU ID) or a random UUID persisted at first boot? | Affects portability across hardware | Hardware fingerprint is more secure but less portable; UUID is simpler |
| Q-LIC-03 | Should "unlimited Viewer seats" be the default or must the vendor explicitly set 0 in the license file? | Affects vendor tooling | BA recommends explicit 0 = unlimited |
| Q-LIC-04 | Should there be a concept of "named users" vs "concurrent users" for seat counting? | Affects seat model complexity | Current model is named users (each user holds a permanent seat). Concurrent model would be more complex. |
| Q-LIC-05 | Can a Superadmin also be assigned a tier on a regular tenant (dual role: admin the platform + use features as a user on a specific tenant)? | Affects RBAC model | BA recommends NO -- Superadmin is strictly administrative. If the person needs user access, they should have a separate user account on the target tenant. |
| Q-LIC-06 | How is the license file delivered in air-gapped environments -- USB drive, secure file transfer, email? | Affects UX of import flow | Out of scope for the system (the system just imports a file; delivery is operational) |

---

## Appendix B: Relationship to Existing Requirements

| Existing Document | Relationship | Impact |
|-------------------|--------------|--------|
| RBAC-LICENSING-REQUIREMENTS.md | **Partially superseded** | SaaS billing model (monthly/annual pricing, auto-renew) is replaced by on-premise file import. RBAC role hierarchy and combined access resolution remain valid. |
| AUTH-PROVIDERS-REQUIREMENTS.md | **Complementary** | Auth provider requirements remain valid. This document adds edition-based restrictions on SSO availability. |
| GRAPH-PER-TENANT-REQUIREMENTS.md | **Unaffected** | Graph-per-tenant isolation is orthogonal to licensing model. |

---

*Document generated by BA Agent following BA-PRINCIPLES.md v1.0.0.*
*Next step: SA Agent transforms business objects to Canonical Data Model updates.*
*Stakeholder validation required before implementation.*
