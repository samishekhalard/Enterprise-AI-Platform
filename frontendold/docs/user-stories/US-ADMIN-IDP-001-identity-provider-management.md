# User Stories: Identity Provider Management

**Feature ID:** US-ADMIN-IDP-001
**Epic:** Administration - Master Authentication
**Priority:** P1 (High)
**Status:** Draft
**Created:** 2026-02-25
**Author:** Business Analyst Agent

---

## Executive Summary

This document defines user stories for the Identity Provider (IdP) Management feature, which allows Platform Administrators to configure authentication methods for the ESMSIST multi-tenant SaaS platform. The analysis covers two existing UI implementations and recommends a consolidated approach.

---

## Current Implementation Analysis

### Implementation 1: Administration Page (Embedded Tab)

**Location:** `/administration` -> Master Authentication -> Identity Providers tab
**File:** `frontend/src/app/pages/administration/administration.page.ts`

**Capabilities:**
- Display pre-defined provider cards (Local, OAuth/OIDC, SAML, LDAP, UAE Pass)
- Static card-based UI with Enable/Configure buttons
- UAE Pass configuration modal (detailed)
- Social login toggles (Google, Microsoft, GitHub, Apple)
- Related tabs: SSO, MFA, Sessions, Policies

**Gaps:**
1. No dynamic CRUD operations (providers are hardcoded)
2. Cannot add custom providers beyond predefined templates
3. No connection testing capability
4. No provider status tracking (lastTestedAt, testResult)
5. No provider sorting/ordering
6. No allowed domains configuration
7. Limited to UAE Pass modal; other providers have no configuration form

### Implementation 2: Standalone Feature Module

**Location:** `/admin/identity-providers`
**Files:** `frontend/src/app/features/admin/identity-providers/`

**Capabilities:**
- Full CRUD operations (Create, Read, Update, Delete)
- Template-based provider creation (8 templates: Keycloak, Auth0, Okta, Azure AD, UAE Pass, IBM IAM, LDAP, Custom)
- Protocol-specific configuration forms (OIDC, OAuth2, SAML, LDAP)
- Connection testing with result tracking
- Enable/disable toggle per provider
- OIDC discovery URL auto-configuration
- Advanced settings (IDP hint, custom icon, allowed domains, sort order)
- Delete confirmation with user warning
- Toast notifications for success/error states
- Loading and empty states

**Gaps:**
1. Not integrated with Administration page workflow
2. No social login provider management (Google, Microsoft, etc.)
3. No link to related SSO, MFA, Sessions, Policies settings
4. Missing password policy configuration for Local Auth
5. No breadcrumb navigation context
6. No provider usage statistics/analytics

---

## Recommendation: Consolidated Solution

The **standalone feature module** provides superior functionality and should be the primary implementation. The Administration page should embed or link to this feature while maintaining contextual navigation to related authentication settings (SSO, MFA, Sessions, Policies).

### Consolidation Approach:
1. Embed the feature module within the Administration Master Authentication section
2. Add navigation link/button from Administration to the full provider management page
3. Keep quick-toggle actions for common providers on the Administration dashboard
4. Add social login management to the feature module
5. Integrate password policy configuration with Local Auth provider

---

## User Stories

### US-ADMIN-IDP-001: View Identity Providers List

**As a** Platform Administrator
**I want to** view all configured identity providers for my tenant
**So that** I can understand the current authentication options available to users

#### Acceptance Criteria

**AC-001.1: Main Scenario (Happy Path) - Display Provider List**
```gherkin
Given I am logged in as a Platform Administrator
  And I have navigated to the Identity Providers management page
When the page loads successfully
Then I should see a grid/list of all configured identity providers
  And each provider card should display:
    | Field           | Description                              |
    | Display Name    | Human-readable provider name             |
    | Provider Type   | e.g., Keycloak, Auth0, Azure AD          |
    | Protocol        | OIDC, SAML, LDAP, or OAuth2              |
    | Status Badge    | "Enabled" (green) or "Disabled" (gray)   |
    | Provider Icon   | Visual icon based on provider type       |
    | Internal Name   | Technical identifier (code format)       |
  And providers should be sorted by sortOrder ascending, then by displayName
```

**AC-001.2: Alternative Scenario - Empty State**
```gherkin
Given I am logged in as a Platform Administrator
  And no identity providers have been configured
When I navigate to the Identity Providers page
Then I should see an empty state illustration
  And a message: "No Identity Providers"
  And a description: "Configure identity providers to enable single sign-on for your users."
  And a primary action button: "Add Identity Provider"
```

**AC-001.3: Edge Case - Loading State**
```gherkin
Given I am logged in as a Platform Administrator
When I navigate to the Identity Providers page
  And the provider data is being fetched from the API
Then I should see a loading spinner
  And a message: "Loading providers..."
```

**AC-001.4: Edge Case - Error State**
```gherkin
Given I am logged in as a Platform Administrator
When the API request to fetch providers fails
Then I should see an error message with the failure reason
  And a "Retry" button to attempt the request again
```

**AC-001.5: Permissions - Unauthorized Access**
```gherkin
Given I am logged in as a regular user (not admin)
When I attempt to navigate to /admin/identity-providers
Then I should be redirected to the Access Denied page
  And a message should indicate insufficient permissions
```

---

### US-ADMIN-IDP-002: Add New Identity Provider

**As a** Platform Administrator
**I want to** add a new identity provider configuration
**So that** users can authenticate using external identity systems

#### Acceptance Criteria

**AC-002.1: Main Scenario - Template Selection**
```gherkin
Given I am on the Identity Providers page
When I click the "Add Provider" button
Then I should see a template selection interface with provider cards:
    | Provider        | Protocols Supported | Description                                      |
    | Keycloak        | OIDC, SAML          | Open source identity and access management       |
    | Auth0           | OIDC                | Flexible, drop-in authentication solution        |
    | Okta            | OIDC, SAML          | Enterprise identity platform                     |
    | Azure AD        | OIDC, SAML          | Microsoft cloud identity service                 |
    | UAE Pass        | OIDC                | UAE national digital identity platform           |
    | IBM IAM         | OIDC, SAML          | IBM Cloud Identity and Access Management         |
    | LDAP / AD       | LDAP                | Connect to LDAP or Active Directory servers      |
    | Custom          | OIDC, SAML, OAuth2, LDAP | Configure a custom provider manually        |
```

**AC-002.2: Main Scenario - OIDC Provider Configuration**
```gherkin
Given I have selected an OIDC-compatible template (e.g., Keycloak)
When the configuration form is displayed
Then I should see the following required fields:
    | Field Name      | Input Type | Validation                        |
    | Provider Name   | Text       | Required, lowercase, alphanumeric + hyphens |
    | Display Name    | Text       | Required, min 2 characters        |
    | Discovery URL   | URL        | Required, valid HTTPS URL         |
    | Client ID       | Text       | Required                          |
  And optional fields:
    | Field Name      | Input Type | Default Value                     |
    | Client Secret   | Password   | Empty (for public clients)        |
    | Scopes          | Text       | "openid profile email"            |
    | PKCE Enabled    | Checkbox   | Checked                           |
    | Enabled         | Toggle     | Unchecked                         |
```

**AC-002.3: Main Scenario - OIDC Discovery Auto-Configuration**
```gherkin
Given I am configuring an OIDC provider
  And I have entered a valid Discovery URL
When I click the "Discover" button
Then the system should fetch the OIDC configuration from the discovery endpoint
  And automatically populate the supported scopes field
  And show a loading spinner during the fetch operation
```

**AC-002.4: Alternative Scenario - SAML Provider Configuration**
```gherkin
Given I have selected a SAML-compatible template (e.g., Azure AD with SAML)
When the configuration form is displayed
Then I should see the following required fields:
    | Field Name      | Input Type | Validation                        |
    | Metadata URL    | URL        | Required, valid HTTPS URL         |
    | Entity ID       | Text       | Required                          |
  And optional fields:
    | Field Name              | Input Type | Default Value                     |
    | Name ID Format          | Select     | Email Address                     |
    | IdP Certificate (PEM)   | Textarea   | Empty                             |
    | Sign Requests           | Checkbox   | Checked                           |
    | Require Signed Assertions| Checkbox  | Checked                           |
  And a "Fetch" button to retrieve metadata from the URL
```

**AC-002.5: Alternative Scenario - LDAP Provider Configuration**
```gherkin
Given I have selected the "LDAP / Active Directory" template
When the configuration form is displayed
Then I should see the following required fields:
    | Field Name          | Input Type | Validation                        |
    | Server URL          | Text       | Required                          |
    | Bind DN             | Text       | Required                          |
    | User Search Base    | Text       | Required                          |
    | User Search Filter  | Text       | Required, contains {0} placeholder|
  And optional fields:
    | Field Name          | Input Type | Default Value                     |
    | Port                | Number     | 389                               |
    | Bind Password       | Password   | Empty                             |
    | Use SSL (LDAPS)     | Checkbox   | Unchecked                         |
    | Use StartTLS        | Checkbox   | Checked                           |
```

**AC-002.6: Alternative Scenario - UAE Pass Configuration**
```gherkin
Given I have selected the "UAE Pass" template
When the configuration form is displayed
Then the protocol should be set to OIDC
  And the scopes should default to UAE Pass specific scopes:
    | Scope                                    |
    | urn:uae:digitalid:profile:general        |
    | urn:uae:digitalid:profile:general:email  |
    | urn:uae:digitalid:profile:general:mobile |
  And PKCE should be disabled (UAE Pass requirement)
```

**AC-002.7: Edge Case - Form Validation Errors**
```gherkin
Given I am filling out the provider configuration form
When I attempt to save with invalid data:
    | Scenario                     | Error Message                              |
    | Empty Provider Name          | "This field is required"                   |
    | Invalid Provider Name format | "Only lowercase letters, numbers, and hyphens allowed" |
    | Empty Display Name           | "This field is required"                   |
    | Invalid Discovery URL        | "Must be a valid URL"                      |
    | Empty Client ID (OIDC)       | "This field is required"                   |
Then the form should display inline validation errors
  And the Save button should remain disabled
  And the invalid fields should be highlighted with red border
```

**AC-002.8: Success Scenario - Provider Created**
```gherkin
Given I have filled out all required fields correctly
When I click "Create Provider"
Then the system should save the provider configuration via API
  And I should see a success toast: "Provider [Display Name] created successfully"
  And I should be returned to the provider list
  And the new provider should appear in the list
```

**AC-002.9: Error Scenario - API Failure**
```gherkin
Given I have filled out the configuration form correctly
When I click "Create Provider"
  And the API request fails (e.g., network error, server error)
Then I should see an error message explaining the failure
  And the form data should be preserved
  And I should be able to retry the submission
```

---

### US-ADMIN-IDP-003: Edit Identity Provider

**As a** Platform Administrator
**I want to** modify an existing identity provider configuration
**So that** I can update settings or correct misconfigurations

#### Acceptance Criteria

**AC-003.1: Main Scenario - Open Edit Form**
```gherkin
Given I am viewing the identity providers list
When I click the "Edit" (pencil icon) button on a provider card
Then I should see the configuration form pre-populated with the provider's current settings
  And a "Back to Providers" link at the top
  And the page title should be "Edit Provider"
```

**AC-003.2: Main Scenario - Update Provider**
```gherkin
Given I am editing an existing provider
When I modify one or more fields
  And I click "Update Provider"
Then the system should save the changes via PUT API
  And I should see a success toast: "Provider [Display Name] updated successfully"
  And I should be returned to the provider list
```

**AC-003.3: Edge Case - Concurrent Edit Warning**
```gherkin
Given I am editing a provider
When another administrator has modified the same provider
  And I attempt to save my changes
Then I should receive a conflict error (HTTP 409)
  And a message: "This provider was modified by another user. Please refresh and try again."
```

**AC-003.4: Cancel Scenario**
```gherkin
Given I am editing a provider
  And I have made unsaved changes
When I click "Cancel" or "Back to Providers"
Then I should be returned to the provider list without saving changes
```

---

### US-ADMIN-IDP-004: Delete Identity Provider

**As a** Platform Administrator
**I want to** remove an identity provider configuration
**So that** I can disable authentication methods that are no longer needed

#### Acceptance Criteria

**AC-004.1: Main Scenario - Delete Confirmation**
```gherkin
Given I am viewing the identity providers list
When I click the "Delete" (trash icon) button on a provider card
Then I should see a confirmation modal with:
    | Element           | Content                                              |
    | Title             | "Delete Provider"                                    |
    | Message           | "Are you sure you want to delete [Display Name]?"    |
    | Warning           | "This will remove the identity provider configuration. Users who sign in with this provider will no longer be able to authenticate." |
    | Cancel Button     | "Cancel"                                             |
    | Confirm Button    | "Delete Provider" (red/danger style)                 |
```

**AC-004.2: Success Scenario - Provider Deleted**
```gherkin
Given the delete confirmation modal is displayed
When I click "Delete Provider"
Then the system should delete the provider via DELETE API
  And I should see a success toast: "Provider [Display Name] deleted successfully"
  And the provider should be removed from the list
```

**AC-004.3: Cancel Scenario**
```gherkin
Given the delete confirmation modal is displayed
When I click "Cancel" or click outside the modal
Then the modal should close
  And no deletion should occur
```

**AC-004.4: Error Scenario - Deletion Prevented**
```gherkin
Given there are active user sessions using this provider
When I attempt to delete the provider
Then I should see an error: "Cannot delete provider with active sessions. Please revoke all sessions first."
  And the provider should not be deleted
```

---

### US-ADMIN-IDP-005: Enable/Disable Identity Provider

**As a** Platform Administrator
**I want to** quickly enable or disable an identity provider
**So that** I can control which authentication methods are available without deleting configurations

#### Acceptance Criteria

**AC-005.1: Main Scenario - Toggle Provider Status**
```gherkin
Given I am viewing the identity providers list
  And a provider is currently disabled
When I click the toggle switch on the provider card
Then the system should send a PATCH request to update the enabled status
  And the provider status badge should change to "Enabled"
  And I should see a success toast: "Provider [Display Name] enabled"
```

**AC-005.2: Alternative Scenario - Disable Provider**
```gherkin
Given a provider is currently enabled
When I click the toggle switch to disable it
Then the status badge should change to "Disabled"
  And I should see a success toast: "Provider [Display Name] disabled"
  And users should no longer see this provider on the login page
```

**AC-005.3: Edge Case - Cannot Disable Last Active Provider**
```gherkin
Given only one identity provider is enabled
When I attempt to disable it
Then I should see an error: "At least one identity provider must remain enabled"
  And the toggle should revert to enabled state
```

---

### US-ADMIN-IDP-006: Test Provider Connection

**As a** Platform Administrator
**I want to** test the connection to an identity provider
**So that** I can verify the configuration is correct before enabling it for users

#### Acceptance Criteria

**AC-006.1: Main Scenario - Successful Connection Test**
```gherkin
Given I am viewing the identity providers list
When I click the "Test Connection" button (checkmark icon) on a provider card
Then I should see a loading spinner on the button
  And the system should attempt to connect to the provider
  And on success, I should see a success toast: "Connection to [Display Name] successful"
  And the provider card should show "Last Tested: Just now" with a green indicator
```

**AC-006.2: Error Scenario - Connection Test Failed**
```gherkin
Given I am testing a provider connection
When the connection test fails (invalid credentials, unreachable server, etc.)
Then I should see an error toast with the failure reason
  And the provider card should show "Last Tested: Just now" with a red indicator
  And the test result should be stored: testResult = 'failure'
```

**AC-006.3: Edge Case - Test in Progress**
```gherkin
Given a connection test is already in progress for a provider
When I attempt to click the test button again
Then the button should be disabled
  And only one test request should be sent
```

---

### US-ADMIN-IDP-007: Configure Advanced Provider Settings

**As a** Platform Administrator
**I want to** configure advanced settings for identity providers
**So that** I can fine-tune the authentication behavior for my organization

#### Acceptance Criteria

**AC-007.1: Main Scenario - Advanced Settings Section**
```gherkin
Given I am creating or editing a provider
When I click "Advanced Settings" to expand the section
Then I should see the following optional fields:
    | Field Name          | Input Type | Description                                    |
    | IDP Hint            | Text       | Pre-select this provider on login page         |
    | Custom Icon URL     | URL        | Override the default provider icon             |
    | Allowed Email Domains| Text      | Comma-separated list (e.g., "company.com")     |
    | Sort Order          | Number     | Lower numbers appear first on login page       |
```

**AC-007.2: Domain Restriction Behavior**
```gherkin
Given a provider is configured with allowedDomains: ["acme.com", "acme.org"]
When a user with email "user@other.com" attempts to use this provider
Then authentication should be rejected
  And an error message should indicate the domain is not allowed
```

---

### US-ADMIN-IDP-008: Manage Social Login Providers

**As a** Platform Administrator
**I want to** enable or disable social login options (Google, Microsoft, GitHub, Apple)
**So that** users have convenient authentication options

#### Acceptance Criteria

**AC-008.1: Main Scenario - View Social Providers**
```gherkin
Given I am on the Identity Providers page
When I scroll to the "Social Login Providers" section
Then I should see toggle switches for:
    | Provider   | Icon | Default State |
    | Google     | G    | Disabled      |
    | Microsoft  | M    | Disabled      |
    | GitHub     | GH   | Disabled      |
    | Apple      | A    | Disabled      |
```

**AC-008.2: Enable Social Provider**
```gherkin
Given I want to enable Google login
When I toggle the Google switch to "on"
Then I should see a configuration modal requesting:
    | Field           | Required |
    | Client ID       | Yes      |
    | Client Secret   | Yes      |
    | Redirect URI    | Auto-populated |
  And after saving, Google should appear in the enabled state
```

---

## Data Model

### ProviderConfig Entity

| Attribute Name       | Data Type      | Required | Description                                         |
|---------------------|----------------|----------|-----------------------------------------------------|
| id                  | UUID           | Yes      | Unique provider identifier                          |
| providerName        | String         | Yes      | Internal name (lowercase, alphanumeric + hyphens)   |
| providerType        | Enum           | Yes      | KEYCLOAK, AUTH0, OKTA, AZURE_AD, UAE_PASS, IBM_IAM, LDAP_SERVER, CUSTOM |
| protocol            | Enum           | Yes      | OIDC, OAUTH2, SAML, LDAP                            |
| displayName         | String         | Yes      | Human-readable name shown on login page             |
| enabled             | Boolean        | Yes      | Whether provider is active                          |
| status              | Enum           | No       | active, inactive, pending, error                    |
| clientId            | String         | Conditional | Required for OIDC/OAuth2                         |
| clientSecret        | String (encrypted) | No    | Client secret (stored encrypted)                   |
| discoveryUrl        | URL            | Conditional | Required for OIDC                                |
| authorizationUrl    | URL            | Conditional | Required for OAuth2                              |
| tokenUrl            | URL            | Conditional | Required for OAuth2                              |
| userInfoUrl         | URL            | No       | User info endpoint                                  |
| jwksUrl             | URL            | No       | JWKS endpoint for token validation                  |
| scopes              | String[]       | No       | OAuth scopes (default: openid, profile, email)      |
| responseType        | String         | No       | OAuth response type (default: code)                 |
| pkceEnabled         | Boolean        | No       | Enable PKCE (default: true)                         |
| metadataUrl         | URL            | Conditional | Required for SAML                                |
| entityId            | String         | Conditional | Required for SAML                                |
| acsUrl              | URL            | No       | Assertion Consumer Service URL                      |
| sloUrl              | URL            | No       | Single Logout URL                                   |
| certificate         | Text           | No       | X.509 certificate (PEM format)                      |
| privateKey          | Text (encrypted) | No     | Private key for signing (PEM format)               |
| signRequests        | Boolean        | No       | Sign SAML requests (default: true)                  |
| wantAssertionsSigned| Boolean        | No       | Require signed assertions (default: true)           |
| nameIdFormat        | String         | No       | SAML Name ID format                                 |
| attributeMapping    | JSON           | No       | SAML attribute to claim mapping                     |
| serverUrl           | String         | Conditional | Required for LDAP                                |
| port                | Integer        | No       | LDAP port (default: 389)                            |
| bindDn              | String         | Conditional | Required for LDAP                                |
| bindPassword        | String (encrypted) | No    | LDAP bind password                                |
| userSearchBase      | String         | Conditional | Required for LDAP                                |
| userSearchFilter    | String         | Conditional | Required for LDAP                                |
| groupSearchBase     | String         | No       | LDAP group search base                              |
| groupSearchFilter   | String         | No       | LDAP group search filter                            |
| useSsl              | Boolean        | No       | Use LDAPS (default: false)                          |
| useTls              | Boolean        | No       | Use StartTLS (default: true)                        |
| connectionTimeout   | Integer        | No       | Connection timeout in ms (default: 5000)            |
| readTimeout         | Integer        | No       | Read timeout in ms (default: 10000)                 |
| idpHint             | String         | No       | IDP hint for provider pre-selection                 |
| iconUrl             | URL            | No       | Custom icon URL                                     |
| sortOrder           | Integer        | No       | Display order (lower = first)                       |
| allowedDomains      | String[]       | No       | Restrict to specific email domains                  |
| defaultRoles        | String[]       | No       | Roles to assign to users from this provider         |
| groupMappings       | JSON           | No       | External group to internal role mapping             |
| customAttributes    | JSON           | No       | Provider-specific custom attributes                 |
| createdAt           | DateTime       | Yes      | Record creation timestamp                           |
| updatedAt           | DateTime       | Yes      | Last update timestamp                               |
| lastTestedAt        | DateTime       | No       | Last connection test timestamp                      |
| testResult          | Enum           | No       | success, failure, pending                           |

---

## Validation Rules

| Field           | Validation Rule                                                |
|-----------------|---------------------------------------------------------------|
| providerName    | Required, lowercase, alphanumeric + hyphens only, 3-50 chars  |
| displayName     | Required, min 2 chars, max 100 chars                          |
| discoveryUrl    | Valid HTTPS URL, must end with /.well-known/openid-configuration for OIDC |
| metadataUrl     | Valid HTTPS URL for SAML                                      |
| clientId        | Required when protocol is OIDC or OAuth2                      |
| entityId        | Required when protocol is SAML                                |
| serverUrl       | Required when protocol is LDAP, valid LDAP or LDAPS URL       |
| bindDn          | Required when protocol is LDAP                                |
| userSearchBase  | Required when protocol is LDAP                                |
| userSearchFilter| Required when protocol is LDAP, must contain {0} placeholder  |
| port            | Integer between 1 and 65535                                   |
| sortOrder       | Non-negative integer                                          |
| allowedDomains  | Valid domain names (no protocol, no path)                     |

---

## Business Rules

1. **BR-001:** At least one identity provider must remain enabled at all times.
2. **BR-002:** Local authentication (email/password) can be disabled only if at least one SSO provider is enabled.
3. **BR-003:** UAE Pass provider requires specific UAE government compliance scopes.
4. **BR-004:** Client secrets must be stored encrypted at rest using the Encryption Service.
5. **BR-005:** Provider connection tests must complete within 30 seconds or timeout.
6. **BR-006:** Deleting a provider with active sessions requires explicit confirmation or session revocation.
7. **BR-007:** Only users with `admin` or `super-admin` roles can manage identity providers.
8. **BR-008:** Provider changes should be logged in the audit trail with actor, action, and timestamp.
9. **BR-009:** Domain restrictions (allowedDomains) are enforced during the authentication callback, not during initial provider selection.

---

## API Endpoints

| Method | Endpoint                                      | Description                      |
|--------|-----------------------------------------------|----------------------------------|
| GET    | /api/v1/admin/tenants/{tenantId}/providers    | List all providers               |
| GET    | /api/v1/admin/tenants/{tenantId}/providers/{id}| Get single provider             |
| POST   | /api/v1/admin/tenants/{tenantId}/providers    | Create provider                  |
| PUT    | /api/v1/admin/tenants/{tenantId}/providers/{id}| Update provider                 |
| PATCH  | /api/v1/admin/tenants/{tenantId}/providers/{id}| Partial update (enable/disable) |
| DELETE | /api/v1/admin/tenants/{tenantId}/providers/{id}| Delete provider                 |
| POST   | /api/v1/admin/tenants/{tenantId}/providers/{id}/test | Test connection           |
| POST   | /api/v1/admin/tenants/{tenantId}/providers/validate | Validate config without saving|

---

## UI/UX Requirements

### Navigation Flow
1. Administration Dashboard -> Master Authentication -> Identity Providers tab (quick view)
2. Identity Providers tab -> "Manage Providers" button -> Full provider management page
3. Full provider management page (/admin/identity-providers) accessible directly

### Responsive Design
- Desktop: Grid layout with provider cards (3 columns)
- Tablet: Grid layout (2 columns)
- Mobile: Single column stacked cards

### Accessibility (WCAG 2.1 AA)
- All form fields must have associated labels
- Toggle switches must have aria-labels
- Color is not the only indicator of status (use icons + text)
- Keyboard navigation support for all actions
- Focus visible indicators

### Arabic RTL Support
- Form labels should be right-aligned in RTL mode
- Provider cards should reverse order in RTL
- Icons and buttons should flip appropriately

---

## Dependencies

| Dependency          | Type     | Description                                    |
|--------------------|----------|------------------------------------------------|
| Auth Facade Service| Backend  | API for provider CRUD and connection testing   |
| Neo4j Graph DB     | Backend  | Stores provider-to-role mappings               |
| Encryption Service | Backend  | Encrypts sensitive fields (secrets, passwords) |
| Audit Service      | Backend  | Logs provider management actions               |
| Tenant Resolver    | Frontend | Provides current tenant context                |

---

## Out of Scope

- Identity provider federation (provider chaining)
- Custom claim transformations (beyond attribute mapping)
- Provider-specific branding per tenant
- A/B testing of authentication flows
- Real-time provider health monitoring dashboard
