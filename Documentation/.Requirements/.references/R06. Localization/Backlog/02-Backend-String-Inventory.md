# Backend Hardcoded String Inventory

**Total: 164 strings | Externalized: 0 | Completion: 0.0%**

---

## Service: auth-facade (38 strings)

### Exception Messages (34)

| File | Line | Message | i18n Code |
|------|------|---------|-----------|
| EventController.java | 217 | "Not authenticated" | AUTH-E-001 |
| EventController.java | 222 | "Insufficient permissions - admin role required" | AUTH-E-002 |
| AuthController.java | 233 | "Not authenticated" | AUTH-E-001 |
| AuthController.java | 272 | "Not authenticated" | AUTH-E-001 |
| RealmResolver.java | 41 | "tenantId must not be null or blank" | AUTH-E-003 |
| KeycloakIdentityProvider.java | 96 | "Authentication failed: {0}" | AUTH-E-004 |
| KeycloakIdentityProvider.java | 119 | "Invalid or expired refresh token" | AUTH-E-005 |
| KeycloakIdentityProvider.java | 121 | "Token refresh failed: {0}" | AUTH-E-006 |
| KeycloakIdentityProvider.java | 225 | "Failed to setup MFA" | AUTH-E-007 |
| KeycloakIdentityProvider.java | 413 | "Failed to process authentication response" | AUTH-E-008 |
| TenantAccessValidator.java | 53 | "Access denied: not authenticated" | AUTH-E-009 |
| JwtTokenValidator.java | 50 | "Token has expired" | AUTH-E-010 |
| JwtTokenValidator.java | 53 | "Invalid or malformed token" | AUTH-E-011 |
| JwtTokenValidator.java | 101 | "Invalid token format" | AUTH-E-012 |
| JwtTokenValidator.java | 108 | "Token missing key ID" | AUTH-E-013 |
| JwtTokenValidator.java | 115 | "Failed to parse token header" | AUTH-E-014 |
| JwtTokenValidator.java | 138 | "Unknown signing key" | AUTH-E-015 |
| JwtTokenValidator.java | 173 | "Unable to validate token signature" | AUTH-E-016 |
| JwtTokenValidator.java | 186 | "Failed to fetch JWKS: HTTP {0}" | AUTH-E-017 |
| JwtTokenValidator.java | 199 | "Failed to fetch JWKS: {0}" | AUTH-E-018 |
| InternalServiceTokenProvider.java | 60 | "service-auth.client-secret must be configured" | AUTH-E-019 |
| InternalServiceTokenProvider.java | 82 | "Token endpoint did not return access_token" | AUTH-E-020 |
| JasyptEncryptionService.java | 28 | "Encryption failed" | AUTH-E-021 |
| JasyptEncryptionService.java | 41 | "Decryption failed" | AUTH-E-022 |
| SeatValidationService.java | 53 | "License service error: {0}" | AUTH-E-023 |
| SeatValidationService.java | 65 | "License service unavailable" | AUTH-E-024 |
| TokenServiceImpl.java | 58 | "Token has expired" | AUTH-E-010 |
| TokenServiceImpl.java | 61 | "Invalid or malformed token" | AUTH-E-011 |
| TokenServiceImpl.java | 137 | "Invalid MFA session token" | AUTH-E-025 |
| TokenServiceImpl.java | 143 | "MFA session expired or invalid" | AUTH-E-026 |
| TokenServiceImpl.java | 151 | "Invalid MFA session token" | AUTH-E-025 |
| AuthServiceImpl.java | 175 | "Invalid MFA code" | AUTH-E-027 |
| AuthServiceImpl.java | 181 | "MFA session expired" | AUTH-E-026 |
| KeycloakServiceImpl.java | 92 | "Authentication failed: {0}" | AUTH-E-004 |

### Validation Messages (4)

| File | Annotation | Message | i18n Code |
|------|-----------|---------|-----------|
| ProviderConfigRequest.java | @NotBlank | "Provider name is required" | AUTH-V-001 |
| ProviderConfigRequest.java | @Size | "Provider name must not exceed 50 characters" | AUTH-V-002 |
| ProviderConfigRequest.java | @NotNull | "Protocol is required" | AUTH-V-003 |
| ProviderConfigRequest.java | @Pattern | "Protocol must be one of: OIDC, SAML, LDAP, OAUTH2" | AUTH-V-004 |

---

## Service: license-service (31 strings)

### Exception Messages (23)

| File | Line | Message | i18n Code |
|------|------|---------|-----------|
| LicenseSignatureVerifier.java | 85 | "Public key PEM file not found on classpath: {0}" | LIC-E-001 |
| LicenseSignatureVerifier.java | 109 | "Failed to load public key for kid: {0}" | LIC-E-002 |
| LicenseImportServiceImpl.java | 69 | "License file signature verification failed" | LIC-E-003 |
| LicenseImportServiceImpl.java | 88 | "License product '{0}' does not match expected '{1}'" | LIC-E-004 |
| LicenseImportServiceImpl.java | 104 | "License has already expired at {0}" | LIC-E-005 |
| LicenseImportServiceImpl.java | 110 | "License '{0}' has been revoked" | LIC-E-006 |
| LicenseImportServiceImpl.java | 117 | "License must contain at least one tenant" | LIC-E-007 |
| LicenseImportServiceImpl.java | 122 | "License contains {0} tenants but maxTenants is {1}" | LIC-E-008 |
| LicenseImportServiceImpl.java | 232 | "Tenant '{0}' expiry exceeds application expiry" | LIC-E-009 |
| LicenseImportServiceImpl.java | 239 | "Tenant '{0}' has feature '{1}' not in application feature set" | LIC-E-010 |
| LicenseImportServiceImpl.java | 255 | "Tenant '{0}' is missing seat allocation configuration" | LIC-E-011 |
| LicenseImportServiceImpl.java | 262 | "Tenant '{0}' is missing seat allocation for tier {1}" | LIC-E-012 |
| LicenseImportServiceImpl.java | 270 | "Tenant '{0}' must have at least 1 TENANT_ADMIN seat" | LIC-E-013 |
| LicenseImportServiceImpl.java | 298 | "License file format is invalid. Expected header---payload---signature." | LIC-E-014 |
| LicenseImportServiceImpl.java | 315 | "License file header is missing the KID" | LIC-E-015 |
| LicenseImportServiceImpl.java | 322 | "License file signature is not valid Base64" | LIC-E-016 |
| LicenseImportServiceImpl.java | 337 | "License payload is not valid JSON: {0}" | LIC-E-017 |
| LicenseImportServiceImpl.java | 344 | "Required field '{0}' is missing from license payload" | LIC-E-018 |
| LicenseImportServiceImpl.java | 370 | "Field '{0}' is not a valid ISO-8601 timestamp: {1}" | LIC-E-019 |
| LicenseImportServiceImpl.java | 384 | "Field '{0}' is not a valid string array" | LIC-E-021 |
| SeatManagementController.java | 75 | "Request tenantId does not match path tenantId" | LIC-E-022 |
| SeatManagementController.java | 88 | "User already has a seat assignment in tenant '{0}'" | LIC-E-023 |
| SeatManagementController.java | 94 | "No available seats for tier {0} in tenant '{1}'" | LIC-E-024 |

### Validation Messages (8)

| File | Message | i18n Code |
|------|---------|-----------|
| FeatureGateCheckRequest.java | "Tenant ID is required" | LIC-V-001 |
| FeatureGateCheckRequest.java | "Feature key is required" | LIC-V-002 |
| SeatAssignmentRequest.java | "User ID is required" | LIC-V-003 |
| SeatAssignmentRequest.java | "Tenant ID is required" | LIC-V-004 |
| SeatAssignmentRequest.java | "User tier is required" | LIC-V-005 |
| LicenseImportRequest.java | "License file content is required" | LIC-V-006 |
| SeatValidationRequest.java | "Tenant ID is required" | LIC-V-007 |
| SeatValidationRequest.java | "User ID is required" | LIC-V-008 |

---

## Service: localization-service (11 strings)

| File | Line | Message | i18n Code |
|------|------|---------|-----------|
| LocaleService.java | 84 | "Cannot deactivate alternative locale. Change the alternative locale first." | LOC-E-001 |
| LocaleService.java | 89 | "Cannot deactivate the last active locale. Activate another locale first." | LOC-E-002 |
| LocaleService.java | 106 | "Locale must be active to be set as alternative." | LOC-E-003 |
| DictionaryService.java | 189 | "CSV file is empty." | LOC-E-004 |
| DictionaryService.java | 236 | "Failed to parse CSV: {0}" | LOC-E-005 |
| DictionaryService.java | 250 | "Failed to serialize preview: {0}" | LOC-E-006 |
| DictionaryService.java | 272 | "Import preview expired or not found. Please re-upload the file." | LOC-E-007 |
| DictionaryService.java | 279 | "Invalid preview data." | LOC-E-008 |
| DictionaryService.java | 381 | "Version {0} has no snapshot data to restore." | LOC-E-009 |
| DictionaryService.java | 417 | "Failed to restore snapshot: {0}" | LOC-E-010 |
| DictionaryService.java | 514 | "Import rate limit exceeded. Maximum {0} imports per hour." | LOC-E-011 |

---

## Service: tenant-service (19 strings)

| File | Line | Message | i18n Code |
|------|------|---------|-----------|
| TenantController.java | 414 | "Authenticated principal is required" | TEN-E-001 |
| TenantController.java | 423 | "Access denied to tenant: {0}" | TEN-E-002 |
| TenantServiceImpl.java | 105 | "Tenant with slug already exists: {0}" | TEN-E-003 |
| TenantServiceImpl.java | 195 | "Cannot modify protected tenant identity fields" | TEN-E-004 |
| TenantServiceImpl.java | 227 | "Cannot delete protected tenant" | TEN-E-005 |
| TenantServiceImpl.java | 243 | "Cannot lock protected tenant" | TEN-E-006 |
| TenantServiceImpl.java | 265 | "Cannot suspend protected tenant" | TEN-E-007 |
| TenantServiceImpl.java | 278 | "Only PENDING tenants can be activated. Current status: {0}" | TEN-E-008 |
| TenantServiceImpl.java | 292 | "Cannot suspend protected tenant." | TEN-E-009 |
| TenantServiceImpl.java | 295 | "Only ACTIVE tenants can be suspended. Current status: {0}" | TEN-E-010 |
| TenantServiceImpl.java | 316 | "Only SUSPENDED tenants can be reactivated. Current status: {0}" | TEN-E-011 |
| TenantServiceImpl.java | 335 | "Cannot decommission protected tenant." | TEN-E-012 |
| TenantServiceImpl.java | 338 | "Only SUSPENDED tenants can be decommissioned. Current status: {0}" | TEN-E-013 |
| TenantServiceImpl.java | 390 | "Domain already registered: {0}" | TEN-E-014 |
| TenantServiceImpl.java | 448 | "Cannot remove primary domain" | TEN-E-015 |
| TenantServiceImpl.java | 508 | "Branding policy violations: {0}" | TEN-E-016 |
| TenantServiceImpl.java | 594 | "componentTokens payload exceeds 512 KB limit" | TEN-E-017 |
| TenantServiceImpl.java | 598 | "Failed to serialize componentTokens" | TEN-E-018 |
| TenantServiceImpl.java | 676 | "Tenant identifier is required" | TEN-E-019 |

---

## Service: ai-service (32 strings)

### Exception Messages (25)

| File | Line | Message | i18n Code |
|------|------|---------|-----------|
| StreamController.java | 45 | "Authenticated JWT subject is required" | AI-E-001 |
| RagServiceImpl.java | 57 | "Not authorized to upload to this agent" | AI-E-002 |
| RagServiceImpl.java | 91 | "Not authorized to add source to this agent" | AI-E-003 |
| RagServiceImpl.java | 123 | "Not authorized to delete this source" | AI-E-004 |
| RagServiceImpl.java | 203 | "No embedding provider available" | AI-E-005 |
| RagServiceImpl.java | 272 | "Unsupported file type: {0}" | AI-E-006 |
| AgentServiceImpl.java | 64 | "Not authorized to update this agent" | AI-E-011 |
| AgentServiceImpl.java | 98 | "Not authorized to delete this agent" | AI-E-012 |
| AgentServiceImpl.java | 102 | "Cannot delete system agents" | AI-E-013 |
| AnthropicProvider.java | 124 | "Anthropic API error: {0}" | AI-E-014 |
| AnthropicProvider.java | 150 | "Anthropic does not support embeddings" | AI-E-015 |
| OpenAiProvider.java | 123 | "OpenAI API error: {0}" | AI-E-016 |
| OllamaProvider.java | 160 | "Ollama API error: {0}" | AI-E-019 |
| GeminiProvider.java | 115 | "Gemini API error: {0}" | AI-E-008 |
| LlmProviderFactory.java | 35 | "Provider not found: {0}" | AI-E-017 |
| LlmProviderFactory.java | 38 | "Provider is not enabled: {0}" | AI-E-018 |
| *Provider.java (multiple) | - | "Failed to generate embedding: {0}" | AI-E-009 |
| *Provider.java (multiple) | - | "Failed to parse response" | AI-E-010 |

### Validation Messages (7)

| File | Message | i18n Code |
|------|---------|-----------|
| SendMessageRequest.java | "Message content is required" | AI-V-001 |
| CreateConversationRequest.java | "Agent ID is required" | AI-V-002 |
| CreateAgentRequest.java | "Agent name is required" | AI-V-003 |
| CreateAgentRequest.java | "Name must not exceed 100 characters" | AI-V-004 |
| CreateAgentRequest.java | "System prompt is required" | AI-V-005 |
| CreateAgentRequest.java | "Provider is required" | AI-V-006 |
| CreateAgentRequest.java | "Model is required" | AI-V-007 |

---

## Service: notification-service (7 strings)

| File | Line | Message | i18n Code |
|------|------|---------|-----------|
| NotificationController.java | 110 | "Authenticated JWT subject is required" | NOT-E-001 |
| PreferenceController.java | 58 | "Authenticated JWT subject is required" | NOT-E-001 |
| EmailServiceImpl.java | 47 | "Failed to send email" | NOT-E-002 |
| NotificationServiceImpl.java | 268 | "Email recipient address is required" | NOT-E-003 |
| TemplateServiceImpl.java | 33 | "Template already exists" | NOT-E-004 |
| TemplateServiceImpl.java | 84 | "System templates cannot be modified" | NOT-E-005 |
| TemplateServiceImpl.java | 107 | "System templates cannot be deleted" | NOT-E-006 |

---

## Service: user-service (3 strings)

| File | Line | Message | i18n Code |
|------|------|---------|-----------|
| KeycloakSyncService.java | 91 | "Failed to create user in Keycloak: {0}" | USR-E-001 |
| KeycloakSyncService.java | 122 | "Failed to delete user in Keycloak" | USR-E-002 |
| UserController.java | 298 | "Authenticated JWT subject is required" | USR-E-003 |

---

## Service: definition-service (14 validation strings)

| File | Message | i18n Code |
|------|---------|-----------|
| AddAttributeRequest.java | "AttributeTypeId is required" | DEF-V-001 |
| AddConnectionRequest.java | "TargetObjectTypeId is required" | DEF-V-002 |
| AddConnectionRequest.java | "RelationshipKey is required" | DEF-V-003 |
| AddConnectionRequest.java | "RelationshipKey must be at most 100 characters" | DEF-V-004 |
| AddConnectionRequest.java | "Cardinality is required" | DEF-V-005 |
| AddConnectionRequest.java | "Cardinality must be at most 20 characters" | DEF-V-006 |
| AttributeTypeCreateRequest.java | "Name is required" | DEF-V-007 |
| AttributeTypeCreateRequest.java | "Name must be at most 255 characters" | DEF-V-008 |
| AttributeTypeCreateRequest.java | "AttributeKey is required" | DEF-V-009 |
| AttributeTypeCreateRequest.java | "AttributeKey must be at most 100 characters" | DEF-V-010 |
| AttributeTypeCreateRequest.java | "DataType is required" | DEF-V-011 |
| AttributeTypeCreateRequest.java | "DataType must be at most 30 characters" | DEF-V-012 |
| ObjectTypeCreateRequest.java | "Name is required" | DEF-V-013 |
| ObjectTypeCreateRequest.java | "Name must be at most 255 characters" | DEF-V-014 |

---

## Service: common (9 validation strings)

| File | Message | i18n Code |
|------|---------|-----------|
| RefreshTokenRequest.java | "Refresh token is required" | COM-V-001 |
| MicrosoftTokenRequest.java | "Microsoft access token is required" | COM-V-002 |
| MfaVerifyRequest.java | "MFA session token is required" | COM-V-003 |
| MfaVerifyRequest.java | "TOTP code is required" | COM-V-004 |
| MfaSetupRequest.java | "MFA method is required" | COM-V-005 |
| LogoutRequest.java | "Refresh token is required" | COM-V-001 |
| LoginRequest.java | "Email or username is required" | COM-V-006 |
| LoginRequest.java | "Password is required" | COM-V-007 |
| GoogleTokenRequest.java | "Google ID token is required" | COM-V-008 |

---

## Summary

| Service | Exceptions | Validation | Total |
|---------|-----------|------------|-------|
| auth-facade | 34 | 4 | **38** |
| ai-service | 25 | 7 | **32** |
| license-service | 23 | 8 | **31** |
| tenant-service | 19 | 0 | **19** |
| definition-service | 0 | 14 | **14** |
| localization-service | 11 | 0 | **11** |
| common | 0 | 9 | **9** |
| notification-service | 7 | 0 | **7** |
| user-service | 3 | 0 | **3** |
| audit-service | 0 | 0 | **0** |
| process-service | 0 | 0 | **0** |
| **TOTAL** | **122** | **42** | **164** |

## Error Code Convention

```
{SERVICE_PREFIX}-{TYPE}-{SEQ}

SERVICE_PREFIX: AUTH, LIC, LOC, TEN, USR, NOT, AI, DEF, COM
TYPE: E (exception), V (validation), W (warning)
SEQ: 3-digit zero-padded number

Examples:
  AUTH-E-010  → "Token has expired"
  LIC-V-003  → "User ID is required"
  LOC-E-001  → "Cannot deactivate alternative locale"
```
