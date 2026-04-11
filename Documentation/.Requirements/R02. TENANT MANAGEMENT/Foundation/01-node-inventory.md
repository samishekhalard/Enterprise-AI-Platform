# R02 Foundation Track — 01 Node/Entity Inventory (As-Is)

**Status:** [AS-IS] Complete factual inventory based on codebase inspection
**Date:** 2026-03-24
**Audit Scope:** Backend Java entities, Neo4j graph nodes, PostgreSQL schema, migrations

---

## Executive Summary

The EMSIST platform uses **polyglot persistence**:
- **Neo4j** (graph database) — Identity/RBAC graph with tenant context
- **PostgreSQL** (relational database) — All domain entities including tenants, users, licenses, audit
- **Valkey** (cache) — Non-authoritative provider configs, roles, sessions

All entities examined are **[IMPLEMENTED]** in the codebase via Spring JPA/Data Neo4j annotations.

---

## Node/Entity Summary Table

| # | Node/Entity Name | Database | Service | Classification | Status |
|---|---|---|---|---|---|
| 1 | **Tenant** | PostgreSQL | tenant-service | First-class entity | [AS-IS] |
| 2 | TenantDomain | PostgreSQL | tenant-service | First-class entity | [AS-IS] |
| 3 | TenantAuthProvider | PostgreSQL | tenant-service | First-class entity | [AS-IS] |
| 4 | TenantBranding | PostgreSQL | tenant-service | Configuration/1:1 | [AS-IS] |
| 5 | TenantSessionConfig | PostgreSQL | tenant-service | Configuration/1:1 | [AS-IS] |
| 6 | TenantMFAConfig | PostgreSQL | tenant-service | Configuration/1:1 | [AS-IS] |
| 7 | TenantProvisioningStep | PostgreSQL | tenant-service | Operational log | [AS-IS] |
| 8 | TenantLocale | PostgreSQL | tenant-service | Configuration/composite | [AS-IS] |
| 9 | TenantMessageTranslation | PostgreSQL | tenant-service | Configuration/composite | [AS-IS] |
| 10 | **TenantNode** | Neo4j | auth-facade | Graph root | [AS-IS] |
| 11 | UserNode | Neo4j | auth-facade | Graph hierarchy | [AS-IS] |
| 12 | GroupNode | Neo4j | auth-facade | Graph hierarchy | [AS-IS] |
| 13 | RoleNode | Neo4j | auth-facade | Graph hierarchy | [AS-IS] |
| 14 | ProviderNode | Neo4j | auth-facade | Graph metadata | [AS-IS] |
| 15 | ConfigNode | Neo4j | auth-facade | Graph metadata | [AS-IS] |
| 16 | ProtocolNode | Neo4j | auth-facade | Graph metadata | [AS-IS] |
| 17 | UserProfile | PostgreSQL | user-service | First-class entity | [AS-IS] |
| 18 | UserDevice | PostgreSQL | user-service | First-class entity | [AS-IS] |
| 19 | UserSession | PostgreSQL | user-service | Operational log | [AS-IS] |
| 20 | LicenseFile | PostgreSQL | license-service | First-class entity | [AS-IS] |
| 21 | ApplicationLicense | PostgreSQL | license-service | First-class entity | [AS-IS] |
| 22 | TenantLicense | PostgreSQL | license-service | First-class entity | [AS-IS] |
| 23 | TierSeatAllocation | PostgreSQL | license-service | First-class entity | [AS-IS] |
| 24 | UserLicenseAssignment | PostgreSQL | license-service | First-class entity | [AS-IS] |
| 25 | RevocationEntry | PostgreSQL | license-service | Audit log (immutable) | [AS-IS] |
| 26 | AuditEvent | PostgreSQL | audit-service | Audit log (immutable) | [AS-IS] |
| 27 | Notification | PostgreSQL | notification-service | Operational queue | [AS-IS] |
| 28 | NotificationTemplate | PostgreSQL | notification-service | Configuration | [AS-IS] |
| 29 | NotificationPreference | PostgreSQL | notification-service | Configuration/user-scoped | [AS-IS] |
| 30 | Agent | PostgreSQL | ai-service | First-class entity | [AS-IS] |
| 31 | AgentCategory | PostgreSQL | ai-service | Classification | [AS-IS] |
| 32 | Conversation | PostgreSQL | ai-service | First-class entity | [AS-IS] |
| 33 | Message | PostgreSQL | ai-service | First-class entity | [AS-IS] |
| 34 | KnowledgeSource | PostgreSQL | ai-service | First-class entity | [AS-IS] |
| 35 | KnowledgeChunk | PostgreSQL | ai-service | First-class entity (embedding) | [AS-IS] |
| 36 | BpmnElementType | PostgreSQL | process-service | Configuration | [AS-IS] |
| 37 | MessageRegistry | PostgreSQL | tenant-service | Configuration (immutable) | [AS-IS] |
| 38 | MessageTranslation | PostgreSQL | tenant-service | Configuration (i18n) | [AS-IS] |

---

## Detailed Entity Specifications

### TENANT MANAGEMENT DOMAIN

#### 1. TenantEntity

**Source:** `backend/tenant-service/src/main/java/com/ems/tenant/entity/TenantEntity.java`
**Database:** PostgreSQL (`tenants` table)
**PK:** `id` (VARCHAR 50, format: `tenant-{uuid8}`)
**Parent:** None (root entity)
**Children:** TenantDomain (1:many), TenantAuthProvider (1:many), TenantBranding (1:1), TenantSessionConfig (1:1), TenantMFAConfig (1:1)

**Key Fields:**
- `id` (PK)
- `uuid` (UNIQUE, cross-service reference)
- `fullName`, `shortName`, `slug` (UNIQUE)
- `status` (enum: PROVISIONING, PROVISIONING_FAILED, ACTIVE, LOCKED, SUSPENDED, PENDING, DELETION_PENDING, DELETION_FAILED, DELETED, RESTORING, DECOMMISSIONED)
- `tenantType` (enum: MASTER, DOMINANT, REGULAR)
- `tier` (enum: FREE, STANDARD, PROFESSIONAL, ENTERPRISE)
- `keycloakRealm` (reference to Keycloak realm)
- `suspensionReason`, `suspensionNotes`, `suspendedAt`, `estimatedReactivationDate`
- `defaultLocale` (default: "en")
- `isProtected` (boolean, prevents deletion)
- `version` (optimistic locking)
- `createdAt`, `updatedAt`, `createdBy`

---

#### 2. TenantDomainEntity

**Source:** `backend/tenant-service/src/main/java/com/ems/tenant/entity/TenantDomainEntity.java`
**Database:** PostgreSQL (`tenant_domains` table)
**PK:** `id` (VARCHAR 50, format: `domain-{uuid8}`)
**FK:** `tenant_id` → TenantEntity

**Key Fields:**
- `id` (PK)
- `tenantId` (FK)
- `domain` (VARCHAR 255, UNIQUE)
- `isPrimary`, `isVerified`
- `verificationToken`, `verificationMethod` (enum: DNS_TXT, DNS_CNAME, FILE)
- `sslStatus` (enum: PENDING, PROVISIONING, ACTIVE, FAILED)
- `sslCertificateId`, `sslExpiresAt`, `verifiedAt`
- `createdAt`

**Constraints:**
- One domain per tenant may be marked `isPrimary = true`
- Domain must be globally unique
- Cascade delete with tenant

---

#### 3. TenantAuthProviderEntity

**Source:** `backend/tenant-service/src/main/java/com/ems/tenant/entity/TenantAuthProviderEntity.java`
**Database:** PostgreSQL (`tenant_auth_providers` table)
**PK:** `id` (VARCHAR 50, format: `auth-{uuid8}`)
**FK:** `tenant_id` → TenantEntity

**Key Fields:**
- `id` (PK)
- `tenantId` (FK)
- `type` (enum: LOCAL, AZURE_AD, SAML, OIDC, LDAP, UAEPASS)
- `name`, `displayName` (VARCHAR 100)
- `icon`, `config` (JSONB, protocol-specific settings)
- `isEnabled`, `isPrimary` (booleans)
- `sortOrder` (for display priority)
- `createdAt`, `updatedAt`

**Note:** This is PostgreSQL metadata. The graph-based provider config lives in Neo4j ConfigNode.

---

#### 4. TenantBrandingEntity

**Source:** `backend/tenant-service/src/main/java/com/ems/tenant/entity/TenantBrandingEntity.java`
**Database:** PostgreSQL (`tenant_branding` table)
**PK:** `tenantId` (VARCHAR 50, @MapsId 1:1)

**Key Fields (Neumorphic Design System):**
- **Colors:** `primaryColor`, `primaryColorDark`, `secondaryColor` (hex format)
- **Surfaces:** `surfaceColor`, `textColor`, `shadowDarkColor`, `shadowLightColor`
- **Media URLs:** `logoUrl`, `logoUrlDark`, `faviconUrl`, `loginBackgroundUrl`
- **Typography:** `fontFamily` (default: "'Gotham Rounded', 'Nunito', sans-serif")
- **Shape:** `cornerRadius` (default: 16), `buttonDepth` (default: 12), `shadowIntensity` (default: 50)
- **Behavior:** `hoverButton`, `hoverCard`, `hoverInput`, `hoverNav`, `hoverTableRow` (lift/press/slide/highlight)
- **Advanced:** `componentTokens` (JSON overrides per component)
- `customCss` (TEXT for tenant-specific styling)
- `softShadows`, `compactNav` (booleans)
- `updatedAt`

**Constraints:** 1:1 with Tenant, cascade delete

---

#### 5. TenantSessionConfigEntity

**Source:** `backend/tenant-service/src/main/java/com/ems/tenant/entity/TenantSessionConfigEntity.java`
**Database:** PostgreSQL (`tenant_session_config` table)
**PK:** `tenantId` (VARCHAR 50, @MapsId 1:1)

**Key Fields:**
- `accessTokenLifetime` (int, minutes, default: 5)
- `refreshTokenLifetime` (int, minutes, default: 1440 = 24h)
- `idleTimeout` (int, minutes, default: 30)
- `absoluteTimeout` (int, minutes, default: 480 = 8h)
- `maxConcurrentSessions` (int, default: 5)
- `updatedAt`

---

#### 6. TenantMFAConfigEntity

**Source:** `backend/tenant-service/src/main/java/com/ems/tenant/entity/TenantMFAConfigEntity.java`
**Database:** PostgreSQL (`tenant_mfa_config` table)
**PK:** `tenantId` (VARCHAR 50, @MapsId 1:1)

**Key Fields:**
- `enabled`, `required` (booleans)
- `allowedMethods` (ARRAY: ["totp", "email"], default)
- `defaultMethod` (enum: TOTP, EMAIL)
- `gracePeriodDays` (int, default: 7)
- `updatedAt`

---

#### 7. TenantProvisioningStepEntity

**Source:** `backend/tenant-service/src/main/java/com/ems/tenant/entity/TenantProvisioningStepEntity.java`
**Database:** PostgreSQL (`tenant_provisioning_steps` table)
**PK:** `id` (auto-increment Long)

**Key Fields:**
- `tenantUuid` (UUID, cross-reference)
- `stepName` (VARCHAR 50)
- `stepOrder` (Integer)
- `status` (enum: PENDING, IN_PROGRESS, COMPLETED, FAILED)
- `errorMessage` (TEXT)
- `completedAt`, `createdAt`, `updatedAt`

**Note:** Tracks the multi-step provisioning workflow (Keycloak setup, database creation, etc.)

---

#### 8. TenantLocaleEntity

**Source:** `backend/tenant-service/src/main/java/com/ems/tenant/entity/TenantLocaleEntity.java`
**Database:** PostgreSQL (`tenant_locales` table)
**PK:** Composite (@IdClass): `tenantUuid` + `localeCode`

**Key Fields:**
- `tenantUuid` (UUID)
- `localeCode` (VARCHAR 10, e.g., "en", "ar", "fr")
- `createdAt`

**Purpose:** Defines which locales are enabled per tenant.

---

#### 9. TenantMessageTranslationEntity

**Source:** `backend/tenant-service/src/main/java/com/ems/tenant/entity/TenantMessageTranslationEntity.java`
**Database:** PostgreSQL (`tenant_message_translation` table)
**PK:** Composite (@IdClass): `tenantUuid` + `code` + `localeCode`

**Key Fields:**
- `tenantUuid`, `code`, `localeCode` (composite PK)
- `title`, `detail` (localized text)
- `createdAt`, `updatedAt`

**Purpose:** Tenant-specific message overrides (e.g., custom error messages in tenant's language).

---

### AUTHENTICATION & IDENTITY GRAPH DOMAIN (Neo4j)

#### 10. TenantNode

**Source:** `backend/auth-facade/src/main/java/com/ems/auth/graph/entity/TenantNode.java`
**Database:** Neo4j (label: `:Tenant`)
**Node Type:** Record (immutable)

**Key Fields:**
- `id` (String, @Id) — matches PostgreSQL Tenant.id
- `domain` (primary domain)
- `name` (tenant display name)
- `active` (boolean)
- `createdAt`, `updatedAt`

**Relationships:**
```
(Tenant)-[:USES]->(Provider)
(Tenant)-[:CONFIGURED_WITH]->(Config)
```

**Note:** Root of the identity hierarchy. One TenantNode per tenant.

---

#### 11. UserNode

**Source:** `backend/auth-facade/src/main/java/com/ems/auth/graph/entity/UserNode.java`
**Database:** Neo4j (label: `:User`)

**Key Fields:**
- `id` (String, @Id) — UUID from Keycloak
- `email`, `firstName`, `lastName`
- `tenantId` (String, denormalized for query performance)
- `active`, `emailVerified`
- `externalId` (federated user reference)
- `identityProvider` (which provider authenticated this user)
- `createdAt`, `updatedAt`, `lastLoginAt`

**Relationships:**
```
(User)-[:MEMBER_OF]->(Group)
(User)-[:HAS_ROLE]->(Role)
(User)-[:BELONGS_TO]->(Tenant)
```

**Note:** Graph nodes are synchronized from Keycloak and PostgreSQL UserProfile.

---

#### 12. GroupNode

**Source:** `backend/auth-facade/src/main/java/com/ems/auth/graph/entity/GroupNode.java`
**Database:** Neo4j (label: `:Group`)

**Key Fields:**
- `id` (String, @Id) — UUID
- `name`, `displayName`, `description`
- `tenantId` (String)
- `systemGroup` (boolean, system groups cannot be deleted)
- `createdAt`, `updatedAt`

**Relationships:**
```
(User)-[:MEMBER_OF]->(Group)
(Group)-[:HAS_ROLE]->(Role)
(Group)-[:CHILD_OF]->(Group)
```

---

#### 13. RoleNode

**Source:** `backend/auth-facade/src/main/java/com/ems/auth/graph/entity/RoleNode.java`
**Database:** Neo4j (label: `:Role`)

**Key Fields:**
- `name` (String, @Id) — e.g., "ADMIN", "USER", "VIEWER"
- `displayName`, `description`
- `tenantId` (String, null for global system roles)
- `systemRole` (boolean)
- `createdAt`, `updatedAt`

**Relationships:**
```
(Role)-[:INHERITS_FROM]->(Role)
(User)-[:HAS_ROLE]->(Role)
(Group)-[:HAS_ROLE]->(Role)
```

**Note:** Supports deep role lookup with transitive permission resolution.

---

#### 14. ProviderNode

**Source:** `backend/auth-facade/src/main/java/com/ems/auth/graph/entity/ProviderNode.java`
**Database:** Neo4j (label: `:Provider`)

**Key Fields:**
- `name` (String, @Id) — e.g., "KEYCLOAK", "GOOGLE", "AZURE_AD"
- `vendor` (e.g., "Keycloak", "Google", "Microsoft")
- `displayName`, `description`
- `iconUrl`

**Relationships:**
```
(Provider)-[:SUPPORTS]->(Protocol)
(Tenant)-[:USES]->(Provider)
```

**Note:** Global provider definitions (system-wide, shared across tenants).

---

#### 15. ConfigNode

**Source:** `backend/auth-facade/src/main/java/com/ems/auth/graph/entity/ConfigNode.java`
**Database:** Neo4j (label: `:Config`)

**Key Fields (Multi-Protocol):**
- `id` (UUID, @Id, auto-generated)
- `tenantId`, `providerName` (denormalized)
- `displayName`
- `protocol` (VARCHAR 20: OIDC, SAML, LDAP, OAUTH2)
- `enabled`, `priority`, `trustEmail`, `storeToken`, `linkExistingAccounts`
- `createdAt`, `updatedAt`

**Sub-fields by Protocol:**

*OIDC/OAuth2:*
- `clientId`, `clientSecretEncrypted` (Jasypt)
- `discoveryUrl`, `authorizationUrl`, `tokenUrl`, `userInfoUrl`
- `jwksUrl`, `issuerUrl`, `scopes` (List)

*SAML:*
- `metadataUrl`, `entityId`, `signingCertificate`
- `ssoUrl`, `sloUrl`, `acsUrl`
- `spCertificate`, `spPrivateKeyEncrypted`
- `nameIdFormat` (EMAIL, PERSISTENT, TRANSIENT)
- `signAuthnRequest`, `wantAssertionsSigned`, `wantAssertionsEncrypted`
- `enableSlo`, `attributeMappings` (JSON)

*LDAP:*
- `serverUrl`, `port`, `bindDn`, `bindPasswordEncrypted`
- `userSearchBase`, `userSearchFilter`, `userObjectClass`
- `usernameAttribute`, `emailAttribute`, `firstNameAttribute`, `lastNameAttribute`
- `memberOfAttribute`, `groupSearchBase`, `groupSearchFilter`
- `resolveNestedGroups`, `syncEnabled`, `syncIntervalMinutes`
- `useSsl`, `connectionTimeout`, `readTimeout`

*Azure AD:*
- `azureTenantId`, `enableAppRoles`, `enableGroupClaims`
- `groupAttributeName`, `allowedDomains` (List)

*UAE Pass:*
- `uaePassEnvironment`, `requiredAuthLevel`
- `displayNameAr`, `languagePreference`
- `emiratesIdRequired`, `enableDigitalSignature`, `redirectUri`

**Constraints:**
- Tenant-specific configuration
- Sensitive fields encrypted with Jasypt
- Single configuration per (Tenant, Provider, Protocol)

---

#### 16. ProtocolNode

**Source:** `backend/auth-facade/src/main/java/com/ems/auth/graph/entity/ProtocolNode.java`
**Database:** Neo4j (label: `:Protocol`)

**Key Fields:**
- `type` (String, @Id) — "OIDC", "SAML", "LDAP", "OAUTH2"
- `version` (e.g., "1.0", "2.0")
- `displayName`, `description`

**Relationships:**
```
(Provider)-[:SUPPORTS]->(Protocol)
```

**Note:** Global protocol catalog (system-wide).

---

### USER & DEVICE MANAGEMENT DOMAIN (PostgreSQL)

#### 17. UserProfileEntity

**Source:** `backend/user-service/src/main/java/com/ems/user/entity/UserProfileEntity.java`
**Database:** PostgreSQL (`user_profiles` table)
**PK:** `id` (UUID)

**Key Fields:**
- `id` (UUID, @Id)
- `keycloakId` (UUID, UNIQUE, synced from Keycloak)
- `tenantId` (VARCHAR 50, cross-service ref)
- **Identity (from Keycloak):** `email`, `emailVerified`, `firstName`, `lastName`
- **Extended Profile:** `displayName`, `jobTitle`, `department`, `phone`, `mobile`, `officeLocation`
- **Employment:** `employeeId`, `employeeType` (default: "FULL_TIME"), `managerId` (UUID)
- **Preferences:** `avatarUrl`, `timezone` (default: "UTC"), `locale` (default: "en")
- **Security:** `mfaEnabled`, `mfaMethods` (JSONB array), `passwordLastChanged`, `passwordExpiresAt`
- **Account Status:** `accountLocked`, `lockoutEnd`, `failedLoginAttempts` (int, default: 0)
- **Activity:** `lastLoginAt`, `lastLoginIp` (IPv4/IPv6)
- `status` (enum: ACTIVE, INACTIVE, SUSPENDED, PENDING_VERIFICATION, DELETED)
- `version`, `createdAt`, `updatedAt`

**Indexes:**
- `idx_user_profiles_tenant` (tenantId)
- `idx_user_profiles_email` (email)
- `idx_user_profiles_keycloak` (keycloakId)

---

#### 18. UserDeviceEntity

**Source:** `backend/user-service/src/main/java/com/ems/user/entity/UserDeviceEntity.java`
**Database:** PostgreSQL (`user_devices` table)
**PK:** `id` (UUID)
**FK:** `user_id` → UserProfileEntity
**Unique:** (user_id, fingerprint)

**Key Fields:**
- `id`, `userId` (FK), `tenantId` (denormalized)
- `fingerprint` (device identifier, UNIQUE per user)
- `deviceName`, `deviceType` (enum: MOBILE, TABLET, DESKTOP, LAPTOP)
- `osName`, `osVersion`, `browserName`, `browserVersion`
- `trustLevel` (enum: UNKNOWN, LOW, MEDIUM, HIGH, TRUSTED, default: UNKNOWN)
- `isApproved`, `approvedBy` (UUID), `approvedAt`
- `firstSeenAt`, `lastSeenAt`, `lastIpAddress`
- `lastLocation` (JSONB: geo coordinates)
- `loginCount` (int, default: 0)
- `createdAt`, `updatedAt`

**Indexes:**
- `idx_devices_user`, `idx_devices_tenant`, `idx_devices_fingerprint`

---

#### 19. UserSessionEntity

**Source:** `backend/user-service/src/main/java/com/ems/user/entity/UserSessionEntity.java`
**Database:** PostgreSQL (`user_sessions` table)
**PK:** `id` (UUID)

**Key Fields:**
- `id`, `userId`, `tenantId`, `deviceId` (all denormalized for queries)
- `sessionToken` (UNIQUE, VARCHAR 500, encrypted)
- `refreshTokenId` (String, Keycloak reference)
- `ipAddress`, `userAgent` (VARCHAR 500), `location` (JSONB)
- `isRemembered` (boolean)
- `mfaVerified` (boolean, default: false)
- `status` (enum: ACTIVE, EXPIRED, REVOKED, default: ACTIVE)
- `revokedAt`, `revokedBy` (UUID), `revokeReason`
- `createdAt`, `lastActivity`, `expiresAt`

**Methods:**
- `isActive()` — checks status=ACTIVE and expiresAt > now
- `revoke(revokedByUserId, reason)`
- `updateActivity()`

**Indexes:**
- `idx_sessions_user`, `idx_sessions_tenant`, `idx_sessions_expires`, `idx_sessions_status`

---

### LICENSING DOMAIN (PostgreSQL, license-service)

#### 20. LicenseFileEntity

**Source:** `backend/license-service/src/main/java/com/ems/license/entity/LicenseFileEntity.java`
**Database:** PostgreSQL (`license_files` table)
**PK:** `id` (UUID)
**Unique Constraint:** `idx_license_files_active_singleton` (only one active record at a time)

**Key Fields:**
- `id`, `licenseId` (UNIQUE, from payload, e.g., "LIC-2026-0001")
- `formatVersion` (e.g., "1.0")
- `kid` (Key Identifier, selects Ed25519 public key)
- `issuer` (vendor legal name)
- `issuedAt` (Instant)
- `customerId`, `customerName`, `customerCountry` (ISO 3166-1 alpha-2)
- `rawContent` (BYTEA, raw .lic file)
- `payloadJson` (TEXT, decoded JSON)
- `signature` (BYTEA, Ed25519 signature)
- `payloadChecksum` (SHA-256)
- `importStatus` (enum: ACTIVE, SUPERSEDED)
- `importedBy` (UUID, cross-service ref to user-service)
- `version` (optimistic lock)
- `createdAt`, `updatedAt`

**Note:** Immutable after creation. Previous records marked SUPERSEDED.

---

#### 21. ApplicationLicenseEntity

**Source:** `backend/license-service/src/main/java/com/ems/license/entity/ApplicationLicenseEntity.java`
**Database:** PostgreSQL (`application_licenses` table)
**PK:** `id` (UUID)
**FK:** `licenseFileId` → LicenseFileEntity (UNIQUE 1:1)

**Key Fields:**
- `id`, `licenseFileId` (UNIQUE 1:1)
- `product` (VARCHAR 100, must be "EMSIST")
- `versionMin`, `versionMax` (semantic version strings)
- `instanceId` (optional hardware binding)
- `maxTenants` (Integer, platform-wide tenant limit)
- `expiresAt` (Instant)
- `features` (JSONB, List\<String\>, e.g., ["basic_workflows", "advanced_reports"])
- `gracePeriodDays` (default: 30, degraded operation window)
- `degradedFeatures` (JSONB, List\<String\>, disabled during grace)
- `version`, `createdAt`, `updatedAt`

**Note:** Exactly one per active license file.

---

#### 22. TenantLicenseEntity

**Source:** `backend/license-service/src/main/java/com/ems/license/entity/TenantLicenseEntity.java`
**Database:** PostgreSQL (`tenant_licenses` table)
**PK:** `id` (UUID)
**Unique Constraint:** (applicationLicenseId, tenantId)

**Key Fields:**
- `id`, `applicationLicenseId` (FK), `tenantId` (VARCHAR 50)
- `displayName` (tenant name from license file)
- `expiresAt` (≤ application license expiry)
- `features` (JSONB, subset of application features)
- `version`, `createdAt`, `updatedAt`

---

#### 23. TierSeatAllocationEntity

**Source:** `backend/license-service/src/main/java/com/ems/license/entity/TierSeatAllocationEntity.java`
**Database:** PostgreSQL (`tier_seat_allocations` table)
**PK:** `id` (UUID)
**Unique Constraint:** (tenantLicenseId, tier)

**Key Fields:**
- `id`, `tenantLicenseId` (FK)
- `tier` (enum: TENANT_ADMIN, POWER_USER, CONTRIBUTOR, VIEWER)
- `maxSeats` (Integer, -1 = unlimited)
- `version`, `createdAt`, `updatedAt`

**Constraints:**
- Exactly 4 records per TenantLicense (one per tier)
- Enforced by unique constraint and app logic

**Method:** `isUnlimited()` — returns maxSeats == -1

---

#### 24. UserLicenseAssignmentEntity

**Source:** `backend/license-service/src/main/java/com/ems/license/entity/UserLicenseAssignmentEntity.java`
**Database:** PostgreSQL (`user_license_assignments` table)
**PK:** `id` (UUID)
**Unique Constraint:** (userId, tenantId) — one seat per user per tenant

**Key Fields:**
- `id`, `tenantLicenseId` (FK), `userId` (UUID), `tenantId` (denormalized)
- `tier` (enum: TENANT_ADMIN, POWER_USER, CONTRIBUTOR, VIEWER)
- `assignedAt` (Instant, default: now)
- `assignedBy` (UUID, admin who assigned)
- `version`, `createdAt`, `updatedAt`

**Note:** Only entity actively managed at runtime. Drives RBAC sync with auth-facade.

---

#### 25. RevocationEntryEntity

**Source:** `backend/license-service/src/main/java/com/ems/license/entity/RevocationEntryEntity.java`
**Database:** PostgreSQL (`revocation_entries` table)
**PK:** `id` (UUID)
**Immutable** (no @Version, no updatedAt)

**Key Fields:**
- `id`, `revokedLicenseId` (UNIQUE, VARCHAR 100, matches license_files.licenseId)
- `revocationReason` (TEXT)
- `revokedAt` (Instant, when vendor revoked)
- `importedAt` (Instant, default: now, when imported)
- `createdAt` (immutable)

**Note:** Imported from optional `.revoke` file. INSERT-only semantics.

---

### AUDIT & NOTIFICATIONS DOMAIN

#### 26. AuditEventEntity

**Source:** `backend/audit-service/src/main/java/com/ems/audit/entity/AuditEventEntity.java`
**Database:** PostgreSQL (`audit_events` table)
**PK:** `id` (UUID)
**Immutable** (no version, @CreationTimestamp only)

**Key Fields:**
- `id`, `tenantId` (FK), `userId`, `username`, `sessionId`
- `eventType` (VARCHAR 50, e.g., "USER_LOGIN", "TENANT_CREATED")
- `eventCategory` (VARCHAR 50, e.g., "AUTHENTICATION", "TENANT_MANAGEMENT")
- `severity` (default: "INFO" — INFO, WARN, ERROR)
- `message` (TEXT)
- `resourceType`, `resourceId`, `resourceName` (what was acted upon)
- `action` (e.g., CREATE, UPDATE, DELETE)
- `outcome` (default: "SUCCESS" — SUCCESS, FAILURE)
- `failureReason` (TEXT)
- `oldValues`, `newValues` (JSONB, change tracking)
- `ipAddress`, `userAgent`, `requestId`, `correlationId`
- `serviceName` (originating service), `serviceVersion`
- `metadata` (JSONB, additional context)
- `timestamp`, `expiresAt` (for retention policy)

**Indexes:**
- `idx_audit_tenant`, `idx_audit_user`, `idx_audit_event_type`
- `idx_audit_resource` (resourceType, resourceId)
- `idx_audit_timestamp`, `idx_audit_service`

---

#### 27. NotificationEntity

**Source:** `backend/notification-service/src/main/java/com/ems/notification/entity/NotificationEntity.java`
**Database:** PostgreSQL (`notifications` table)
**PK:** `id` (UUID)

**Key Fields:**
- `id`, `tenantId`, `userId`
- `type` (VARCHAR 20: EMAIL, PUSH, IN_APP, SMS)
- `category` (VARCHAR 50: SYSTEM, MARKETING, TRANSACTIONAL, ALERT)
- `subject`, `body`, `bodyHtml`
- `templateId` (UUID), `templateData` (JSONB)
- `status` (default: "PENDING" — PENDING, SENT, DELIVERED, FAILED, READ)
- `recipientAddress` (email, phone, device token)
- `sentAt`, `deliveredAt`, `readAt`, `failedAt`
- `failureReason`, `retryCount`, `maxRetries` (default: 3)
- `priority` (default: "NORMAL" — LOW, NORMAL, HIGH, URGENT)
- `scheduledAt`
- `actionUrl`, `actionLabel`
- `metadata` (JSONB)
- `correlationId` (VARCHAR 100)
- `version`, `createdAt`, `updatedAt`, `expiresAt`

**Indexes:**
- `idx_notification_tenant`, `idx_notification_user`
- `idx_notification_status`, `idx_notification_type`, `idx_notification_created`

---

#### 28. NotificationTemplateEntity

**Source:** `backend/notification-service/src/main/java/com/ems/notification/entity/NotificationTemplateEntity.java`
**Database:** PostgreSQL (`notification_templates` table)
**PK:** `id` (UUID)

**Key Fields:**
- `id`, `tenantId` (nullable, null = system templates)
- `code` (VARCHAR 100, unique per tenant, e.g., "WELCOME_EMAIL")
- `name`, `description`
- `type` (EMAIL, PUSH, IN_APP, SMS)
- `category` (SYSTEM, MARKETING, TRANSACTIONAL, ALERT)
- `subjectTemplate`, `bodyTemplate`, `bodyHtmlTemplate` (TEXT)
- `variables` (JSONB List, variable names used in template)
- `isActive`, `isSystem` (system templates not deletable)
- `locale` (default: "en")
- `createdAt`, `updatedAt`

**Indexes:**
- `idx_template_tenant`, `idx_template_code`, `idx_template_type`

---

#### 29. NotificationPreferenceEntity

**Source:** `backend/notification-service/src/main/java/com/ems/notification/entity/NotificationPreferenceEntity.java`
**Database:** PostgreSQL (`notification_preferences` table)
**PK:** `id` (UUID)
**Composite Index:** (tenantId, userId)

**Key Fields:**
- `id`, `tenantId`, `userId`
- **Channels:** `emailEnabled`, `pushEnabled`, `smsEnabled`, `inAppEnabled` (all boolean)
- **Categories:** `systemNotifications`, `marketingNotifications`, `transactionalNotifications`, `alertNotifications`
- **Quiet Hours:** `quietHoursEnabled`, `quietHoursStart` (HH:mm), `quietHoursEnd`, `timezone` (default: "UTC")
- **Digest:** `digestEnabled`, `digestFrequency` ("DAILY", "WEEKLY")
- `createdAt`, `updatedAt`

---

### AI SERVICES DOMAIN

#### 30. AgentEntity

**Source:** `backend/ai-service/src/main/java/com/ems/ai/entity/AgentEntity.java`
**Database:** PostgreSQL (`agents` table)
**PK:** `id` (UUID)

**Key Fields:**
- `id`, `tenantId`, `ownerId` (UUID)
- `name`, `description`, `avatarUrl`
- `systemPrompt` (TEXT, LLM instruction)
- `greetingMessage`, `conversationStarters` (JSONB List)
- `provider` (enum: OPENAI, ANTHROPIC, GEMINI, OLLAMA)
- `model` (VARCHAR 50)
- `modelConfig` (JSONB, LLM parameters)
- `ragEnabled` (boolean, default: false)
- `categoryId` (FK to AgentCategoryEntity)
- `isPublic`, `isSystem` (booleans)
- `status` (enum: ACTIVE, INACTIVE, DELETED)
- `usageCount` (Long, default: 0)
- `version`, `createdAt`, `updatedAt`

**Indexes:**
- `idx_agents_tenant`, `idx_agents_owner`, `idx_agents_category`, `idx_agents_status`

---

#### 31. AgentCategoryEntity

**Source:** `backend/ai-service/src/main/java/com/ems/ai/entity/AgentCategoryEntity.java`
**Database:** PostgreSQL (`agent_categories` table)
**PK:** `id` (UUID)

**Key Fields:**
- `id`, `name` (UNIQUE), `description`
- `icon` (VARCHAR 50)
- `displayOrder` (Integer)
- `isActive` (boolean)
- `createdAt`, `updatedAt`

---

#### 32. ConversationEntity

**Source:** `backend/ai-service/src/main/java/com/ems/ai/entity/ConversationEntity.java`
**Database:** PostgreSQL (`conversations` table)
**PK:** `id` (UUID)

**Key Fields:**
- `id`, `tenantId`, `userId`
- `agentId` (FK)
- `title` (VARCHAR 200)
- `messageCount` (int, default: 0)
- `totalTokens` (int, default: 0)
- `status` (enum: ACTIVE, ARCHIVED, DELETED)
- `lastMessageAt`
- `createdAt`, `updatedAt`

**Methods:** `incrementMessageCount()`, `addTokens(int)`

**Indexes:**
- `idx_conversations_tenant`, `idx_conversations_user`, `idx_conversations_agent`, `idx_conversations_status`

---

#### 33. MessageEntity

**Source:** `backend/ai-service/src/main/java/com/ems/ai/entity/MessageEntity.java`
**Database:** PostgreSQL (`messages` table)
**PK:** `id` (UUID)

**Key Fields:**
- `id`, `conversationId` (FK)
- `role` (enum: USER, ASSISTANT, SYSTEM)
- `content` (TEXT)
- `tokenCount` (int, default: 0)
- `ragContext` (JSONB, RAG retrieval metadata)
- `metadata` (JSONB)
- `createdAt`

**Indexes:**
- `idx_messages_conversation`, `idx_messages_created`

---

#### 34. KnowledgeSourceEntity

**Source:** `backend/ai-service/src/main/java/com/ems/ai/entity/KnowledgeSourceEntity.java`
**Database:** PostgreSQL (`knowledge_sources` table)
**PK:** `id` (UUID)

**Key Fields:**
- `id`, `agentId` (FK), `tenantId`
- `name`, `description`
- `sourceType` (enum: FILE, URL, TEXT)
- `filePath`, `fileType` (enum: PDF, TXT, MD, CSV, DOCX)
- `fileSize` (Long)
- `url` (VARCHAR 1000)
- `status` (enum: PENDING, PROCESSING, COMPLETED, FAILED)
- `chunkCount` (int, default: 0)
- `errorMessage`, `processedAt`
- `createdAt`, `updatedAt`

**Indexes:**
- `idx_knowledge_sources_agent`, `idx_knowledge_sources_tenant`, `idx_knowledge_sources_status`

---

#### 35. KnowledgeChunkEntity

**Source:** `backend/ai-service/src/main/java/com/ems/ai/entity/KnowledgeChunkEntity.java`
**Database:** PostgreSQL (`knowledge_chunks` table)
**PK:** `id` (UUID)
**Column:** `embedding` (vector(1536), pgvector extension)

**Key Fields:**
- `id`, `sourceId` (FK), `agentId` (UUID, denormalized)
- `content` (TEXT)
- `embedding` (float[1536], pgvector)
- `chunkIndex` (Integer)
- `tokenCount` (int, default: 0)
- `metadata` (JSONB)
- `createdAt`

**Indexes:**
- `idx_knowledge_chunks_source`, `idx_knowledge_chunks_agent`

**Note:** Requires PostgreSQL pgvector extension for vector similarity search.

---

### PROCESS MANAGEMENT DOMAIN

#### 36. BpmnElementTypeEntity

**Source:** `backend/process-service/src/main/java/com/ems/process/entity/BpmnElementTypeEntity.java`
**Database:** PostgreSQL (`bpmn_element_types` table)
**PK:** `id` (UUID)
**Unique Constraint:** (tenantId, code)

**Key Fields:**
- `id`, `tenantId` (nullable, null = system default)
- `code` (VARCHAR 100, e.g., "bpmn:Task", "bpmn:StartEvent")
- `name`, `category` (e.g., "task", "event", "gateway", "data", "artifact", "flow")
- `subCategory` (e.g., "start", "end", "intermediate" for events; "user", "service" for tasks)
- `strokeColor` (hex), `fillColor` (hex), `strokeWidth` (Double, default: 2.0)
- `defaultWidth`, `defaultHeight` (Integer)
- `iconSvg` (TEXT, uses currentColor)
- `sortOrder` (Integer, default: 0)
- `isActive` (boolean, default: true)
- `version`, `createdAt`, `updatedAt`

**Purpose:** Styling and metadata for BPMN diagram rendering. Supports tenant-specific overrides.

---

### MESSAGE MANAGEMENT DOMAIN (Shared)

#### 37. MessageRegistryEntity

**Source:** `backend/tenant-service/src/main/java/com/ems/tenant/entity/MessageRegistryEntity.java`
**Database:** PostgreSQL (`message_registry` table)
**PK:** `code` (VARCHAR 20)
**Immutable** (no updatedAt or version, @CreationTimestamp only)

**Key Fields:**
- `code` (e.g., "E001", "W002", "I003")
- `type` (CHAR(1): 'E'=error, 'W'=warning, 'I'=info)
- `category` (VARCHAR 50: "VALIDATION", "AUTHENTICATION", "AUTHORIZATION", etc.)
- `httpStatus` (Integer, HTTP status code)
- `defaultTitle`, `defaultDetail` (default messages in English)
- `createdAt`, `updatedAt`

**Purpose:** Central registry of all application message codes with HTTP mappings.

---

#### 38. MessageTranslationEntity

**Source:** `backend/tenant-service/src/main/java/com/ems/tenant/entity/MessageTranslationEntity.java`
**Database:** PostgreSQL (`message_translation` table)
**PK:** Composite (@IdClass): `code` + `localeCode`

**Key Fields:**
- `code` (VARCHAR 20, FK to MessageRegistry.code)
- `localeCode` (VARCHAR 10, e.g., "en", "ar", "fr")
- `title`, `detail` (localized text)
- `createdAt`, `updatedAt`

**Purpose:** System-wide message translations. Fallback when tenant doesn't have override.

---

## Key Design Observations

### 1. Multi-Tenancy Architecture
- **Tenant is the isolation boundary:** Every entity has explicit `tenantId` field for query isolation
- **Cross-service references:** Foreign keys not enforced at database level (loose coupling)
- **Keycloak per-tenant realm:** Each tenant has its own Keycloak realm (`keycloakRealm`)
- **Neo4j tenant scoping:** Graph nodes carry denormalized `tenantId` for query isolation (topology decision deferred to deliverable 5)

### 2. Identity Model Duality
- **PostgreSQL:** UserProfile (relational, Keycloak sync)
- **Neo4j:** UserNode (graph, for role resolution)
- **Sync mechanism:** Auth-facade synchronizes Keycloak to Neo4j on user login

### 3. Licensing Model (On-Premise Cryptographic)
- **Signed license files:** Ed25519 digital signature verification
- **Hierarchical entitlements:** Application → Tenant → User Tier
- **Grace period:** Degraded operation window after license expiry (default 30 days)
- **Runtime seat allocation:** Only UserLicenseAssignment is mutable; others imported from file

### 4. Authorization (Graph-Based RBAC)
- **Role inheritance:** RoleNode supports transitive permission lookup via graph traversal
- **Group memberships:** Users inherit roles from groups via `(User)-[:MEMBER_OF]->(Group)`
- **Tenant-scoped roles:** Global system roles (`tenantId=null`) vs. tenant-specific roles (`tenantId` set)

### 5. Provisioning & Configuration
- **TenantProvisioningStep:** Tracks multi-step provisioning workflow (Keycloak, DB, etc.)
- **Session/MFA/Domain config:** Tenant-scoped policy overrides
- **Provider configuration:** Multi-protocol support (OIDC, SAML, LDAP, OAUTH2, UAE Pass)

### 6. Audit & Compliance
- **Immutable audit log:** AuditEventEntity (no updates, @CreationTimestamp only)
- **Change tracking:** oldValues/newValues JSON for before-after snapshots
- **Request correlation:** correlationId, requestId for tracing across services

### 7. AI/RAG Architecture
- **Vector embeddings:** KnowledgeChunk uses pgvector (float[1536])
- **Knowledge sources:** Support FILE (PDF/DOCX/TXT), URL, or raw TEXT
- **Conversation tracking:** Message role (USER/ASSISTANT/SYSTEM), token counting, RAG context

### 8. Notification System
- **Multi-channel:** EMAIL, PUSH, IN_APP, SMS
- **Template-driven:** NotificationTemplate with variable substitution
- **User preferences:** NotificationPreference per tenant+user (quiet hours, digests, categories)

---

## Unresolved Questions

### [PENDING] Cross-Service Foreign Key Strategy
- **Issue:** PostgreSQL entities reference UUID/String IDs from other services without DB-level FKs
- **Question:** Is there a service boundary contract (OpenAPI) that defines these reference types?
- **Example:** `UserLicenseAssignment.userId` references `user-service` but no FK constraint

### [PENDING] Neo4j Synchronization Strategy
- **Issue:** Neo4j nodes (UserNode, RoleNode) must stay in sync with PostgreSQL sources (UserProfile, Keycloak)
- **Question:** What is the sync trigger? (event-driven via message queue, batch, on-login?)
- **Question:** How is eventual consistency handled if sync fails?
- **Question:** Is there a dead-letter queue for failed sync events?

### [PENDING] License File Validation Frequency
- **Issue:** LicenseFileEntity stores rawContent (BYTEA) for "re-verification at startup"
- **Question:** Is this verification only at application startup, or continuous/periodic?
- **Question:** What is the behavior if rawContent verification fails at runtime?

### [PENDING] Role Assignment & UserLicenseAssignment Coupling
- **Issue:** UserLicenseAssignment.tier drives RBAC sync with auth-facade
- **Question:** Is the ROLE_TENANT_ADMIN/ROLE_POWER_USER mapping automatic, or manual?
- **Question:** What prevents manual role assignment from diverging from license tier assignment?

### [PENDING] Tenant Suspension Implementation
- **Issue:** TenantEntity has suspensionReason, suspensionNotes, suspendedAt fields
- **Question:** What is the impact on all child entities (users, licenses, sessions)?
- **Question:** Is suspension a hard block or a soft gate that requires resolution-time checks?
- **Question:** How long before DECOMMISSIONED (soft delete to hard delete)?

### [PENDING] Multi-Provider Config Priority
- **Issue:** ConfigNode has `priority` (int) field; Tenant can have multiple TenantAuthProviders
- **Question:** How is provider priority determined? (priority field, isPrimary flag, isEnabled order?)
- **Question:** Can a disabled provider still be used for "link existing accounts"?

### [PENDING] Message Registry Lifecycle
- **Issue:** MessageRegistryEntity is immutable (no version); used for error/info code mapping
- **Question:** How are new message codes added? (direct DB insert, migration file, seed script?)
- **Question:** Is there a deprecation process for old codes?

### [PENDING] Device Trust & MFA Interaction
- **Issue:** UserDeviceEntity has trustLevel (UNKNOWN, LOW, MEDIUM, HIGH, TRUSTED)
- **Question:** How does deviceTrustLevel interact with TenantMFAConfig.required?
- **Question:** Can a TRUSTED device skip MFA, or is MFA always enforced if tenant.mfaRequired=true?

### [PENDING] Vector Embedding Dimensions
- **Issue:** KnowledgeChunkEntity.embedding is `float[1536]`
- **Question:** Is this fixed to 1536 dimensions, or configurable per LLM?
- **Question:** What happens if an agent switches from OpenAI (1536-dim) to Gemini (768-dim)?

### [PENDING] Tenant Branding Token Overrides
- **Issue:** TenantBrandingEntity.componentTokens is JSONB
- **Question:** Is this a predefined set of tokens, or freeform JSON?
- **Question:** Which design system tokens can be overridden per component?

---

## Not Found in Codebase

- **Process Execution:** No BPMN process instance entities (ProcessInstanceEntity, ProcessActivityEntity)
- **Master Definitions:** Mentioned in canonical model but no @Entity found
- **Integration Events:** No event sourcing entities (EventStoreEntity, DomainEventEntity)

---

## Database Extensions Required

- `uuid-ossp` — UUID generation (confirmed in migration V1__create_tenant_tables.sql)
- `pgcrypto` — Cryptographic functions (confirmed in migration)
- `pgvector` — Vector similarity search (for KnowledgeChunk embeddings)
