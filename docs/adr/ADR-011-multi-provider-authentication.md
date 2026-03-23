# ADR-011: Multi-Provider Authentication Implementation

**Status:** Proposed
**Date:** 2026-02-25
**Decision Makers:** Architecture Team, Security Team
**Category:** Tactical ADR (Implementation Design)
**Extends:** [ADR-007](./ADR-007-auth-facade-provider-agnostic.md), [ADR-009](./ADR-009-auth-facade-neo4j-architecture.md)
**Requirements:** [AUTH-PROVIDERS-REQUIREMENTS.md](../requirements/AUTH-PROVIDERS-REQUIREMENTS.md)

---

## Context and Problem Statement

The EMS platform requires support for multiple identity providers to accommodate diverse enterprise customers. While ADR-007 established the provider-agnostic architecture and ADR-009 defined the Neo4j-based dynamic broker, we now need tactical decisions for implementing four specific providers:

| Provider | Protocol | Business Driver |
|----------|----------|-----------------|
| Azure AD | OIDC | Microsoft 365 enterprise customers |
| UAE Pass | OAuth 2.0 | UAE government compliance (mandatory) |
| LDAP/AD | LDAP v3 | On-premise enterprise customers |
| IBM IAM | SAML 2.0 | IBM enterprise customers |

### Key Questions

1. How do we handle LDAP's lack of OAuth tokens?
2. How do we integrate OpenSAML for IBM IAM?
3. How do we handle UAE Pass's Arabic language requirements?
4. How do we validate authentication levels (UAE Pass VERIFIED)?
5. How do we manage credentials for non-OIDC providers?

---

## Decision Drivers

1. **Consistency**: All providers must implement the same `IdentityProvider` interface
2. **Security**: Credentials encrypted at rest, secure token handling
3. **Tenant Isolation**: Per-tenant provider configuration
4. **Minimal Coupling**: Provider implementations must be pluggable
5. **Government Compliance**: UAE Pass requirements non-negotiable

---

## Decisions

### Decision 1: LDAP Session Token Generation

**Context:** LDAP does not issue OAuth tokens. After bind authentication succeeds, we need to issue a session token for subsequent API calls.

**Decision:** Generate a secure internal session token after successful LDAP bind.

**Implementation:**
```java
// LDAP session token format: ldap:{uuid}:{base64(userDn)}
private String generateSessionToken(String userDn) {
    return "ldap:" + UUID.randomUUID() + ":" +
           Base64.getEncoder().encodeToString(userDn.getBytes(StandardCharsets.UTF_8));
}
```

**Token Characteristics:**
- Prefix: `ldap:` for identification
- UUID: Unique session identifier
- User DN: Encoded for session lookup
- TTL: 8 hours (configurable per tenant)
- Storage: Valkey with encrypted payload

**Consequences:**
- Positive: Consistent token-based API authentication
- Positive: Session tracking and revocation capability
- Negative: Additional Valkey storage overhead
- Negative: No refresh mechanism (re-auth required)

---

### Decision 2: OpenSAML Integration for IBM IAM

**Context:** IBM IAM uses SAML 2.0 protocol. We need a library for SAML processing.

**Decision:** Use OpenSAML 4.x with Spring Security SAML2 extensions.

**Dependencies:**
```xml
<dependency>
    <groupId>org.opensaml</groupId>
    <artifactId>opensaml-core</artifactId>
    <version>4.3.0</version>
</dependency>
<dependency>
    <groupId>org.opensaml</groupId>
    <artifactId>opensaml-saml-api</artifactId>
    <version>4.3.0</version>
</dependency>
<dependency>
    <groupId>org.opensaml</groupId>
    <artifactId>opensaml-saml-impl</artifactId>
    <version>4.3.0</version>
</dependency>
```

**Rationale:**
- OpenSAML is the de facto standard for Java SAML
- Spring Security SAML2 uses OpenSAML internally
- Mature, well-documented, security-audited

**Alternatives Rejected:**
- **pac4j-saml**: Less granular control over SAML processing
- **Spring Security SAML (legacy)**: Deprecated, replaced by SAML2

**Consequences:**
- Positive: Full SAML 2.0 compliance
- Positive: Assertion validation, encryption, signing support
- Negative: Heavyweight dependency (~30 JARs)
- Negative: Complex initialization (OpenSAML bootstrap)

---

### Decision 3: UAE Pass Arabic Language Handling

**Context:** UAE Pass returns user names in both Arabic and English. The `displayNameAr` field is mandatory per business rules.

**Decision:** Store both language variants in `UserInfo` and respect user locale preference.

**Implementation:**
```java
public record UserInfo(
    String userId,
    String email,
    String firstName,        // English
    String lastName,         // English
    String firstNameAr,      // Arabic (nullable)
    String lastNameAr,       // Arabic (nullable)
    String fullNameAr,       // Arabic full name (nullable)
    String locale,           // User's preferred locale
    // ... other fields
) {
    /**
     * Get display name based on locale.
     */
    public String getDisplayName(Locale locale) {
        if ("ar".equals(locale.getLanguage()) && fullNameAr != null) {
            return fullNameAr;
        }
        return firstName + " " + lastName;
    }
}
```

**Storage:** Arabic names stored in Neo4j User node with UTF-8 encoding.

**Consequences:**
- Positive: Full RTL support for Arabic users
- Positive: Complies with UAE government requirements
- Neutral: Additional fields in UserInfo

---

### Decision 4: Authentication Level Validation (UAE Pass)

**Context:** UAE Pass has three authentication levels (ANONYMOUS, BASIC, VERIFIED). Government tenants require VERIFIED level. We need to validate the achieved level against requirements.

**Decision:** Validate authentication level in the token exchange flow, not at initiation.

**Implementation:**
```java
private void validateAuthLevel(UaePassUserInfo userInfo, UaePassConfig config) {
    UaePassAuthLevel achieved = parseAuthLevel(userInfo.acr());
    UaePassAuthLevel required = config.requiredAuthLevel();

    if (achieved.ordinal() < required.ordinal()) {
        throw new AuthenticationException(String.format(
            "Authentication level insufficient. Required: %s, Achieved: %s",
            required, achieved));
    }
}
```

**ACR (Authentication Context Class Reference) Mapping:**
| UAE Pass ACR | EMS Level |
|--------------|-----------|
| `urn:safelayer:...:level:anonymous` | ANONYMOUS |
| `urn:safelayer:...:level:low` | BASIC |
| `urn:safelayer:...:level:substantial` | VERIFIED |

**Consequences:**
- Positive: Clear validation with meaningful error messages
- Positive: Configurable per tenant
- Negative: User must complete UAE Pass flow before rejection

---

### Decision 5: Unified Credential Storage

**Context:** Different providers have different credential types (client secrets, bind passwords, certificates). All must be encrypted at rest.

**Decision:** Use Jasypt encryption for all credential fields with a unified `EncryptionService`.

**Encrypted Fields:**
| Provider | Field | Encryption |
|----------|-------|------------|
| Azure AD | clientSecret | Jasypt AES-256 |
| UAE Pass | clientSecret | Jasypt AES-256 |
| LDAP | bindPassword | Jasypt AES-256 |
| IBM IAM | spPrivateKey | Jasypt AES-256 |
| IBM IAM | signingCertificate | Optional (PEM public cert) |

**Implementation:**
```java
@Service
public class JasyptEncryptionService implements EncryptionService {

    private final StringEncryptor encryptor;

    @Override
    public String encrypt(String plainText) {
        if (plainText == null || plainText.isBlank()) return null;
        return "ENC(" + encryptor.encrypt(plainText) + ")";
    }

    @Override
    public String decrypt(String encryptedText) {
        if (encryptedText == null || !encryptedText.startsWith("ENC(")) {
            return encryptedText; // Return as-is if not encrypted
        }
        String cipherText = encryptedText.substring(4, encryptedText.length() - 1);
        return encryptor.decrypt(cipherText);
    }
}
```

**Key Management:**
- Master encryption key from environment variable: `JASYPT_ENCRYPTOR_PASSWORD`
- Key rotation: Decrypt with old key, re-encrypt with new key
- Never log decrypted values

**Consequences:**
- Positive: Consistent encryption across all providers
- Positive: Secrets never stored in plaintext
- Negative: Key management complexity
- Negative: Cannot search encrypted fields in Neo4j

---

### Decision 6: Connection Testing Per Protocol

**Context:** Each protocol requires different validation logic for connection testing.

**Decision:** Implement protocol-specific connection testers within the `ProviderConnectionTester` service.

**Implementation:**
```java
@Service
public class ProviderConnectionTester {

    public TestConnectionResponse testConnection(String tenantId, String providerId) {
        ProviderConfig config = resolver.resolveProvider(tenantId, providerId);

        return switch (config.protocol()) {
            case "OIDC" -> testOidcConnection(config);
            case "SAML" -> testSamlConnection(config);
            case "LDAP" -> testLdapConnection(config);
            case "OAUTH2" -> testOAuth2Connection(config);
            default -> throw new IllegalArgumentException("Unknown protocol");
        };
    }

    private TestConnectionResponse testOidcConnection(ProviderConfig config) {
        // Fetch and validate .well-known/openid-configuration
        // Verify endpoints are accessible
        // Check JWKS availability
    }

    private TestConnectionResponse testLdapConnection(ProviderConfig config) {
        // Attempt bind with service account
        // Count users in search base
        // Test search filter syntax
    }

    private TestConnectionResponse testSamlConnection(ProviderConfig config) {
        // Fetch and parse IdP metadata
        // Validate signing certificate
        // Check SSO endpoint accessibility
    }
}
```

**Consequences:**
- Positive: Protocol-appropriate validation
- Positive: Meaningful error messages per protocol
- Neutral: Additional code per protocol

---

### Decision 7: MFA Delegation

**Context:** Some providers (Azure AD, UAE Pass) have built-in MFA. LDAP has no MFA. We need a consistent approach.

**Decision:** Delegate MFA to the identity provider. Do not implement MFA in auth-facade for providers that handle it externally.

**MFA Matrix:**
| Provider | MFA Handling | EMS Behavior |
|----------|--------------|--------------|
| Keycloak | EMS-managed TOTP | Full MFA flow |
| Azure AD | Conditional Access | Delegated (MFA at Azure) |
| UAE Pass | Built-in (biometric/PIN) | Delegated |
| LDAP | Not supported | Throw UnsupportedOperationException |
| IBM IAM | Risk-based at IdP | Delegated |

**Implementation:**
```java
// For providers with external MFA
@Override
public MfaSetupResponse setupMfa(String realm, String userId) {
    throw new UnsupportedOperationException(
        "MFA is managed by " + getProviderType() + ". Configure MFA in the identity provider.");
}
```

**Consequences:**
- Positive: No duplicate MFA implementation
- Positive: Leverage provider's MFA capabilities
- Negative: LDAP users have no MFA (requires external solution)

---

### Decision 8: Provider Feature Flags

**Context:** New providers should be disabled by default and enabled per environment.

**Decision:** Use Spring Boot conditional properties for provider activation.

**Configuration:**
```yaml
auth:
  providers:
    azure-ad:
      enabled: ${AUTH_AZURE_AD_ENABLED:false}
    uaepass:
      enabled: ${AUTH_UAEPASS_ENABLED:false}
    ldap:
      enabled: ${AUTH_LDAP_ENABLED:false}
    ibm-iam:
      enabled: ${AUTH_IBM_IAM_ENABLED:false}
```

**Implementation:**
```java
@Service
@ConditionalOnProperty(name = "auth.providers.azure-ad.enabled", havingValue = "true")
public class AzureAdIdentityProvider implements IdentityProvider {
    // Implementation
}
```

**Consequences:**
- Positive: Safe rollout per environment
- Positive: No unnecessary bean loading
- Negative: Requires restart to enable/disable globally

---

## Summary of Decisions

| # | Decision | Impact |
|---|----------|--------|
| 1 | LDAP session token generation | Custom session management |
| 2 | OpenSAML 4.x for SAML | Additional dependencies |
| 3 | Dual-language user names | Extended UserInfo model |
| 4 | Auth level validation on exchange | Post-authentication validation |
| 5 | Unified Jasypt encryption | Consistent credential security |
| 6 | Protocol-specific connection testing | Better diagnostics |
| 7 | MFA delegation | Provider-native MFA |
| 8 | Provider feature flags | Safe rollout |

---

## Implementation Checklist

- [ ] Add OpenSAML 4.x dependencies to pom.xml
- [ ] Extend ProviderType enum with new providers
- [ ] Extend ConfigNode with provider-specific fields
- [ ] Create AzureAdIdentityProvider
- [ ] Create UaePassIdentityProvider
- [ ] Create LdapIdentityProvider
- [ ] Create IbmIamIdentityProvider
- [ ] Create corresponding PrincipalExtractor classes
- [ ] Update ProviderConnectionTester
- [ ] Add feature flag configuration
- [ ] Neo4j migration for new providers
- [ ] Frontend provider templates

---

## References

- [ADR-007: Provider-Agnostic Auth Facade](./ADR-007-auth-facade-provider-agnostic.md)
- [ADR-009: Auth Facade Neo4j Architecture](./ADR-009-auth-facade-neo4j-architecture.md)
- [Auth Providers LLD](../lld/auth-providers-lld.md)
- [EMS Neo4j Database Schema](../data-models/neo4j-ems-db.md)
- [BA Requirements](../requirements/AUTH-PROVIDERS-REQUIREMENTS.md)
- [OpenSAML Documentation](https://shibboleth.atlassian.net/wiki/spaces/OSAML/overview)
- [Azure AD OIDC](https://learn.microsoft.com/en-us/azure/active-directory/develop/v2-protocols-oidc)
- [UAE Pass Integration Guide](https://docs.uaepass.ae/)

---

**Owner:** Solution Architect
**Reviewers:** ARCH, SEC
**Approval Required Before Implementation:** Yes
