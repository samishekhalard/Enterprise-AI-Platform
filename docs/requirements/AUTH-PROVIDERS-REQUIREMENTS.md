# Multi-Provider Authentication Business Requirements

**Document ID:** REQ-AUTH-001
**Version:** 1.0.0
**Status:** Draft
**Author:** Business Analyst Agent
**Date:** 2026-02-25
**Reviewers:** SA Agent, ARCH Agent, SEC Agent

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Business Context](#2-business-context)
3. [Provider Overview](#3-provider-overview)
4. [Business Objects](#4-business-objects)
5. [User Stories](#5-user-stories)
6. [Business Rules](#6-business-rules)
7. [Data Models](#7-data-models)
8. [Provider Feature Matrix](#8-provider-feature-matrix)
9. [Non-Functional Requirements](#9-non-functional-requirements)
10. [Glossary](#10-glossary)

---

## 1. Executive Summary

This document defines business requirements for implementing multi-provider authentication in the EMS platform. The system must support five identity providers to accommodate diverse enterprise customers, including UAE government entities that mandate UAE Pass integration.

### Providers in Scope

| Provider | Protocol | Target Customers |
|----------|----------|------------------|
| Azure AD (Microsoft Entra ID) | OIDC | Enterprise Microsoft 365 customers |
| UAE Pass | OAuth 2.0 | UAE government entities, UAE-based organizations |
| LDAP/Active Directory | LDAP | On-premise enterprise customers |
| IBM IAM (Security Verify) | SAML 2.0 | IBM enterprise customers |
| Keycloak | OIDC | Default provider (already implemented) |

### Business Drivers

1. **Government Compliance**: UAE Pass is mandatory for UAE government entity authentication
2. **Enterprise Integration**: Large enterprises require SSO with existing identity infrastructure
3. **On-Premise Support**: Some customers cannot use cloud identity providers
4. **Vendor Independence**: Avoid lock-in to single identity provider

---

## 2. Business Context

### 2.1 Stakeholders

| Stakeholder | Interest | Influence |
|-------------|----------|-----------|
| Tenant Administrators | Configure and manage authentication providers | High |
| End Users | Authenticate using preferred/mandated provider | Medium |
| Security Officers | Ensure secure authentication practices | High |
| Operations Team | Monitor and troubleshoot authentication issues | Medium |
| Government Regulators (UAE) | Ensure UAE Pass compliance | High |

### 2.2 Business Goals

| ID | Goal | Success Metric |
|----|------|----------------|
| BG-01 | Enable UAE government entity onboarding | 100% UAE Pass compliance for government tenants |
| BG-02 | Reduce enterprise SSO integration time | < 2 hours to configure new provider |
| BG-03 | Support diverse enterprise identity systems | Support 5+ identity provider types |
| BG-04 | Maintain security compliance | Zero authentication-related security incidents |

---

## 3. Provider Overview

### 3.1 Azure AD (Microsoft Entra ID)

**Description**: Cloud-based identity service from Microsoft, widely used by enterprises with Microsoft 365.

**Protocol**: OpenID Connect (OIDC)

**Key Capabilities**:
- Enterprise SSO with Microsoft 365
- Conditional Access policies
- MFA through Microsoft Authenticator
- App roles and group-based access
- B2B guest access
- Cross-tenant collaboration

**Target Customers**: Organizations using Microsoft 365, Azure cloud services, Windows-based enterprises.

### 3.2 UAE Pass

**Description**: UAE Government digital identity platform providing verified citizen and resident authentication.

**Protocol**: OAuth 2.0 (UAE Pass specific flow)

**Key Capabilities**:
- Emirates ID verification
- Digital signature services
- Three authentication levels (Anonymous, Basic, Verified)
- Arabic language support (RTL)
- Mobile app-based authentication
- PKI-based digital signatures

**Target Customers**: UAE government entities, organizations serving UAE residents/citizens.

**Compliance Requirements**:
- Data residency in UAE
- Arabic language support mandatory
- Emirates ID linkage for verified accounts
- Audit trail for government compliance

### 3.3 LDAP/Active Directory

**Description**: On-premise directory services for enterprise user management.

**Protocol**: LDAP v3 / LDAPS (LDAP over SSL)

**Key Capabilities**:
- Direct bind authentication
- Group membership sync
- Attribute mapping (customizable)
- Nested group resolution
- Real-time authentication (no token caching)

**Target Customers**: Enterprises with on-premise Active Directory, legacy LDAP systems.

### 3.4 IBM IAM (Security Verify)

**Description**: IBM's enterprise identity and access management solution.

**Protocol**: SAML 2.0

**Key Capabilities**:
- SAML assertion-based authentication
- Attribute mapping
- SP-initiated and IdP-initiated SSO
- Risk-based authentication
- Adaptive access policies

**Target Customers**: IBM enterprise customers, organizations with IBM infrastructure.

### 3.5 Keycloak (Reference Implementation)

**Description**: Open-source identity and access management solution (already implemented).

**Protocol**: OpenID Connect (OIDC)

**Key Capabilities**:
- Full OIDC compliance
- Realm-per-tenant architecture
- Built-in MFA (TOTP, WebAuthn)
- Identity brokering
- Token exchange

**Status**: Already implemented and serving as reference for other providers.

---

## 4. Business Objects

### 4.1 Provider Configuration Entity

Each provider configuration requires the following business attributes.

#### 4.1.1 Common Attributes (All Providers)

| Attribute Name | Data Type | Required | Description |
|----------------|-----------|----------|-------------|
| id | UUID | Yes | Unique configuration identifier |
| tenantId | String | Yes | Owning tenant identifier |
| providerType | Enum | Yes | Provider type (AZURE_AD, UAE_PASS, LDAP_GENERIC, IBM_IAM, KEYCLOAK) |
| displayName | String | Yes | User-friendly name shown on login page |
| displayNameAr | String | No | Arabic display name for RTL support |
| iconUrl | String | No | Custom icon URL for login button |
| enabled | Boolean | Yes | Whether provider is active for authentication |
| priority | Integer | Yes | Display order on login page (lower = higher) |
| trustEmail | Boolean | Yes | Whether to trust email from this provider |
| linkExistingAccounts | Boolean | Yes | Whether to link by email on first login |
| createdAt | Timestamp | Yes | Configuration creation timestamp |
| updatedAt | Timestamp | Yes | Last modification timestamp |
| createdBy | String | Yes | Admin user who created configuration |

#### 4.1.2 Azure AD Specific Attributes

| Attribute Name | Data Type | Required | Description |
|----------------|-----------|----------|-------------|
| azureTenantId | String | Yes | Azure AD tenant ID (GUID or domain) |
| clientId | String | Yes | Azure AD application (client) ID |
| clientSecret | String | Yes | Azure AD client secret (encrypted) |
| discoveryUrl | String | Auto | OIDC discovery URL (derived from tenantId) |
| scopes | List[String] | No | OAuth scopes (default: openid, profile, email) |
| enableAppRoles | Boolean | No | Map Azure AD app roles to EMS roles |
| enableGroupClaims | Boolean | No | Include group memberships in token |
| groupAttributeName | String | No | Custom attribute for group claims |
| allowedDomains | List[String] | No | Restrict login to specific email domains |

#### 4.1.3 UAE Pass Specific Attributes

| Attribute Name | Data Type | Required | Description |
|----------------|-----------|----------|-------------|
| clientId | String | Yes | UAE Pass client ID |
| clientSecret | String | Yes | UAE Pass client secret (encrypted) |
| environment | Enum | Yes | STAGING or PRODUCTION |
| authorizationUrl | String | Yes | UAE Pass authorization endpoint |
| tokenUrl | String | Yes | UAE Pass token endpoint |
| userInfoUrl | String | Yes | UAE Pass user info endpoint |
| requiredAuthLevel | Enum | Yes | ANONYMOUS, BASIC, or VERIFIED |
| emiratesIdRequired | Boolean | No | Require Emirates ID linkage |
| enableDigitalSignature | Boolean | No | Enable digital signature services |
| redirectUri | String | Yes | OAuth callback URI |
| state | String | Auto | CSRF protection state parameter |
| languagePreference | String | No | Default language (ar, en) |

#### 4.1.4 LDAP/Active Directory Specific Attributes

| Attribute Name | Data Type | Required | Description |
|----------------|-----------|----------|-------------|
| serverUrl | String | Yes | LDAP server URL (ldap:// or ldaps://) |
| port | Integer | Yes | LDAP port (389 for LDAP, 636 for LDAPS) |
| useSsl | Boolean | Yes | Enable SSL/TLS connection |
| bindDn | String | Yes | Bind distinguished name (service account) |
| bindPassword | String | Yes | Bind password (encrypted) |
| userSearchBase | String | Yes | Base DN for user searches |
| userSearchFilter | String | Yes | LDAP filter for user lookup (e.g., (sAMAccountName={0})) |
| groupSearchBase | String | No | Base DN for group searches |
| groupSearchFilter | String | No | LDAP filter for group lookup |
| userObjectClass | String | No | User object class (default: person) |
| usernameAttribute | String | No | Username attribute (default: sAMAccountName) |
| emailAttribute | String | No | Email attribute (default: mail) |
| firstNameAttribute | String | No | First name attribute (default: givenName) |
| lastNameAttribute | String | No | Last name attribute (default: sn) |
| memberOfAttribute | String | No | Group membership attribute (default: memberOf) |
| syncEnabled | Boolean | No | Enable periodic user sync |
| syncIntervalMinutes | Integer | No | Sync interval in minutes |
| connectionTimeout | Integer | No | Connection timeout in milliseconds |
| readTimeout | Integer | No | Read timeout in milliseconds |

#### 4.1.5 IBM IAM (Security Verify) Specific Attributes

| Attribute Name | Data Type | Required | Description |
|----------------|-----------|----------|-------------|
| metadataUrl | String | Yes | SAML IdP metadata URL |
| entityId | String | Yes | SAML Service Provider entity ID |
| ssoUrl | String | Auto | Single Sign-On URL (from metadata) |
| sloUrl | String | Auto | Single Logout URL (from metadata) |
| signingCertificate | String | Auto | IdP signing certificate (from metadata) |
| encryptionCertificate | String | No | SP encryption certificate |
| spPrivateKey | String | No | SP private key for decryption (encrypted) |
| nameIdFormat | Enum | No | NameID format (EMAIL, PERSISTENT, TRANSIENT) |
| signAuthnRequest | Boolean | No | Sign authentication requests |
| wantAssertionsSigned | Boolean | Yes | Require signed SAML assertions |
| wantAssertionsEncrypted | Boolean | No | Require encrypted SAML assertions |
| attributeMappings | Map | No | Custom attribute mappings |
| enableSlo | Boolean | No | Enable Single Logout |

### 4.2 User Identity Attributes (Per Provider)

#### 4.2.1 Standard User Claims

| Attribute Name | Data Type | Required | Description |
|----------------|-----------|----------|-------------|
| sub | String | Yes | Subject identifier (unique user ID from provider) |
| email | String | Yes | User email address |
| email_verified | Boolean | No | Whether email is verified |
| given_name | String | No | User first name |
| family_name | String | No | User last name |
| preferred_username | String | No | Preferred username |
| locale | String | No | User locale preference |

#### 4.2.2 Azure AD Extended Claims

| Attribute Name | Data Type | Description |
|----------------|-----------|-------------|
| oid | String | Object ID in Azure AD |
| tid | String | Azure AD tenant ID |
| roles | List[String] | Azure AD app roles |
| groups | List[String] | Azure AD group memberships |
| wids | List[String] | Azure AD directory roles |
| idp | String | Identity provider (for B2B) |
| amr | List[String] | Authentication methods used |

#### 4.2.3 UAE Pass Extended Claims

| Attribute Name | Data Type | Description |
|----------------|-----------|-------------|
| idn | String | Emirates ID number |
| fullnameEN | String | Full name in English |
| fullnameAR | String | Full name in Arabic |
| nationalityEN | String | Nationality in English |
| nationalityAR | String | Nationality in Arabic |
| gender | String | Gender |
| dob | Date | Date of birth |
| userType | Enum | SOP1 (citizen), SOP2 (resident), SOP3 (visitor) |
| authLevel | Enum | Authentication level achieved |
| mobile | String | Mobile phone number |
| uuid | String | UAE Pass unique identifier |

#### 4.2.4 LDAP User Attributes

| Attribute Name | Data Type | Description |
|----------------|-----------|-------------|
| distinguishedName | String | Full DN of user in directory |
| sAMAccountName | String | Windows login name |
| userPrincipalName | String | UPN (email-like identifier) |
| memberOf | List[String] | DN list of group memberships |
| employeeId | String | Employee identifier |
| department | String | Department name |
| title | String | Job title |
| manager | String | Manager DN |

---

## 5. User Stories

### 5.1 Azure AD User Stories

#### US-AZURE-001: Configure Azure AD Provider

**Title**: As a tenant admin, I want to configure Azure AD as an identity provider so that my organization's users can log in with their Microsoft 365 credentials.

**Priority**: High
**Story Points**: 8

**Acceptance Criteria**:

1. **AC-001 (Main Scenario - Happy Path): Configure Azure AD with valid credentials**
   - Given I am logged in as a tenant admin
   - And I navigate to Settings > Identity Providers
   - When I click "Add Provider" and select "Azure AD"
   - And I enter a valid Azure AD tenant ID (e.g., "contoso.onmicrosoft.com")
   - And I enter a valid client ID (e.g., "12345678-1234-1234-1234-123456789abc")
   - And I enter a valid client secret
   - And I click "Test Connection"
   - Then the system displays "Connection successful"
   - And I can save the configuration
   - And the provider appears in the provider list with status "Active"

2. **AC-002 (Alternative Scenario): Configure Azure AD with app roles enabled**
   - Given I am configuring an Azure AD provider
   - When I enable "Map Azure AD App Roles"
   - And I specify role mappings (Azure role -> EMS role)
   - Then the configuration saves with role mappings
   - And users logging in receive mapped EMS roles

3. **AC-003 (Alternative Scenario): Configure Azure AD with group claims**
   - Given I am configuring an Azure AD provider
   - When I enable "Include Group Claims"
   - And I specify group-to-role mappings
   - Then the configuration saves with group mappings
   - And group memberships are synced on login

4. **AC-004 (Alternative Scenario): Configure Azure AD with domain restriction**
   - Given I am configuring an Azure AD provider
   - When I specify allowed domains (e.g., "contoso.com, fabrikam.com")
   - Then only users with matching email domains can authenticate

5. **AC-005 (Edge Case - Empty State): No Azure AD providers configured**
   - Given no Azure AD provider is configured for my tenant
   - When I view the login page
   - Then Azure AD login option is not displayed

6. **AC-006 (Edge Case - Invalid Tenant ID)**
   - Given I am configuring an Azure AD provider
   - When I enter an invalid Azure AD tenant ID
   - And I click "Test Connection"
   - Then the system displays "Unable to discover OIDC endpoints"
   - And the configuration cannot be saved

7. **AC-007 (Permissions): Only admins can configure providers**
   - Given I am logged in as a regular user (non-admin)
   - When I attempt to access Settings > Identity Providers
   - Then I receive a 403 Forbidden error
   - And I see "Insufficient permissions" message

8. **AC-008 (Error Handling): Invalid client credentials**
   - Given I am configuring an Azure AD provider with valid tenant ID
   - When I enter an incorrect client secret
   - And I click "Test Connection"
   - Then the system displays "Authentication failed: Invalid client credentials"

**Data Model**:

| Attribute Name | Data Type | Required | Description |
|----------------|-----------|----------|-------------|
| azureTenantId | String | Yes | Azure AD tenant identifier |
| clientId | String | Yes | Application (client) ID |
| clientSecret | String | Yes | Client secret (encrypted) |
| enableAppRoles | Boolean | No | Map app roles to EMS roles |
| enableGroupClaims | Boolean | No | Include group memberships |
| allowedDomains | List[String] | No | Restrict by email domain |

**Validation Rules**:
- azureTenantId: Required, valid GUID or domain format
- clientId: Required, valid GUID format (36 characters)
- clientSecret: Required, min 8 characters, encrypted at rest
- allowedDomains: Each domain must be valid DNS format

**Business Rules**:
- BR-AZURE-001: Azure AD tenant ID can be a GUID or verified domain
- BR-AZURE-002: Discovery URL is auto-generated: `https://login.microsoftonline.com/{tenantId}/v2.0/.well-known/openid-configuration`
- BR-AZURE-003: App roles require Azure AD Premium P1 or higher
- BR-AZURE-004: Group claims are limited to 200 groups by Azure AD

**UI Wireframe**: See `/docs/wireframes/azure-ad-config.html`

---

#### US-AZURE-002: Login with Azure AD

**Title**: As an end user, I want to log in using my Microsoft 365 account so that I can access the EMS platform with my corporate credentials.

**Priority**: High
**Story Points**: 5

**Acceptance Criteria**:

1. **AC-001 (Main Scenario - Happy Path): Successful Azure AD login**
   - Given Azure AD is configured and enabled for my tenant
   - And I am on the login page
   - When I click "Sign in with Microsoft"
   - Then I am redirected to Microsoft login page
   - And I enter my Microsoft credentials
   - And I complete MFA if required
   - Then I am redirected back to EMS
   - And I see the dashboard with my name displayed
   - And I have roles mapped from my Azure AD membership

2. **AC-002 (Alternative Scenario): First-time login with account linking**
   - Given Azure AD is configured with linkExistingAccounts=true
   - And I have an existing EMS account with the same email
   - When I log in with Azure AD for the first time
   - Then my Azure AD identity is linked to my existing account
   - And I retain my existing EMS permissions
   - And I receive a notification "Account linked successfully"

3. **AC-003 (Alternative Scenario): New user auto-provisioning**
   - Given Azure AD is configured
   - And I do not have an existing EMS account
   - When I log in with Azure AD for the first time
   - Then a new EMS account is created with my Azure AD profile
   - And I receive default user role
   - And I am directed to complete profile setup

4. **AC-004 (Edge Case): Azure AD provider disabled mid-session**
   - Given I am logged in via Azure AD
   - And the admin disables the Azure AD provider
   - When my session expires and I try to refresh
   - Then I am redirected to login
   - And Azure AD option is no longer available
   - And I can log in with alternative methods if available

5. **AC-005 (Permissions): User from restricted domain**
   - Given Azure AD is configured with allowedDomains=["contoso.com"]
   - When I try to log in with email "user@fabrikam.com"
   - Then authentication is rejected
   - And I see "Your organization is not authorized to access this application"

6. **AC-006 (Error Handling): Azure AD service unavailable**
   - Given Azure AD provider is configured
   - When Microsoft identity services are unavailable
   - And I click "Sign in with Microsoft"
   - Then after timeout I see "Identity provider unavailable"
   - And I am offered alternative login methods

7. **AC-007 (Error Handling): User cancels Azure AD login**
   - Given I clicked "Sign in with Microsoft"
   - When I cancel the Microsoft login flow
   - Then I am returned to the EMS login page
   - And I see "Login cancelled"

8. **AC-008 (Edge Case): MFA required but not completed**
   - Given Azure AD requires MFA for the user
   - When I authenticate but do not complete MFA
   - Then authentication fails
   - And I see "Multi-factor authentication required"

---

#### US-AZURE-003: Token Refresh for Azure AD

**Title**: As a logged-in user, I want my session to remain active so that I can work without interruption.

**Priority**: Medium
**Story Points**: 3

**Acceptance Criteria**:

1. **AC-001 (Main Scenario - Happy Path): Automatic token refresh**
   - Given I am logged in via Azure AD
   - And my access token is about to expire
   - When I perform an action in the application
   - Then the system automatically refreshes my token
   - And I continue working without interruption
   - And I am not required to re-authenticate

2. **AC-002 (Alternative Scenario): Refresh token expired**
   - Given I am logged in via Azure AD
   - And my refresh token has expired (after 90 days inactivity)
   - When I perform an action
   - Then I am redirected to re-authenticate with Azure AD
   - And after authentication I return to my previous context

3. **AC-003 (Edge Case): Concurrent session on multiple devices**
   - Given I am logged in via Azure AD on two devices
   - When the admin revokes my Azure AD session
   - Then both EMS sessions are invalidated on next token refresh
   - And I must re-authenticate on both devices

4. **AC-004 (Error Handling): Azure AD token revocation**
   - Given I am logged in via Azure AD
   - When my Azure AD account is disabled by the Azure admin
   - Then my EMS session is invalidated on next token refresh
   - And I see "Your account has been disabled"

---

#### US-AZURE-004: Logout from Azure AD Session

**Title**: As a user, I want to log out completely so that my session is securely terminated.

**Priority**: Medium
**Story Points**: 2

**Acceptance Criteria**:

1. **AC-001 (Main Scenario - Happy Path): Single logout**
   - Given I am logged in via Azure AD
   - When I click "Logout"
   - Then my EMS session is terminated
   - And my refresh token is blacklisted
   - And I am redirected to the login page
   - And I see "You have been logged out"

2. **AC-002 (Alternative Scenario): Federated logout**
   - Given I am logged in via Azure AD
   - And federated logout is enabled
   - When I click "Logout"
   - Then I am logged out of EMS
   - And I am redirected to Azure AD logout endpoint
   - And I am logged out of my Microsoft session

3. **AC-003 (Edge Case): Logout with expired token**
   - Given I am logged in but my token has expired
   - When I click "Logout"
   - Then local session is cleared
   - And I am redirected to login page

---

### 5.2 UAE Pass User Stories

#### US-UAEPASS-001: Configure UAE Pass Provider

**Title**: As a tenant admin for a UAE government entity, I want to configure UAE Pass as the identity provider so that my employees can authenticate using their Emirates ID.

**Priority**: Critical (Government Compliance)
**Story Points**: 13

**Acceptance Criteria**:

1. **AC-001 (Main Scenario - Happy Path): Configure UAE Pass production**
   - Given I am logged in as a tenant admin
   - And my tenant is approved for UAE Pass integration
   - When I navigate to Settings > Identity Providers
   - And I click "Add Provider" and select "UAE Pass"
   - And I enter valid UAE Pass client ID and secret
   - And I select environment "PRODUCTION"
   - And I select required auth level "VERIFIED"
   - And I click "Test Connection"
   - Then the system validates against UAE Pass staging first
   - And displays "Configuration valid"
   - And I can save the configuration

2. **AC-002 (Alternative Scenario): Configure UAE Pass staging**
   - Given I am configuring UAE Pass
   - When I select environment "STAGING"
   - Then the system uses UAE Pass staging endpoints
   - And I can test with UAE Pass test accounts

3. **AC-003 (Alternative Scenario): Configure with Emirates ID requirement**
   - Given I am configuring UAE Pass
   - When I enable "Emirates ID Required"
   - Then only users with linked Emirates ID can authenticate
   - And users without Emirates ID see an error message

4. **AC-004 (Edge Case - Empty State): UAE Pass not available for tenant**
   - Given my tenant is not UAE-based
   - When I try to add UAE Pass provider
   - Then I see "UAE Pass is only available for UAE-registered organizations"

5. **AC-005 (Permissions): Non-admin access**
   - Given I am logged in as a non-admin user
   - When I try to access UAE Pass configuration
   - Then I receive 403 Forbidden

6. **AC-006 (Error Handling): Invalid UAE Pass credentials**
   - Given I am configuring UAE Pass
   - When I enter invalid client credentials
   - And I click "Test Connection"
   - Then I see "UAE Pass authentication failed: Invalid client credentials"

7. **AC-007 (Validation): Arabic display name required**
   - Given I am configuring UAE Pass
   - When I do not provide Arabic display name (displayNameAr)
   - Then validation fails with "Arabic display name required for UAE Pass"

8. **AC-008 (Business Rule): Data residency compliance**
   - Given I configure UAE Pass provider
   - Then user data from UAE Pass is stored in UAE data center
   - And audit logs are retained per UAE government requirements

**Data Model**:

| Attribute Name | Data Type | Required | Description |
|----------------|-----------|----------|-------------|
| clientId | String | Yes | UAE Pass client ID |
| clientSecret | String | Yes | UAE Pass client secret |
| environment | Enum | Yes | STAGING or PRODUCTION |
| requiredAuthLevel | Enum | Yes | ANONYMOUS, BASIC, VERIFIED |
| emiratesIdRequired | Boolean | No | Require Emirates ID linkage |
| displayNameAr | String | Yes | Arabic display name |
| languagePreference | String | No | Default: ar |

**Validation Rules**:
- clientId: Required, alphanumeric, max 64 characters
- clientSecret: Required, encrypted at rest
- environment: Required, must be STAGING or PRODUCTION
- requiredAuthLevel: Required for government tenants
- displayNameAr: Required, valid Arabic text

**Business Rules**:
- BR-UAE-001: UAE Pass staging must be tested before production
- BR-UAE-002: Production credentials require TRA approval
- BR-UAE-003: Arabic display name (displayNameAr) is mandatory
- BR-UAE-004: User data must comply with UAE data residency requirements
- BR-UAE-005: Audit logs must be retained for 7 years per government policy

**UI Wireframe**: See `/docs/wireframes/uaepass-config.html`

---

#### US-UAEPASS-002: Login with UAE Pass

**Title**: As a UAE government employee, I want to log in using UAE Pass so that I can access the EMS platform with my verified Emirates identity.

**Priority**: Critical
**Story Points**: 8

**Acceptance Criteria**:

1. **AC-001 (Main Scenario - Happy Path): UAE Pass mobile app authentication**
   - Given UAE Pass is configured for my tenant
   - And I am on the login page (Arabic or English)
   - When I click "Sign in with UAE Pass" / "تسجيل الدخول عبر الهوية الرقمية"
   - Then I am redirected to UAE Pass login page
   - And I see QR code to scan with UAE Pass mobile app
   - And I authenticate via UAE Pass app (biometric/PIN)
   - Then I am redirected back to EMS
   - And I see the dashboard with my Arabic name displayed
   - And my Emirates ID is linked to my account

2. **AC-002 (Alternative Scenario): Web-based OTP authentication**
   - Given I do not have UAE Pass app installed
   - When I click "Sign in with UAE Pass"
   - And I choose "Login with OTP"
   - And I enter my Emirates ID or mobile number
   - Then I receive OTP via SMS
   - And I enter OTP
   - Then I am authenticated and redirected to EMS

3. **AC-003 (Alternative Scenario): First-time login creates account**
   - Given I do not have an EMS account
   - When I log in with UAE Pass for the first time
   - Then a new account is created with my UAE Pass profile:
     - Full name (English and Arabic)
     - Email
     - Emirates ID (if auth level = VERIFIED)
   - And I receive default role for government users

4. **AC-004 (Edge Case): Auth level insufficient**
   - Given UAE Pass is configured with requiredAuthLevel=VERIFIED
   - When I authenticate with UAE Pass at BASIC level
   - Then authentication is rejected
   - And I see "Verified identity required for this application"
   - And I am prompted to upgrade my UAE Pass verification

5. **AC-005 (Edge Case): User without Emirates ID**
   - Given UAE Pass is configured with emiratesIdRequired=true
   - When I authenticate with UAE Pass
   - And my account does not have linked Emirates ID
   - Then authentication is rejected
   - And I see "Emirates ID required for this application"

6. **AC-006 (Error Handling): UAE Pass service unavailable**
   - Given UAE Pass provider is configured
   - When UAE Pass services are unavailable
   - And I click "Sign in with UAE Pass"
   - Then I see "UAE Pass service temporarily unavailable"
   - And I can retry or use alternative login methods

7. **AC-007 (Error Handling): User cancels UAE Pass login**
   - Given I initiated UAE Pass authentication
   - When I cancel the flow
   - Then I am returned to EMS login page
   - And I see "Login cancelled"

8. **AC-008 (Permissions): Expired UAE Pass account**
   - Given my UAE Pass account has expired
   - When I try to authenticate
   - Then authentication fails
   - And I see "Your UAE Pass account has expired. Please renew."

**Business Rules**:
- BR-UAE-006: Government tenants must use VERIFIED auth level
- BR-UAE-007: Arabic names must be displayed when user locale is Arabic
- BR-UAE-008: Session timeout for UAE Pass is 8 hours (government requirement)

---

#### US-UAEPASS-003: UAE Pass Digital Signature Integration

**Title**: As a government employee, I want to digitally sign documents using UAE Pass so that I can approve official documents securely.

**Priority**: Medium
**Story Points**: 8

**Acceptance Criteria**:

1. **AC-001 (Main Scenario - Happy Path): Sign document with UAE Pass**
   - Given I am logged in via UAE Pass with VERIFIED level
   - And I have a document requiring signature
   - When I click "Sign with UAE Pass"
   - Then I receive push notification on UAE Pass app
   - And I confirm with biometric/PIN
   - Then the document receives PKI digital signature
   - And signature metadata is recorded in audit log

2. **AC-002 (Alternative Scenario): Bulk signing**
   - Given I have multiple documents to sign
   - When I select documents and click "Sign All"
   - Then I confirm once in UAE Pass app
   - Then all documents are signed with timestamp

3. **AC-003 (Edge Case): Signature with expired certificate**
   - Given my digital certificate in UAE Pass has expired
   - When I try to sign a document
   - Then signing fails
   - And I see "Please renew your digital certificate in UAE Pass"

4. **AC-004 (Error Handling): UAE Pass app not responding**
   - Given I initiated signing
   - When UAE Pass app does not respond within 2 minutes
   - Then signing request expires
   - And I see "Signing request timed out. Please try again."

---

### 5.3 LDAP/Active Directory User Stories

#### US-LDAP-001: Configure LDAP Provider

**Title**: As a tenant admin, I want to configure LDAP/Active Directory as an identity provider so that on-premise users can authenticate with their corporate credentials.

**Priority**: High
**Story Points**: 8

**Acceptance Criteria**:

1. **AC-001 (Main Scenario - Happy Path): Configure LDAP over SSL**
   - Given I am logged in as a tenant admin
   - When I navigate to Settings > Identity Providers
   - And I click "Add Provider" and select "LDAP/Active Directory"
   - And I enter server URL "ldaps://ad.contoso.com"
   - And I enter port "636"
   - And I enable "Use SSL/TLS"
   - And I enter bind DN "cn=svc-ems,ou=service,dc=contoso,dc=com"
   - And I enter bind password
   - And I enter user search base "ou=users,dc=contoso,dc=com"
   - And I enter user search filter "(sAMAccountName={0})"
   - And I click "Test Connection"
   - Then the system performs LDAP bind with service account
   - And displays "Connection successful - 1,234 users found"
   - And I can save the configuration

2. **AC-002 (Alternative Scenario): Configure LDAP without SSL**
   - Given I am configuring LDAP
   - When I enter server URL "ldap://ad.contoso.com"
   - And I enter port "389"
   - And I do NOT enable SSL
   - Then I see warning "Non-SSL connection is not recommended for production"
   - But I can still save the configuration

3. **AC-003 (Alternative Scenario): Configure with group sync**
   - Given I am configuring LDAP
   - When I enable "Sync Groups"
   - And I enter group search base "ou=groups,dc=contoso,dc=com"
   - And I map LDAP groups to EMS roles:
     - AD group "EMS-Admins" -> EMS role "ADMIN"
     - AD group "EMS-Users" -> EMS role "USER"
   - Then group memberships sync on each login

4. **AC-004 (Alternative Scenario): Configure periodic sync**
   - Given I am configuring LDAP
   - When I enable "Periodic User Sync"
   - And I set sync interval to 60 minutes
   - Then user attributes are synced every 60 minutes
   - And disabled AD users are deactivated in EMS

5. **AC-005 (Edge Case): LDAP server unreachable**
   - Given I am configuring LDAP
   - When I enter unreachable server URL
   - And I click "Test Connection"
   - Then after timeout I see "Unable to connect to LDAP server"
   - And connection details are provided for troubleshooting

6. **AC-006 (Edge Case): Invalid bind credentials**
   - Given I am configuring LDAP
   - When I enter incorrect bind DN or password
   - And I click "Test Connection"
   - Then I see "LDAP bind failed: Invalid credentials"

7. **AC-007 (Permissions): Service account insufficient permissions**
   - Given I am configuring LDAP
   - When the service account lacks search permissions
   - And I click "Test Connection"
   - Then I see "LDAP search failed: Insufficient permissions"
   - And I am advised to check service account ACLs

8. **AC-008 (Error Handling): SSL certificate validation failure**
   - Given I am configuring LDAPS
   - When the server certificate is self-signed or expired
   - And I click "Test Connection"
   - Then I see "SSL certificate validation failed"
   - And I have option to "Trust certificate" (with warning)

**Data Model**:

| Attribute Name | Data Type | Required | Description |
|----------------|-----------|----------|-------------|
| serverUrl | String | Yes | LDAP server URL |
| port | Integer | Yes | LDAP port (389 or 636) |
| useSsl | Boolean | Yes | Enable SSL/TLS |
| bindDn | String | Yes | Service account DN |
| bindPassword | String | Yes | Service account password |
| userSearchBase | String | Yes | User search base DN |
| userSearchFilter | String | Yes | User lookup filter |
| groupSearchBase | String | No | Group search base DN |
| syncEnabled | Boolean | No | Enable periodic sync |
| syncIntervalMinutes | Integer | No | Sync interval |

**Validation Rules**:
- serverUrl: Required, valid LDAP URL format (ldap:// or ldaps://)
- port: Required, valid port number (1-65535)
- bindDn: Required, valid DN format
- bindPassword: Required, encrypted at rest
- userSearchBase: Required, valid DN format
- userSearchFilter: Required, valid LDAP filter syntax with {0} placeholder
- syncIntervalMinutes: If syncEnabled, minimum 15 minutes

**Business Rules**:
- BR-LDAP-001: SSL/TLS is required for production environments
- BR-LDAP-002: Service account should have read-only permissions
- BR-LDAP-003: User search filter must include {0} placeholder for username
- BR-LDAP-004: Connection pool size is limited to 10 connections per tenant

**UI Wireframe**: See `/docs/wireframes/ldap-config.html`

---

#### US-LDAP-002: Login with LDAP Credentials

**Title**: As an end user, I want to log in using my Active Directory credentials so that I can access EMS with my corporate username and password.

**Priority**: High
**Story Points**: 5

**Acceptance Criteria**:

1. **AC-001 (Main Scenario - Happy Path): Successful LDAP authentication**
   - Given LDAP is configured and enabled for my tenant
   - And I am on the login page
   - When I enter my Active Directory username "jsmith"
   - And I enter my Active Directory password
   - And I click "Sign In"
   - Then the system authenticates against LDAP
   - And I am logged in to EMS
   - And I see the dashboard with my AD profile (name, email)
   - And my AD group memberships are mapped to EMS roles

2. **AC-002 (Alternative Scenario): UPN format login**
   - Given LDAP is configured with UPN support
   - When I enter username as "jsmith@contoso.com"
   - And I enter correct password
   - Then I am successfully authenticated

3. **AC-003 (Alternative Scenario): Domain prefix login**
   - Given LDAP is configured
   - When I enter username as "CONTOSO\jsmith"
   - And I enter correct password
   - Then the system strips domain prefix
   - And authenticates with "jsmith"

4. **AC-004 (Edge Case): Locked AD account**
   - Given my AD account is locked due to failed attempts
   - When I try to log in with correct credentials
   - Then authentication fails
   - And I see "Account locked. Contact your administrator."

5. **AC-005 (Edge Case): Expired AD password**
   - Given my AD password has expired
   - When I try to log in
   - Then authentication fails
   - And I see "Password expired. Please change your password in Active Directory."

6. **AC-006 (Error Handling): LDAP server unavailable**
   - Given LDAP server is down
   - When I try to log in
   - Then after timeout I see "Authentication service temporarily unavailable"
   - And I can try again or use alternative methods

7. **AC-007 (Error Handling): Invalid credentials**
   - Given I am on the login page
   - When I enter incorrect password
   - Then I see "Invalid username or password"
   - And failed attempt is logged

8. **AC-008 (Permissions): User not in allowed groups**
   - Given LDAP is configured with allowed groups
   - When I authenticate but I am not in any allowed group
   - Then authentication succeeds but authorization fails
   - And I see "You are not authorized to access this application"

---

#### US-LDAP-003: LDAP User Synchronization

**Title**: As a tenant admin, I want users to be synced from Active Directory so that user accounts are automatically created and updated.

**Priority**: Medium
**Story Points**: 5

**Acceptance Criteria**:

1. **AC-001 (Main Scenario - Happy Path): Scheduled sync**
   - Given LDAP sync is enabled with 60-minute interval
   - When the sync job runs
   - Then new AD users are created in EMS
   - And existing users have attributes updated
   - And users removed from AD are deactivated in EMS
   - And sync summary is logged

2. **AC-002 (Alternative Scenario): Manual sync trigger**
   - Given I am a tenant admin
   - When I click "Sync Now" on the LDAP configuration
   - Then immediate sync is triggered
   - And I see progress indicator
   - And I receive notification when complete

3. **AC-003 (Alternative Scenario): Delta sync**
   - Given LDAP supports delta sync (AD changelog)
   - When sync runs
   - Then only changed users are processed
   - And sync completes faster

4. **AC-004 (Edge Case): Sync with large user base**
   - Given LDAP has 50,000+ users
   - When sync runs
   - Then sync is paginated (1000 users per page)
   - And progress is tracked
   - And timeout is extended

5. **AC-005 (Error Handling): Sync failure**
   - Given LDAP server becomes unreachable during sync
   - When sync fails
   - Then partial results are not committed
   - And admin is notified via email
   - And retry is scheduled

---

### 5.4 IBM IAM (Security Verify) User Stories

#### US-IBM-001: Configure IBM IAM Provider

**Title**: As a tenant admin, I want to configure IBM Security Verify as an identity provider so that users can authenticate using enterprise SAML SSO.

**Priority**: High
**Story Points**: 8

**Acceptance Criteria**:

1. **AC-001 (Main Scenario - Happy Path): Configure via metadata URL**
   - Given I am logged in as a tenant admin
   - When I navigate to Settings > Identity Providers
   - And I click "Add Provider" and select "IBM IAM (Security Verify)"
   - And I enter metadata URL "https://ibm-verify.example.com/saml/metadata"
   - And I click "Fetch Metadata"
   - Then the system fetches and parses SAML metadata
   - And populates SSO URL, SLO URL, signing certificate
   - And I enter SP entity ID "https://ems.example.com/saml/sp"
   - And I click "Test Connection"
   - Then connection test passes
   - And I can save the configuration

2. **AC-002 (Alternative Scenario): Manual configuration**
   - Given metadata URL is not available
   - When I click "Manual Configuration"
   - And I enter SSO URL, SLO URL, signing certificate manually
   - Then I can save the configuration

3. **AC-003 (Alternative Scenario): Configure attribute mappings**
   - Given I am configuring IBM IAM
   - When I map SAML attributes:
     - "http://schemas.xmlsoap.org/claims/EmailAddress" -> email
     - "http://schemas.xmlsoap.org/claims/Group" -> groups
   - Then attributes are mapped on each login

4. **AC-004 (Edge Case): Metadata URL unreachable**
   - Given I enter metadata URL
   - When the URL is unreachable
   - Then I see "Unable to fetch metadata from URL"
   - And I can use manual configuration

5. **AC-005 (Edge Case): Invalid signing certificate**
   - Given I am configuring IBM IAM manually
   - When I enter invalid signing certificate
   - Then validation fails
   - And I see "Invalid X.509 certificate format"

6. **AC-006 (Error Handling): SAML assertion validation failure**
   - Given configuration is incomplete
   - When I click "Test Connection"
   - Then test initiates SP-initiated SSO
   - And if assertion signature validation fails
   - Then I see "SAML assertion validation failed: Invalid signature"

7. **AC-007 (Permissions): Only admins can configure**
   - Given I am not an admin
   - When I try to access IBM IAM configuration
   - Then I receive 403 Forbidden

8. **AC-008 (Validation): Required fields**
   - Given I am configuring IBM IAM
   - When I try to save without SSO URL or signing certificate
   - Then validation fails
   - And I see required field errors

**Data Model**:

| Attribute Name | Data Type | Required | Description |
|----------------|-----------|----------|-------------|
| metadataUrl | String | No | SAML metadata URL |
| entityId | String | Yes | SP entity ID |
| ssoUrl | String | Yes | Single Sign-On URL |
| sloUrl | String | No | Single Logout URL |
| signingCertificate | String | Yes | IdP signing certificate |
| nameIdFormat | Enum | No | NameID format |
| signAuthnRequest | Boolean | No | Sign requests |
| wantAssertionsSigned | Boolean | Yes | Require signed assertions |
| attributeMappings | Map | No | Attribute mappings |

**Validation Rules**:
- metadataUrl: If provided, must be valid URL
- entityId: Required, valid URI format
- ssoUrl: Required, valid HTTPS URL
- signingCertificate: Required, valid X.509 certificate in PEM format
- wantAssertionsSigned: Must be true for production

**Business Rules**:
- BR-IBM-001: SAML assertions must be signed (wantAssertionsSigned=true)
- BR-IBM-002: NameID format should match identity attribute
- BR-IBM-003: SP entity ID must be unique across all tenants

**UI Wireframe**: See `/docs/wireframes/ibm-iam-config.html`

---

#### US-IBM-002: Login with IBM IAM

**Title**: As an end user, I want to log in using IBM Security Verify SSO so that I can access EMS with my corporate IBM identity.

**Priority**: High
**Story Points**: 5

**Acceptance Criteria**:

1. **AC-001 (Main Scenario - Happy Path): SP-initiated SSO**
   - Given IBM IAM is configured for my tenant
   - And I am on the login page
   - When I click "Sign in with IBM Security Verify"
   - Then I am redirected to IBM IAM login page
   - And I authenticate with my IBM credentials
   - Then I receive SAML assertion
   - And I am redirected back to EMS
   - And I see the dashboard with my IBM profile

2. **AC-002 (Alternative Scenario): IdP-initiated SSO**
   - Given I am logged in to IBM IAM portal
   - When I click EMS application tile
   - Then IBM IAM sends SAML assertion to EMS
   - And I am logged in directly without re-authentication

3. **AC-003 (Alternative Scenario): First-time login creates account**
   - Given I do not have an EMS account
   - When I log in with IBM IAM for the first time
   - Then account is created with mapped attributes
   - And I receive default role

4. **AC-004 (Edge Case): SAML assertion expired**
   - Given SAML assertion is older than allowed skew
   - When assertion is processed
   - Then authentication fails
   - And I see "Authentication expired. Please try again."

5. **AC-005 (Edge Case): Assertion signature invalid**
   - Given signing certificate mismatch
   - When assertion is processed
   - Then authentication fails
   - And I see "Security validation failed"
   - And incident is logged

6. **AC-006 (Error Handling): IBM IAM unavailable**
   - Given IBM IAM is unavailable
   - When I click IBM IAM login
   - Then after timeout I see "Identity provider unavailable"

7. **AC-007 (Permissions): User not authorized in IBM IAM**
   - Given I am not assigned to EMS app in IBM IAM
   - When I try to access EMS
   - Then IBM IAM blocks access
   - And I see error in IBM IAM portal

8. **AC-008 (Error Handling): Missing required attributes**
   - Given SAML assertion is missing required attributes
   - When assertion is processed
   - Then authentication fails
   - And I see "Required user attributes missing from identity provider"

---

#### US-IBM-003: Single Logout with IBM IAM

**Title**: As a user, I want single logout to work so that logging out of EMS also logs me out of IBM IAM.

**Priority**: Low
**Story Points**: 3

**Acceptance Criteria**:

1. **AC-001 (Main Scenario - Happy Path): SP-initiated logout**
   - Given I am logged in via IBM IAM
   - And SLO is enabled
   - When I click "Logout" in EMS
   - Then EMS session is terminated
   - And logout request is sent to IBM IAM
   - And I am logged out of IBM IAM
   - And I am redirected to EMS login page

2. **AC-002 (Alternative Scenario): IdP-initiated logout**
   - Given I am logged in to EMS via IBM IAM
   - When I log out from IBM IAM portal
   - Then IBM IAM sends logout request to EMS
   - And EMS session is terminated

3. **AC-003 (Edge Case): SLO disabled**
   - Given SLO is not enabled
   - When I log out from EMS
   - Then only EMS session is terminated
   - And I remain logged in to IBM IAM

---

### 5.5 Keycloak User Stories (Reference - Already Implemented)

#### US-KC-001: Configure Keycloak Provider

**Status**: Already Implemented

**Title**: As a tenant admin, I want to configure Keycloak as the identity provider so that users can authenticate using our managed Keycloak instance.

**Notes**: Keycloak is the default provider and serves as the reference implementation for other OIDC providers.

---

## 6. Business Rules

### 6.1 General Authentication Rules

| Rule ID | Rule Description | Applies To |
|---------|------------------|------------|
| BR-GEN-001 | Each tenant can have multiple identity providers configured | All Providers |
| BR-GEN-002 | At least one enabled provider must exist for tenant login | All Providers |
| BR-GEN-003 | Users can be linked to only one external identity per provider | All Providers |
| BR-GEN-004 | Email-based account linking requires email verification | All Providers |
| BR-GEN-005 | Failed login attempts are rate-limited (5 per minute) | All Providers |
| BR-GEN-006 | Session timeout is 8 hours by default, configurable per tenant | All Providers |
| BR-GEN-007 | Refresh tokens expire after 30 days of inactivity | OIDC, OAuth2 |
| BR-GEN-008 | Audit logs must be retained for minimum 1 year | All Providers |

### 6.2 Provider-Specific Rules

#### Azure AD Rules

| Rule ID | Rule Description |
|---------|------------------|
| BR-AZURE-001 | Discovery URL is auto-generated from tenant ID |
| BR-AZURE-002 | App roles require Azure AD Premium P1 or higher |
| BR-AZURE-003 | Group claims limited to 200 groups (Azure AD limitation) |
| BR-AZURE-004 | B2B guest users must have email verified |
| BR-AZURE-005 | Conditional access policies are enforced by Azure AD |

#### UAE Pass Rules

| Rule ID | Rule Description |
|---------|------------------|
| BR-UAE-001 | Staging environment must be tested before production |
| BR-UAE-002 | Production credentials require TRA approval |
| BR-UAE-003 | Arabic display name (displayNameAr) is mandatory |
| BR-UAE-004 | Data must comply with UAE data residency requirements |
| BR-UAE-005 | Audit logs retained for 7 years (government requirement) |
| BR-UAE-006 | Government tenants must use VERIFIED auth level |
| BR-UAE-007 | Session timeout is 8 hours for government users |
| BR-UAE-008 | Digital signature requires VERIFIED auth level |

#### LDAP Rules

| Rule ID | Rule Description |
|---------|------------------|
| BR-LDAP-001 | SSL/TLS required for production environments |
| BR-LDAP-002 | Service account should have read-only permissions |
| BR-LDAP-003 | User search filter must include {0} placeholder |
| BR-LDAP-004 | Connection pool limited to 10 connections per tenant |
| BR-LDAP-005 | Periodic sync minimum interval is 15 minutes |
| BR-LDAP-006 | Nested group resolution is limited to 5 levels |

#### IBM IAM Rules

| Rule ID | Rule Description |
|---------|------------------|
| BR-IBM-001 | SAML assertions must be signed |
| BR-IBM-002 | NameID format should match identity attribute |
| BR-IBM-003 | SP entity ID must be unique across tenants |
| BR-IBM-004 | Clock skew tolerance is 5 minutes |
| BR-IBM-005 | Assertion validity period is 5 minutes |

### 6.3 Security Rules

| Rule ID | Rule Description | Applies To |
|---------|------------------|------------|
| BR-SEC-001 | All secrets must be encrypted at rest using Jasypt | All Providers |
| BR-SEC-002 | Passwords must never be logged | All Providers |
| BR-SEC-003 | HTTPS required for all OAuth/OIDC endpoints | OIDC, OAuth2 |
| BR-SEC-004 | PKCE required for public clients | OIDC, OAuth2 |
| BR-SEC-005 | Token blacklist checked on each request | OIDC, OAuth2 |
| BR-SEC-006 | LDAP bind password must be unique per tenant | LDAP |
| BR-SEC-007 | SAML assertions must be signed and optionally encrypted | SAML |

---

## 7. Data Models

### 7.1 Provider Configuration Entity

| Attribute Name | Data Type | Required | Description |
|----------------|-----------|----------|-------------|
| id | UUID | Yes | Unique configuration identifier |
| tenantId | String(64) | Yes | Owning tenant identifier |
| providerType | Enum | Yes | AZURE_AD, UAE_PASS, LDAP_GENERIC, IBM_IAM, KEYCLOAK |
| protocol | Enum | Yes | OIDC, OAUTH2, LDAP, SAML |
| displayName | String(100) | Yes | Display name for login page |
| displayNameAr | String(100) | Conditional | Arabic name (required for UAE Pass) |
| iconUrl | String(512) | No | Custom icon URL |
| enabled | Boolean | Yes | Provider active status |
| priority | Integer | Yes | Display order (lower = higher) |
| trustEmail | Boolean | Yes | Trust email from provider |
| linkExistingAccounts | Boolean | Yes | Link accounts by email |
| configuration | JSON | Yes | Provider-specific configuration |
| createdAt | Timestamp | Yes | Creation timestamp |
| updatedAt | Timestamp | Yes | Last update timestamp |
| createdBy | String(64) | Yes | Creator user ID |

### 7.2 User Identity Link Entity

| Attribute Name | Data Type | Required | Description |
|----------------|-----------|----------|-------------|
| id | UUID | Yes | Unique link identifier |
| userId | UUID | Yes | EMS user ID |
| tenantId | String(64) | Yes | Tenant identifier |
| providerType | Enum | Yes | Provider type |
| externalId | String(255) | Yes | External provider user ID |
| email | String(255) | No | Email from provider |
| attributes | JSON | No | Additional provider attributes |
| linkedAt | Timestamp | Yes | Link creation timestamp |
| lastLoginAt | Timestamp | No | Last login via this provider |

### 7.3 Authentication Event Entity

| Attribute Name | Data Type | Required | Description |
|----------------|-----------|----------|-------------|
| id | UUID | Yes | Event identifier |
| tenantId | String(64) | Yes | Tenant identifier |
| userId | UUID | No | EMS user ID (if known) |
| externalId | String(255) | No | External provider user ID |
| providerType | Enum | Yes | Provider type |
| eventType | Enum | Yes | LOGIN, LOGOUT, TOKEN_REFRESH, MFA, FAILURE |
| success | Boolean | Yes | Event success status |
| errorCode | String(50) | No | Error code if failed |
| errorMessage | String(500) | No | Error description |
| ipAddress | String(45) | Yes | Client IP address |
| userAgent | String(500) | No | Browser user agent |
| timestamp | Timestamp | Yes | Event timestamp |
| metadata | JSON | No | Additional event data |

---

## 8. Provider Feature Matrix

| Feature | Azure AD | UAE Pass | LDAP | IBM IAM | Keycloak |
|---------|----------|----------|------|---------|----------|
| **Protocol** | OIDC | OAuth2 | LDAP | SAML | OIDC |
| **SSO** | Yes | Yes | No | Yes | Yes |
| **MFA** | Yes (Authenticator) | Yes (App/OTP) | No | Yes | Yes (TOTP) |
| **Password Login** | Yes | No | Yes | No | Yes |
| **Token Refresh** | Yes | Yes | N/A | N/A | Yes |
| **Group Sync** | Yes | No | Yes | Yes | Yes |
| **Role Mapping** | Yes | No | Yes | Yes | Yes |
| **User Provisioning** | JIT | JIT | Sync | JIT | JIT |
| **Single Logout** | Yes | No | N/A | Yes | Yes |
| **Digital Signature** | No | Yes | No | No | No |
| **Arabic Support** | Partial | Full | No | Partial | Partial |
| **Data Residency** | Global | UAE | On-Prem | Global | Self-Hosted |
| **Gov Compliance** | Medium | High | High | Medium | High |

### 8.1 MFA Capabilities

| Provider | MFA Methods | Notes |
|----------|-------------|-------|
| Azure AD | Microsoft Authenticator, SMS, Phone Call, FIDO2 | Conditional access policies |
| UAE Pass | UAE Pass App (Biometric), OTP | App-based authentication |
| LDAP | Not supported (external) | Requires additional MFA solution |
| IBM IAM | TOTP, Push, SMS | Risk-based authentication |
| Keycloak | TOTP, WebAuthn | Built-in credential management |

### 8.2 User Attribute Availability

| Attribute | Azure AD | UAE Pass | LDAP | IBM IAM | Keycloak |
|-----------|----------|----------|------|---------|----------|
| Email | Always | Always | Always | Always | Always |
| First Name | Always | Always | Always | Mapped | Always |
| Last Name | Always | Always | Always | Mapped | Always |
| Groups | Configurable | No | Always | Mapped | Always |
| Phone | Configurable | Always | Optional | Mapped | Optional |
| Emirates ID | No | If Verified | No | No | No |
| Arabic Name | No | Always | No | No | No |
| Department | Optional | No | Always | Mapped | Optional |
| Job Title | Optional | No | Always | Mapped | Optional |

---

## 9. Non-Functional Requirements

### 9.1 Performance Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-PERF-001 | Login request response time | < 3 seconds (p95) |
| NFR-PERF-002 | Token refresh response time | < 500 milliseconds (p95) |
| NFR-PERF-003 | LDAP authentication response time | < 2 seconds (p95) |
| NFR-PERF-004 | Concurrent authentication requests | 100 per tenant |
| NFR-PERF-005 | LDAP sync throughput | 1000 users per minute |

### 9.2 Availability Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-AVAIL-001 | Authentication service availability | 99.9% uptime |
| NFR-AVAIL-002 | Graceful degradation when IdP unavailable | Yes |
| NFR-AVAIL-003 | Circuit breaker for external providers | Yes |
| NFR-AVAIL-004 | Provider failover (if multiple configured) | Yes |

### 9.3 Security Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-SEC-001 | Secrets encryption at rest | AES-256 |
| NFR-SEC-002 | TLS version for external connections | TLS 1.2+ |
| NFR-SEC-003 | Failed login lockout | 5 attempts, 15 min lockout |
| NFR-SEC-004 | Session token rotation | Every 15 minutes |
| NFR-SEC-005 | Audit log retention | 1 year minimum |
| NFR-SEC-006 | UAE Pass data retention | 7 years (UAE compliance) |

### 9.4 Scalability Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-SCALE-001 | Maximum providers per tenant | 10 |
| NFR-SCALE-002 | Maximum concurrent sessions per user | 5 |
| NFR-SCALE-003 | LDAP connection pool per tenant | 10 connections |
| NFR-SCALE-004 | Provider configuration cache TTL | 5 minutes |

### 9.5 Localization Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-L10N-001 | Login page language support | English, Arabic |
| NFR-L10N-002 | RTL layout support | Required for Arabic |
| NFR-L10N-003 | Provider display names | Multi-language |
| NFR-L10N-004 | Error messages | English, Arabic |

---

## 10. Glossary

| Term | Definition |
|------|------------|
| IdP | Identity Provider - external system that authenticates users |
| SP | Service Provider - EMS application that consumes identity |
| OIDC | OpenID Connect - identity layer on top of OAuth 2.0 |
| SAML | Security Assertion Markup Language - XML-based SSO standard |
| LDAP | Lightweight Directory Access Protocol - directory services protocol |
| SSO | Single Sign-On - authenticate once, access multiple applications |
| SLO | Single Logout - logout from all applications at once |
| MFA | Multi-Factor Authentication - multiple verification methods |
| JIT | Just-In-Time provisioning - create user on first login |
| BFF | Backend-for-Frontend - server-side component handling auth |
| PKCE | Proof Key for Code Exchange - OAuth 2.0 security extension |
| Emirates ID | UAE national identity card number |
| UAE Pass | UAE Government digital identity platform |
| TRA | Telecommunications and Digital Government Regulatory Authority (UAE) |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-02-25 | BA Agent | Initial draft |

---

## Appendices

### Appendix A: UAE Pass API Reference

UAE Pass production endpoints:
- Authorization: `https://id.uaepass.ae/idshub/authorize`
- Token: `https://id.uaepass.ae/idshub/token`
- User Info: `https://id.uaepass.ae/idshub/userinfo`

UAE Pass staging endpoints:
- Authorization: `https://stg-id.uaepass.ae/idshub/authorize`
- Token: `https://stg-id.uaepass.ae/idshub/token`
- User Info: `https://stg-id.uaepass.ae/idshub/userinfo`

### Appendix B: Azure AD Endpoints

Azure AD v2.0 endpoints (replace {tenant} with tenant ID):
- Discovery: `https://login.microsoftonline.com/{tenant}/v2.0/.well-known/openid-configuration`
- Authorization: `https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize`
- Token: `https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token`
- Logout: `https://login.microsoftonline.com/{tenant}/oauth2/v2.0/logout`

### Appendix C: LDAP Search Filter Examples

| Use Case | Filter |
|----------|--------|
| User by sAMAccountName | `(sAMAccountName={0})` |
| User by UPN | `(userPrincipalName={0})` |
| User by email | `(mail={0})` |
| User by sAMAccountName or UPN | `(\|(sAMAccountName={0})(userPrincipalName={0}))` |
| Active users only | `(&(sAMAccountName={0})(!(userAccountControl:1.2.840.113556.1.4.803:=2)))` |

### Appendix D: Handoff to SA Agent

This requirements document should be consumed by the SA Agent to produce:

1. **Technical Design Document** - Detailed technical specification for each provider
2. **API Contract** - OpenAPI specification updates for provider endpoints
3. **Sequence Diagrams** - Authentication flows for each provider
4. **Data Model Updates** - Neo4j schema changes for provider configurations
5. **Security Review** - Security considerations and threat modeling

**Key Technical Decisions Required**:
- Provider implementation pattern (Strategy vs Factory)
- Token storage approach (stateless vs Valkey)
- LDAP connection pooling library selection
- SAML library selection (OpenSAML vs Spring Security SAML)
- UAE Pass SDK integration approach
