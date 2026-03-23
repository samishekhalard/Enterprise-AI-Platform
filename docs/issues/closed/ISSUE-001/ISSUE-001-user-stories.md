# ISSUE-001: User Stories - Master Tenant Authentication, Superuser & User Management

| Field | Value |
|-------|-------|
| **Epic** | E-001: Authentication & Identity Management |
| **Business Objective** | BO-001: Enable master tenant administrators to manage identity providers and users through the admin UI |
| **Created** | 2026-02-26 |
| **Author** | BA Agent |
| **Status** | DRAFT - Pending Stakeholder Validation |
| **Parent Issue** | [ISSUE-001-master-tenant-auth-superuser.md](./ISSUE-001-master-tenant-auth-superuser.md) |

---

## Requirements Traceability

```
BO-001: Master Tenant Administration
  |
  +-- E-001: Authentication & Identity Management
      |
      +-- US-001a: Display Default Identity Provider
      +-- US-001b: Pre-configured Superuser for Local Development
      +-- US-001c: Superuser Authentication via Auth-Facade
      +-- US-001d: Users Tab on Tenant Detail Page
      +-- US-001e: User List with Roles, Status, and Details
```

---

## Dependency Map

```
US-001b (Keycloak superuser bootstrapping)
    |
    v
US-001c (Superuser login through auth-facade)
    |
    v
US-001a (Display identity providers -- requires valid auth token)
    |
    v
US-001d (Users tab on tenant detail page)
    |
    v
US-001e (User list with roles, email, status, last login)
```

**US-001b must be completed first.** Without a bootstrapped superuser in the identity provider, no downstream authentication or admin functionality can be verified.

---

## User Story: US-001a - Display Default Identity Provider on Local Authentication Tab

**As a** master tenant administrator
**I want** to see the default Keycloak identity provider on the Local Authentication tab
**So that** I can verify authentication is properly configured and manage provider settings

### Acceptance Criteria

**AC-1: Main Scenario (Happy Path) - Default provider is displayed**

```gherkin
Given the master tenant has a Keycloak provider configuration seeded by the V005 migration
  And the administrator is authenticated with ADMIN or SUPER_ADMIN role
  And the administrator navigates to the Master Tenant detail page
When the administrator selects the "Local Authentication" tab
  And the system fetches identity providers for tenant "master"
Then the "Identity Providers" section displays at least one provider card
  And the first provider card shows:
    | Field         | Value               |
    | Provider Name | KEYCLOAK            |
    | Display Name  | Master Keycloak     |
    | Protocol      | OIDC                |
    | Status        | Enabled             |
    | Priority      | 1                   |
  And no error banner is displayed on the page
```

**AC-2: Alternative Scenario - Multiple providers configured**

```gherkin
Given the master tenant has two or more identity provider configurations
  And the administrator is on the Local Authentication tab
When the provider list loads
Then providers are displayed ordered by priority (lowest number first)
  And each provider card shows the provider name, display name, protocol, and enabled status
```

**AC-3: Edge Case - Provider fetch returns empty result**

```gherkin
Given the master tenant exists but has no provider configurations in the identity graph
  And the administrator navigates to the Local Authentication tab
When the provider list loads
Then an empty state message is displayed: "No identity providers configured"
  And a prompt or action is shown to add a new provider
  And no 404 error banner is displayed
```

**AC-4: Error Handling - Network or service unavailable**

```gherkin
Given the auth-facade service is unreachable or returns an error
When the administrator navigates to the Local Authentication tab
  And the system attempts to fetch providers
Then a user-friendly error message is displayed explaining the service is temporarily unavailable
  And the error message does not expose internal details (no raw HTTP status codes or stack traces)
  And a retry action is available
```

**AC-5: Error Handling - 404 due to missing gateway route**

```gherkin
Given the gateway does not have a route for the admin provider endpoint
When the administrator's browser sends a request to the provider listing endpoint
Then the system must not display a raw "404 Not Found" error banner
  And instead the system displays a meaningful message such as "Unable to load identity providers"
```

**AC-6: Authorization - Insufficient permissions**

```gherkin
Given a user is authenticated with only the USER or VIEWER role
When the user attempts to access the identity provider listing
Then the system denies access with a "Forbidden" response
  And the provider list is not displayed
  And a message indicates the user lacks administrative privileges
```

**AC-7: Tenant ID Resolution**

```gherkin
Given the frontend sends the tenant identifier for the master tenant
When the system resolves the tenant for the provider lookup
Then the system correctly maps the tenant identifier to "master" in the identity graph
  And returns the provider configurations linked to the master tenant
```

### Business Rules

- BR-001: Only users with ADMIN or SUPER_ADMIN role may view identity provider configurations
- BR-002: The default Keycloak provider seeded by the system migration must not be deletable (it is the last-resort authentication method)
- BR-003: Providers must be displayed in ascending priority order (priority 1 = highest)
- BR-004: Sensitive configuration values (client secret, bind password) must be masked in the display
- BR-005: The master tenant must always have at least one enabled identity provider

### Data Model (Business View)

**Identity Provider Configuration**

| Attribute | Business Meaning | Required | Rules |
|-----------|------------------|----------|-------|
| Provider Name | Type of identity provider (e.g., KEYCLOAK) | Yes | System-defined values |
| Display Name | Human-readable label shown in UI | Yes | Max 100 characters |
| Protocol | Authentication protocol used | Yes | One of: OIDC, SAML, LDAP, OAUTH2 |
| Enabled | Whether this provider accepts logins | Yes | Boolean; default true |
| Priority | Display and fallback ordering | Yes | Integer; lower = higher priority |
| Client ID | OAuth/OIDC application identifier | Yes (OIDC) | Not displayed in full |
| Client Secret | OAuth/OIDC application secret | Yes (OIDC) | Always masked in display |

**Relationships:**

| Relationship | Related Entity | Cardinality | Description |
|--------------|----------------|-------------|-------------|
| Belongs to | Tenant | N:1 | Each config is scoped to exactly one tenant |
| Provided by | Provider | N:1 | Each config references a provider type |

**Tenant Scope:** Tenant-Scoped (configurations are per-tenant)

### Priority

**Must Have** -- The Local Authentication tab is already visible in the UI but non-functional. Displaying the provider is essential for administrators to verify and manage authentication settings. The current 404 error breaks the user experience.

### Dependencies

- US-001b (Keycloak superuser must exist to generate a valid auth token for the ADMIN-protected endpoint)
- US-001c (Administrator must be able to log in to access the admin UI)

### Definition of Done

- [ ] The Local Authentication tab on the master tenant detail page displays the default Keycloak provider card with correct details
- [ ] No 404 error banner appears when loading the tab
- [ ] Provider list is fetched successfully from the admin provider endpoint
- [ ] Sensitive fields (client secret) are masked in the response
- [ ] Empty state is shown when no providers exist
- [ ] Error state is shown when the backend is unavailable
- [ ] Users without ADMIN role cannot see the provider list
- [ ] Acceptance criteria AC-1 through AC-7 pass functional validation

---

## User Story: US-001b - Pre-configured Superuser in Keycloak for Local Development

**As a** developer
**I want** a pre-configured superuser account in Keycloak that is automatically provisioned on first startup
**So that** I can authenticate during local development without manual Keycloak configuration

### Acceptance Criteria

**AC-1: Main Scenario (Happy Path) - Superuser exists after fresh startup**

```gherkin
Given the local development environment is started for the first time (clean state)
  And the identity provider container starts with a bootstrapped realm configuration
When the developer inspects the identity provider admin console
Then an application realm named "master" (or the designated realm) contains:
    | Configuration   | Value                          |
    | Client          | ems-client                     |
    | Grant Type      | Direct Access Grants enabled   |
    | Redirect URIs   | http://localhost:4200/*         |
    | Web Origins     | http://localhost:4200           |
  And a superuser account exists with:
    | Attribute   | Value                        |
    | Email       | superadmin@emsist.com        |
    | First Name  | Super                        |
    | Last Name   | Admin                        |
    | Enabled     | true                         |
    | Email Verified | true                      |
  And the superuser has the SUPER_ADMIN realm role assigned
```

**AC-2: Alternative Scenario - Realm already exists (idempotent import)**

```gherkin
Given the identity provider has been started previously and the realm already exists
When the identity provider container restarts
Then the existing realm and user data are preserved
  And the bootstrap process does not duplicate the superuser or client
  And no errors appear in the identity provider startup logs
```

**AC-3: Role Hierarchy - All system roles present**

```gherkin
Given the identity provider realm has been bootstrapped
When a developer queries the available realm roles
Then the following roles exist:
    | Role         | Description                           |
    | SUPER_ADMIN  | Full system access across all tenants  |
    | ADMIN        | Full administrative access within tenant|
    | MANAGER      | Team management and reporting access   |
    | USER         | Standard user with basic operations    |
    | VIEWER       | Read-only access to resources          |
  And the superuser account has the SUPER_ADMIN role assigned
```

**AC-4: Edge Case - Default password for local development only**

```gherkin
Given the superuser account is provisioned in the identity provider
When the developer looks up the default credentials
Then the default password is documented (e.g., "admin123" or similar)
  And the default password is only used in local development configurations
  And the configuration makes clear this must not be used in production
```

**AC-5: Edge Case - Client scopes include required claims**

```gherkin
Given the ems-client is configured in the identity provider realm
When a token is issued for the superuser
Then the access token contains the following claims:
    | Claim            | Value                                |
    | sub              | (Keycloak user UUID)                 |
    | email            | superadmin@emsist.com                |
    | preferred_username | superadmin@emsist.com              |
    | realm_access.roles | includes SUPER_ADMIN               |
    | given_name       | Super                                |
    | family_name      | Admin                                |
```

**AC-6: Error Handling - Realm import failure**

```gherkin
Given the realm configuration file is malformed or missing
When the identity provider container attempts to start
Then the container logs a clear error indicating the import failed
  And the identity provider still starts (it should not crash due to import failure)
  And the developer can manually import or fix the configuration
```

### Business Rules

- BR-006: The superuser account is a local development convenience only; production environments must provision administrators through a secure onboarding process
- BR-007: The default superuser credentials must be clearly documented and flagged as non-production
- BR-008: The identity provider client must support Direct Access Grants (Resource Owner Password Credentials) for the auth-facade login flow
- BR-009: The client redirect URIs must include the local Angular development server origin (http://localhost:4200)
- BR-010: All five system roles (SUPER_ADMIN, ADMIN, MANAGER, USER, VIEWER) must exist as realm roles matching the identity graph role hierarchy (V004 migration)

### Data Model (Business View)

**Superuser Account**

| Attribute | Business Meaning | Required | Rules |
|-----------|------------------|----------|-------|
| Email | Login identifier | Yes | Must be valid email format |
| First Name | Given name | Yes | Used in display |
| Last Name | Family name | Yes | Used in display |
| Password | Authentication credential | Yes | Local dev only; documented default |
| Enabled | Whether account can log in | Yes | Must be true |
| Email Verified | Whether email is confirmed | Yes | Must be true (skip verification) |
| Role | Assigned system role | Yes | Must be SUPER_ADMIN |

**Relationships:**

| Relationship | Related Entity | Cardinality | Description |
|--------------|----------------|-------------|-------------|
| Has role | Role (SUPER_ADMIN) | 1:N | Superuser has the highest role |
| Authenticates via | Client (ems-client) | N:1 | Superuser logs in through the application client |
| Belongs to | Realm (master) | N:1 | User exists in the master realm |

**Tenant Scope:** Global (superuser spans all tenants)

### Priority

**Must Have** -- This is the foundation for all other stories. Without a pre-configured superuser, no authentication flow can be tested, no admin endpoints can be accessed, and local development is blocked.

### Dependencies

- None (this is the root dependency for all other stories)

### Definition of Done

- [ ] A realm configuration file bootstraps the identity provider on first startup
- [ ] The ems-client exists with Direct Access Grants enabled and correct redirect URIs
- [ ] The superuser account (superadmin@emsist.com) exists with SUPER_ADMIN role
- [ ] All five system roles are present in the realm
- [ ] The token issued for the superuser contains the required claims (email, roles, name)
- [ ] The bootstrap is idempotent (restarting does not duplicate data)
- [ ] Default credentials are documented for the development team
- [ ] Acceptance criteria AC-1 through AC-6 pass functional validation

---

## User Story: US-001c - Superuser Login Through Auth-Facade

**As a** superuser
**I want** to log in through the auth-facade service and receive a valid session token with SUPER_ADMIN privileges
**So that** I can access the administration UI and manage the platform

### Acceptance Criteria

**AC-1: Main Scenario (Happy Path) - Successful login**

```gherkin
Given the superuser account (superadmin@emsist.com) exists in the identity provider
  And the auth-facade service is running and connected to the identity provider
  And the master tenant's provider configuration exists in the identity graph
When the superuser sends a login request with:
    | Field    | Value                    |
    | Email    | superadmin@emsist.com    |
    | Password | (documented default)     |
    | Tenant   | master                   |
Then the system returns a successful authentication response containing:
    | Field          | Expectation                      |
    | Access Token   | Non-empty JWT string             |
    | Refresh Token  | Non-empty string                 |
    | Expires In     | Positive number (seconds)        |
    | User Info      | Contains email, name, roles      |
  And the access token's roles claim includes SUPER_ADMIN
```

**AC-2: Alternative Scenario - Login with tenant header**

```gherkin
Given the auth-facade login endpoint requires a tenant identifier in the request header
When the superuser sends a login request with the tenant header set to "master"
Then the system resolves the master tenant's identity provider configuration
  And authenticates the user against that provider
  And returns a valid token response
```

**AC-3: Token Refresh**

```gherkin
Given the superuser has a valid refresh token from a previous login
When the superuser sends a token refresh request with the refresh token
Then the system returns a new access token and new refresh token
  And the previous refresh token is invalidated (token rotation)
  And the new access token retains the SUPER_ADMIN role
```

**AC-4: User Profile Retrieval**

```gherkin
Given the superuser is authenticated and has a valid access token
When the superuser requests their profile
Then the system returns:
    | Field       | Value                    |
    | Email       | superadmin@emsist.com    |
    | First Name  | Super                    |
    | Last Name   | Admin                    |
    | Roles       | includes SUPER_ADMIN     |
```

**AC-5: Session Logout**

```gherkin
Given the superuser is authenticated
When the superuser sends a logout request with their refresh token
Then the session is invalidated in the identity provider
  And the refresh token can no longer be used
  And subsequent requests with the access token are rejected after token expiry
```

**AC-6: Error Handling - Invalid credentials**

```gherkin
Given the superuser sends a login request with an incorrect password
When the identity provider rejects the credentials
Then the system returns an "Invalid credentials" error
  And no token is issued
  And the response does not reveal whether the email exists (to prevent enumeration)
```

**AC-7: Error Handling - Identity provider unreachable**

```gherkin
Given the identity provider service is not running or unreachable
When the superuser sends a login request
Then the system returns a service unavailable error
  And the error message indicates the authentication service is temporarily unavailable
  And no partial or stale token is returned
```

**AC-8: Error Handling - Tenant provider configuration missing**

```gherkin
Given the master tenant exists but has no identity provider configuration in the identity graph
When the superuser sends a login request with tenant "master"
Then the system returns an error indicating no authentication provider is configured for this tenant
```

**AC-9: Authorization - SUPER_ADMIN can access admin endpoints**

```gherkin
Given the superuser is authenticated with SUPER_ADMIN role
When the superuser accesses the admin provider listing endpoint for tenant "master"
Then the system grants access (SUPER_ADMIN inherits ADMIN privileges)
  And returns the provider list
```

### Business Rules

- BR-011: The auth-facade must resolve the correct identity provider configuration for the given tenant before authenticating
- BR-012: The SUPER_ADMIN role inherits all permissions from ADMIN, MANAGER, USER, and VIEWER (as defined in the role hierarchy)
- BR-013: Failed login attempts should not reveal whether the email address exists in the system
- BR-014: Token refresh must use rotation (old refresh token invalidated on use)
- BR-015: The login flow must pass through the auth-facade's provider resolution, not bypass it

### Data Model (Business View)

**Authentication Response**

| Attribute | Business Meaning | Required | Rules |
|-----------|------------------|----------|-------|
| Access Token | Short-lived credential for API access | Yes | JWT format; contains roles claim |
| Refresh Token | Long-lived credential for obtaining new access tokens | Yes | Single-use with rotation |
| Expires In | Seconds until access token expires | Yes | Positive integer |
| User Info | Profile information of authenticated user | Yes | Email, name, roles |

**Relationships:**

| Relationship | Related Entity | Cardinality | Description |
|--------------|----------------|-------------|-------------|
| Issued for | User | 1:1 | Token is bound to one user |
| Scoped to | Tenant | 1:1 | Token is scoped to one tenant |
| Granted via | Provider Config | 1:1 | Token is issued through a specific provider |

**Tenant Scope:** Tenant-Scoped (authentication is per-tenant)

### Priority

**Must Have** -- Without a working login flow, the admin UI cannot be accessed, and no downstream features (provider display, user management) can function.

### Dependencies

- US-001b (Superuser must exist in the identity provider)

### Definition of Done

- [ ] Superuser can log in via the auth-facade login endpoint with email, password, and tenant header
- [ ] Response contains a valid access token with SUPER_ADMIN role in the claims
- [ ] Response contains a refresh token
- [ ] Token refresh works and implements token rotation
- [ ] User profile endpoint returns correct superuser details
- [ ] Logout invalidates the session
- [ ] Invalid credentials return a generic error (no email enumeration)
- [ ] Service unavailable errors are handled gracefully
- [ ] SUPER_ADMIN can access ADMIN-protected endpoints
- [ ] Acceptance criteria AC-1 through AC-9 pass functional validation

---

## User Story: US-001d - Users Tab on Tenant Detail Page

**As a** master tenant administrator
**I want** a "Users" tab on the tenant detail page
**So that** I can navigate to view and manage users belonging to a specific tenant

### Acceptance Criteria

**AC-1: Main Scenario (Happy Path) - Users tab is visible**

```gherkin
Given the administrator is authenticated with ADMIN or SUPER_ADMIN role
  And the administrator navigates to a tenant detail page
When the tenant detail page loads
Then the tab bar displays the following tabs in order:
    | Position | Tab Name            |
    | 1        | Overview            |
    | 2        | Users               |
    | 3        | Locale Definition   |
    | 4        | Local Authentication|
    | 5        | Branding            |
    | 6        | Licenses            |
  And the "Users" tab is clickable
```

**AC-2: Alternative Scenario - Tab navigation**

```gherkin
Given the administrator is on the tenant detail page
  And the "Overview" tab is currently active
When the administrator clicks the "Users" tab
Then the "Users" tab becomes the active tab (visually highlighted)
  And the tab content area displays the user management section
  And the previously active tab is deactivated
```

**AC-3: Edge Case - Direct URL navigation**

```gherkin
Given the administrator opens a direct URL to the tenant detail page with the Users tab selected
When the page loads
Then the "Users" tab is automatically activated
  And the user management content is displayed
```

**AC-4: Edge Case - Tab state persistence within session**

```gherkin
Given the administrator has selected the "Users" tab
When the administrator navigates away from the tenant detail page and then returns
Then the page defaults to the "Overview" tab (standard behavior)
```

**AC-5: Authorization - Tab visibility based on role**

```gherkin
Given a user is authenticated with the VIEWER role only
When the user navigates to a tenant detail page
Then the "Users" tab is either hidden or disabled
  And the user cannot access the user management section
```

**AC-6: Edge Case - Master tenant vs regular tenant**

```gherkin
Given the administrator views the master tenant detail page
When the "Users" tab is selected
Then the user list shows users belonging to the master tenant (platform administrators)
  And the same tab and behavior applies to regular tenant detail pages (showing tenant-specific users)
```

### Business Rules

- BR-016: The "Users" tab must appear between "Overview" and "Locale Definition" in the tab order for logical grouping (overview of tenant, then its users, then configuration)
- BR-017: The "Users" tab must be available on both master tenant and regular tenant detail pages
- BR-018: Only users with ADMIN or SUPER_ADMIN role may access the "Users" tab
- BR-019: The Users tab must support RTL layout for Arabic locale (tab label, content direction)

### Data Model (Business View)

No new business entities are introduced by this story. It adds a navigation element (tab) to an existing page that links to the user list (US-001e).

### Priority

**Should Have** -- The tab is a navigation prerequisite for the user list (US-001e). It is important for the administration workflow but is not a functional blocker if users can be managed through other means.

### Dependencies

- US-001c (Administrator must be able to log in to access the admin UI)
- US-001e (The tab content requires the user list implementation)

### Definition of Done

- [ ] A "Users" tab appears on the tenant detail page for users with ADMIN or SUPER_ADMIN role
- [ ] The tab is positioned between "Overview" and "Locale Definition"
- [ ] Clicking the tab activates it and displays the user management content area
- [ ] The tab is not visible or is disabled for users without ADMIN role
- [ ] The tab works on both master tenant and regular tenant detail pages
- [ ] RTL layout is supported for Arabic locale
- [ ] Acceptance criteria AC-1 through AC-6 pass functional validation

---

## User Story: US-001e - User List with Roles, Email, Status, and Last Login

**As a** master tenant administrator
**I want** to see a list of users belonging to a tenant, showing their roles, email, status, and last login
**So that** I can monitor user accounts, verify role assignments, and identify inactive users

### Acceptance Criteria

**AC-1: Main Scenario (Happy Path) - User list displays correctly**

```gherkin
Given the master tenant has at least one user (e.g., the superuser)
  And the administrator is authenticated with ADMIN or SUPER_ADMIN role
  And the administrator is on the tenant detail page with the "Users" tab selected
When the user list loads
Then a data table is displayed with the following columns:
    | Column      | Description                         |
    | Name        | Full name (first name + last name)  |
    | Email       | User's email address                |
    | Roles       | Assigned roles displayed as badges  |
    | Status      | Active or Inactive indicator        |
    | Last Login  | Date/time of most recent login      |
  And the first row shows the superuser:
    | Name          | Email                     | Roles        | Status | Last Login     |
    | Super Admin   | superadmin@emsist.com     | SUPER_ADMIN  | Active | (date or N/A)  |
```

**AC-2: Alternative Scenario - Multiple users with different roles**

```gherkin
Given the tenant has multiple users with varying roles
When the user list loads
Then each user row displays all roles assigned to that user as individual badges
  And roles are visually distinguished (e.g., SUPER_ADMIN in a distinct color, ADMIN in another)
  And users are listed in alphabetical order by name by default
```

**AC-3: Pagination - Default page size**

```gherkin
Given the tenant has more than 10 users
When the user list loads for the first time
Then the table displays the first 10 users (default page size)
  And pagination controls are visible below the table showing:
    | Element         | Value                        |
    | Page indicator  | "Page 1 of N"                |
    | Rows per page   | Options: 10, 25, 50          |
    | Navigation      | First, Previous, Next, Last  |
  And the total user count is displayed (e.g., "Showing 1-10 of 47 users")
```

**AC-4: Pagination - Navigate to next page**

```gherkin
Given the user list is showing page 1 of a multi-page result
When the administrator clicks "Next" or page 2
Then the table updates to show users 11-20
  And the page indicator updates to "Page 2 of N"
  And the "Previous" button becomes enabled
```

**AC-5: Sorting - Sort by column**

```gherkin
Given the user list is displayed
When the administrator clicks the "Name" column header
Then the list is sorted alphabetically by name (ascending)
When the administrator clicks the "Name" column header again
Then the list is sorted in reverse alphabetical order (descending)
  And a sort indicator arrow is displayed on the active column
```

**AC-6: Sorting - Sort by last login**

```gherkin
Given the user list is displayed
When the administrator clicks the "Last Login" column header
Then users are sorted by most recent login first (descending)
  And users who have never logged in appear last with "Never" or "N/A" displayed
```

**AC-7: Filtering - Search by name or email**

```gherkin
Given the user list is displayed
  And a search input field is visible above the table
When the administrator types "admin" in the search field
Then the table filters to show only users whose name or email contains "admin" (case-insensitive)
  And the pagination updates to reflect the filtered result count
  And a "Clear" action is available to reset the filter
```

**AC-8: Filtering - Filter by role**

```gherkin
Given the user list is displayed
  And a role filter dropdown is available
When the administrator selects "ADMIN" from the role filter
Then only users who have the ADMIN role assigned are displayed
  And users with inherited roles (e.g., SUPER_ADMIN inherits ADMIN) are not included unless they explicitly hold the ADMIN role
```

**AC-9: Filtering - Filter by status**

```gherkin
Given the user list is displayed
  And a status filter is available (Active / Inactive / All)
When the administrator selects "Inactive"
Then only users whose status is inactive are displayed
```

**AC-10: Empty State - No users**

```gherkin
Given the tenant has no users
When the "Users" tab is selected
Then an empty state is displayed with:
    | Element     | Content                              |
    | Icon        | A user/people illustration           |
    | Heading     | "No users found"                     |
    | Description | "This tenant has no users yet."      |
  And pagination controls are hidden
  And the search field is still visible
```

**AC-11: Empty State - No search results**

```gherkin
Given the user list has users
When the administrator searches for a term that matches no users (e.g., "zzzzz")
Then the table body shows "No users match your search criteria"
  And a "Clear search" action is available
```

**AC-12: Error Handling - Service unavailable**

```gherkin
Given the user management service is unreachable
When the "Users" tab attempts to load the user list
Then an error message is displayed: "Unable to load users. Please try again."
  And a "Retry" button is available
  And no empty table skeleton is shown (the error replaces the table)
```

**AC-13: Authorization - Insufficient permissions**

```gherkin
Given a user is authenticated with only the USER role
When the user attempts to access the user list for a tenant
Then the system returns a "Forbidden" response
  And the user list is not displayed
```

**AC-14: Data Formatting - Timestamps**

```gherkin
Given a user's last login timestamp is available
When the user list displays the "Last Login" column
Then the timestamp is formatted in the administrator's locale (e.g., "26 Feb 2026, 14:30" for en-GB)
  And relative time is shown as a tooltip (e.g., "2 hours ago")
  And if the user has never logged in, "Never" is displayed
```

**AC-15: Performance - Large user set**

```gherkin
Given the tenant has over 1000 users
When the administrator loads the "Users" tab
Then the first page of results loads within 3 seconds
  And only the current page of data is fetched (server-side pagination)
  And the total count is displayed without fetching all records
```

### Business Rules

- BR-020: User data is aggregated from the identity provider (for authentication attributes like last login) and the identity graph (for role assignments and group memberships)
- BR-021: The "Status" column reflects whether the user account is enabled in the identity provider (Active = enabled, Inactive = disabled)
- BR-022: Role badges should use a consistent color scheme across the application (e.g., SUPER_ADMIN = red/critical, ADMIN = orange/warning, USER = blue/info, VIEWER = grey/neutral)
- BR-023: The user list must respect tenant isolation -- an administrator viewing Tenant A must only see users belonging to Tenant A
- BR-024: Search must be case-insensitive and match partial strings (contains logic, not exact match)
- BR-025: Default sort order is alphabetical by full name (first name + last name)
- BR-026: The "Last Login" value comes from the identity provider's event log or from the last-login timestamp stored in the identity graph

### Data Model (Business View)

**User (List View)**

| Attribute | Business Meaning | Required | Rules |
|-----------|------------------|----------|-------|
| Name | Full name (first name + last name) | Yes | Combined from first and last name |
| Email | User's login email address | Yes | Unique within a tenant |
| Roles | Assigned system roles | Yes | One or more from the role hierarchy |
| Status | Whether the account is active | Yes | Active or Inactive |
| Last Login | Most recent authentication timestamp | No | Null if user has never logged in |
| Email Verified | Whether the email is confirmed | No | Display as badge/icon if unverified |

**Relationships:**

| Relationship | Related Entity | Cardinality | Description |
|--------------|----------------|-------------|-------------|
| Belongs to | Tenant | N:1 | Every user belongs to exactly one tenant |
| Has role | Role | N:N | A user can have multiple roles directly assigned |
| Member of | Group | N:N | A user can belong to multiple groups (groups carry roles) |

**Tenant Scope:** Tenant-Scoped (user list is always filtered by tenant)

### Priority

**Should Have** -- User visibility is critical for tenant administration. Administrators need to verify that users are provisioned correctly, have appropriate roles, and are active. However, user management actions (create, edit, disable) can follow in a subsequent story.

### Dependencies

- US-001d (The "Users" tab must exist to host this user list)
- US-001c (Administrator must be authenticated to access the list)
- US-001b (At least one user -- the superuser -- must exist to validate the list)

### Definition of Done

- [ ] A data table on the "Users" tab displays users with Name, Email, Roles, Status, and Last Login columns
- [ ] The superuser (superadmin@emsist.com) appears in the master tenant's user list with SUPER_ADMIN role badge
- [ ] Pagination works with default page size of 10 and options for 25 and 50
- [ ] Sorting works on Name, Email, Status, and Last Login columns
- [ ] Search by name or email filters the list in real time (or with debounce)
- [ ] Role and status filters narrow the displayed results
- [ ] Empty state is displayed when no users exist
- [ ] Empty search result state is displayed when search matches nothing
- [ ] Error state is displayed when the backend is unreachable
- [ ] Users without ADMIN role cannot access the user list
- [ ] Timestamps are formatted per the administrator's locale
- [ ] Server-side pagination is used for performance with large user sets
- [ ] RTL layout is supported for Arabic locale
- [ ] Acceptance criteria AC-1 through AC-15 pass functional validation

---

## Business Rules Catalog

| ID | Rule | Entities Affected | Stories |
|----|------|-------------------|---------|
| BR-001 | Only ADMIN or SUPER_ADMIN may view identity provider configurations | Provider Config | US-001a |
| BR-002 | The default Keycloak provider seeded by migration is non-deletable | Provider Config | US-001a |
| BR-003 | Providers displayed in ascending priority order | Provider Config | US-001a |
| BR-004 | Sensitive configuration values must be masked in display | Provider Config | US-001a |
| BR-005 | Master tenant must always have at least one enabled provider | Tenant, Provider Config | US-001a |
| BR-006 | Superuser account is for local development only | User (Superuser) | US-001b |
| BR-007 | Default superuser credentials must be documented and flagged as non-production | User (Superuser) | US-001b |
| BR-008 | Identity provider client must support Direct Access Grants | Provider Config | US-001b |
| BR-009 | Client redirect URIs must include local dev server origin | Provider Config | US-001b |
| BR-010 | All five system roles must exist matching the identity graph hierarchy | Role | US-001b |
| BR-011 | Auth-facade must resolve the correct provider config per tenant before authenticating | Tenant, Provider Config | US-001c |
| BR-012 | SUPER_ADMIN inherits all permissions from ADMIN, MANAGER, USER, VIEWER | Role | US-001c |
| BR-013 | Failed login must not reveal whether email exists | Authentication | US-001c |
| BR-014 | Token refresh must use rotation (old token invalidated) | Authentication | US-001c |
| BR-015 | Login must pass through auth-facade provider resolution, not bypass it | Authentication | US-001c |
| BR-016 | Users tab positioned between Overview and Locale Definition | UI Navigation | US-001d |
| BR-017 | Users tab available on both master and regular tenant pages | UI Navigation | US-001d |
| BR-018 | Only ADMIN or SUPER_ADMIN may access the Users tab | UI Navigation | US-001d |
| BR-019 | Users tab must support RTL layout for Arabic locale | UI Navigation | US-001d |
| BR-020 | User data aggregated from identity provider and identity graph | User | US-001e |
| BR-021 | Status reflects identity provider account enabled/disabled state | User | US-001e |
| BR-022 | Role badges use a consistent color scheme | User, Role | US-001e |
| BR-023 | User list respects tenant isolation | User, Tenant | US-001e |
| BR-024 | Search is case-insensitive partial match | User | US-001e |
| BR-025 | Default sort order is alphabetical by full name | User | US-001e |
| BR-026 | Last Login value comes from identity provider events or identity graph | User | US-001e |

---

## Domain Vocabulary (Relevant Terms)

| Term | Definition | NOT |
|------|------------|-----|
| Master Tenant | The system-level tenant that manages the platform itself | Regular tenant |
| Superuser | A pre-configured SUPER_ADMIN account for platform administration | Keycloak admin console user |
| Identity Provider | An external service that authenticates users (e.g., Keycloak, LDAP) | The application itself |
| Provider Configuration | Tenant-specific settings for connecting to an identity provider | The provider type/vendor |
| Identity Graph | The graph database storing tenant-provider-user-role relationships | The relational user database |
| Realm | An identity provider concept for isolating tenants/organizations | An application tenant (though they may map 1:1) |
| Role Hierarchy | The inheritance chain: SUPER_ADMIN > ADMIN > MANAGER > USER > VIEWER | Flat/independent roles |
| Direct Access Grant | OAuth2 Resource Owner Password Credentials flow for username/password login | Authorization Code flow |

---

## Checklist Verification

- [x] User stories follow "As a / I want / So that" format
- [x] Acceptance criteria in Given/When/Then format
- [x] All criteria are testable by QA
- [x] Business rules documented and numbered (BR-001 through BR-026)
- [x] Entities defined in business terms (not technical)
- [x] Entity relationships identified with cardinality
- [x] Tenant scope specified for each entity
- [x] Priority assigned using MoSCoW
- [x] Dependencies on other stories identified
- [x] No technical implementation details (no specific databases, APIs, or code prescribed)
- [x] Traceability to business objective BO-001 established
- [x] Edge cases and error scenarios covered
- [x] Main scenario, alternative scenarios, pagination, sorting, filtering, empty state, permissions, and error handling covered per story

---

## Next Steps

1. **Stakeholder Validation** -- These stories require review and approval from the product owner before implementation begins
2. **SA Agent** -- Once approved, the SA agent should translate the business data models into the canonical technical data model
3. **DEV Agent** -- Implementation begins with US-001b (Keycloak bootstrapping), then US-001c (login flow), then US-001a (provider display fix), and finally US-001d/US-001e (Users tab and list)
4. **QA Agent** -- Acceptance criteria should be converted into automated BDD test scenarios
