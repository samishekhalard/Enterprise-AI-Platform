package com.ems.auth.graph.entity;

import org.springframework.data.neo4j.core.schema.GeneratedValue;
import org.springframework.data.neo4j.core.schema.Id;
import org.springframework.data.neo4j.core.schema.Node;
import org.springframework.data.neo4j.core.support.UUIDStringGenerator;

import java.time.Instant;
import java.util.List;

/**
 * Neo4j Node representing Provider Configuration.
 *
 * Contains the tenant-specific configuration for an identity provider.
 * Sensitive fields (clientSecret, bindPassword) are encrypted using Jasypt.
 *
 * Graph Structure:
 * (Tenant)-[:CONFIGURED_WITH]->(Config)
 * (Provider)-[:HAS_CONFIG]->(Config)
 */
@Node("Config")
public record ConfigNode(

    /**
     * Unique configuration identifier (UUID).
     */
    @Id
    @GeneratedValue(UUIDStringGenerator.class)
    String id,

    /**
     * Reference to the tenant ID (denormalized for query performance).
     */
    String tenantId,

    /**
     * Reference to the provider name (denormalized for query performance).
     */
    String providerName,

    /**
     * Display name for this configuration.
     */
    String displayName,

    /**
     * Protocol type (OIDC, SAML, LDAP, OAUTH2).
     */
    String protocol,

    // ==========================================================================
    // OIDC/OAuth2 Configuration
    // ==========================================================================

    /**
     * OAuth2/OIDC client ID.
     */
    String clientId,

    /**
     * OAuth2/OIDC client secret (encrypted with Jasypt).
     */
    String clientSecretEncrypted,

    /**
     * OIDC discovery URL (/.well-known/openid-configuration).
     */
    String discoveryUrl,

    /**
     * Authorization endpoint URL.
     */
    String authorizationUrl,

    /**
     * Token endpoint URL.
     */
    String tokenUrl,

    /**
     * User info endpoint URL.
     */
    String userInfoUrl,

    /**
     * JWKS URL for token validation.
     */
    String jwksUrl,

    /**
     * Issuer URL for token validation.
     */
    String issuerUrl,

    /**
     * Requested OAuth scopes.
     */
    List<String> scopes,

    // ==========================================================================
    // SAML Configuration
    // ==========================================================================

    /**
     * SAML metadata URL.
     */
    String metadataUrl,

    /**
     * SAML entity ID.
     */
    String entityId,

    /**
     * SAML signing certificate.
     */
    String signingCertificate,

    // ==========================================================================
    // LDAP Configuration
    // ==========================================================================

    /**
     * LDAP server URL.
     */
    String serverUrl,

    /**
     * LDAP server port.
     */
    Integer port,

    /**
     * LDAP bind DN.
     */
    String bindDn,

    /**
     * LDAP bind password (encrypted with Jasypt).
     */
    String bindPasswordEncrypted,

    /**
     * LDAP user search base.
     */
    String userSearchBase,

    /**
     * LDAP user search filter.
     */
    String userSearchFilter,

    /**
     * LDAP user object class (default: person).
     */
    String userObjectClass,

    /**
     * LDAP username attribute (default: sAMAccountName).
     */
    String usernameAttribute,

    /**
     * LDAP email attribute (default: mail).
     */
    String emailAttribute,

    /**
     * LDAP first name attribute (default: givenName).
     */
    String firstNameAttribute,

    /**
     * LDAP last name attribute (default: sn).
     */
    String lastNameAttribute,

    /**
     * LDAP group membership attribute (default: memberOf).
     */
    String memberOfAttribute,

    /**
     * LDAP group search base DN.
     */
    String groupSearchBase,

    /**
     * LDAP group search filter.
     */
    String groupSearchFilter,

    /**
     * Whether to resolve nested LDAP groups (up to 5 levels).
     */
    Boolean resolveNestedGroups,

    /**
     * Whether to enable periodic LDAP user sync.
     */
    Boolean syncEnabled,

    /**
     * LDAP sync interval in minutes (min 15).
     */
    Integer syncIntervalMinutes,

    /**
     * Whether to use SSL/TLS for LDAP connection.
     */
    Boolean useSsl,

    /**
     * LDAP connection timeout in milliseconds.
     */
    Integer connectionTimeout,

    /**
     * LDAP read timeout in milliseconds.
     */
    Integer readTimeout,

    // ==========================================================================
    // Azure AD Specific Configuration
    // ==========================================================================

    /**
     * Azure AD tenant ID (GUID or domain like contoso.onmicrosoft.com).
     */
    String azureTenantId,

    /**
     * Whether to map Azure AD app roles to EMS roles.
     */
    Boolean enableAppRoles,

    /**
     * Whether to include group memberships from Azure AD.
     */
    Boolean enableGroupClaims,

    /**
     * Custom group claim attribute name.
     */
    String groupAttributeName,

    /**
     * Allowed email domains for Azure AD (JSON array as string).
     */
    List<String> allowedDomains,

    // ==========================================================================
    // UAE Pass Specific Configuration
    // ==========================================================================

    /**
     * UAE Pass environment: STAGING or PRODUCTION.
     */
    String uaePassEnvironment,

    /**
     * Required authentication level: ANONYMOUS, BASIC, or VERIFIED.
     */
    String requiredAuthLevel,

    /**
     * Arabic display name (required for UAE Pass).
     */
    String displayNameAr,

    /**
     * Language preference: 'ar' or 'en'.
     */
    String languagePreference,

    /**
     * Whether Emirates ID linkage is required.
     */
    Boolean emiratesIdRequired,

    /**
     * Whether to enable UAE Pass digital signature services.
     */
    Boolean enableDigitalSignature,

    /**
     * OAuth redirect URI.
     */
    String redirectUri,

    // ==========================================================================
    // SAML/IBM IAM Specific Configuration
    // ==========================================================================

    /**
     * SAML Single Sign-On URL.
     */
    String ssoUrl,

    /**
     * SAML Single Logout URL.
     */
    String sloUrl,

    /**
     * SAML Assertion Consumer Service URL.
     */
    String acsUrl,

    /**
     * SP certificate for SAML (PEM format).
     */
    String spCertificate,

    /**
     * SP private key (Jasypt encrypted).
     */
    String spPrivateKeyEncrypted,

    /**
     * SAML NameID format: EMAIL, PERSISTENT, or TRANSIENT.
     */
    String nameIdFormat,

    /**
     * Whether to sign SAML AuthnRequest.
     */
    Boolean signAuthnRequest,

    /**
     * Whether to require signed assertions (should be true for production).
     */
    Boolean wantAssertionsSigned,

    /**
     * Whether to require encrypted assertions.
     */
    Boolean wantAssertionsEncrypted,

    /**
     * Whether to enable SAML Single Logout.
     */
    Boolean enableSlo,

    /**
     * SAML attribute mappings (JSON object as string).
     */
    String attributeMappings,

    // ==========================================================================
    // Common Configuration
    // ==========================================================================

    /**
     * Identity provider hint (for Keycloak kc_idp_hint).
     */
    String idpHint,

    /**
     * Whether this configuration is enabled.
     */
    boolean enabled,

    /**
     * Priority order for display (lower = higher priority).
     */
    int priority,

    /**
     * Whether to trust email addresses from this provider.
     */
    boolean trustEmail,

    /**
     * Whether to store tokens from this provider.
     */
    boolean storeToken,

    /**
     * Whether to link existing accounts by email.
     */
    boolean linkExistingAccounts,

    /**
     * Timestamp when the configuration was created.
     */
    Instant createdAt,

    /**
     * Timestamp when the configuration was last updated.
     */
    Instant updatedAt

) {
    /**
     * Builder for creating ConfigNode instances.
     */
    public static Builder builder() {
        return new Builder();
    }

    /**
     * Check if this is an OIDC configuration.
     */
    public boolean isOidc() {
        return "OIDC".equalsIgnoreCase(protocol);
    }

    /**
     * Check if this is a SAML configuration.
     */
    public boolean isSaml() {
        return "SAML".equalsIgnoreCase(protocol);
    }

    /**
     * Check if this is an LDAP configuration.
     */
    public boolean isLdap() {
        return "LDAP".equalsIgnoreCase(protocol);
    }

    /**
     * Check if this is an OAuth2 configuration.
     */
    public boolean isOauth2() {
        return "OAUTH2".equalsIgnoreCase(protocol);
    }

    /**
     * Builder class for ConfigNode.
     */
    public static class Builder {
        private String id;
        private String tenantId;
        private String providerName;
        private String displayName;
        private String protocol;

        // OIDC/OAuth2
        private String clientId;
        private String clientSecretEncrypted;
        private String discoveryUrl;
        private String authorizationUrl;
        private String tokenUrl;
        private String userInfoUrl;
        private String jwksUrl;
        private String issuerUrl;
        private List<String> scopes;

        // SAML
        private String metadataUrl;
        private String entityId;
        private String signingCertificate;

        // LDAP
        private String serverUrl;
        private Integer port;
        private String bindDn;
        private String bindPasswordEncrypted;
        private String userSearchBase;
        private String userSearchFilter;
        private String userObjectClass;
        private String usernameAttribute;
        private String emailAttribute;
        private String firstNameAttribute;
        private String lastNameAttribute;
        private String memberOfAttribute;
        private String groupSearchBase;
        private String groupSearchFilter;
        private Boolean resolveNestedGroups;
        private Boolean syncEnabled;
        private Integer syncIntervalMinutes;
        private Boolean useSsl;
        private Integer connectionTimeout;
        private Integer readTimeout;

        // Azure AD
        private String azureTenantId;
        private Boolean enableAppRoles;
        private Boolean enableGroupClaims;
        private String groupAttributeName;
        private List<String> allowedDomains;

        // UAE Pass
        private String uaePassEnvironment;
        private String requiredAuthLevel;
        private String displayNameAr;
        private String languagePreference;
        private Boolean emiratesIdRequired;
        private Boolean enableDigitalSignature;
        private String redirectUri;

        // SAML/IBM IAM
        private String ssoUrl;
        private String sloUrl;
        private String acsUrl;
        private String spCertificate;
        private String spPrivateKeyEncrypted;
        private String nameIdFormat;
        private Boolean signAuthnRequest;
        private Boolean wantAssertionsSigned;
        private Boolean wantAssertionsEncrypted;
        private Boolean enableSlo;
        private String attributeMappings;

        // Common
        private String idpHint;
        private boolean enabled = true;
        private int priority = 100;
        private boolean trustEmail = true;
        private boolean storeToken = false;
        private boolean linkExistingAccounts = true;
        private Instant createdAt;
        private Instant updatedAt;

        public Builder id(String id) { this.id = id; return this; }
        public Builder tenantId(String tenantId) { this.tenantId = tenantId; return this; }
        public Builder providerName(String providerName) { this.providerName = providerName; return this; }
        public Builder displayName(String displayName) { this.displayName = displayName; return this; }
        public Builder protocol(String protocol) { this.protocol = protocol; return this; }
        public Builder clientId(String clientId) { this.clientId = clientId; return this; }
        public Builder clientSecretEncrypted(String clientSecretEncrypted) { this.clientSecretEncrypted = clientSecretEncrypted; return this; }
        public Builder discoveryUrl(String discoveryUrl) { this.discoveryUrl = discoveryUrl; return this; }
        public Builder authorizationUrl(String authorizationUrl) { this.authorizationUrl = authorizationUrl; return this; }
        public Builder tokenUrl(String tokenUrl) { this.tokenUrl = tokenUrl; return this; }
        public Builder userInfoUrl(String userInfoUrl) { this.userInfoUrl = userInfoUrl; return this; }
        public Builder jwksUrl(String jwksUrl) { this.jwksUrl = jwksUrl; return this; }
        public Builder issuerUrl(String issuerUrl) { this.issuerUrl = issuerUrl; return this; }
        public Builder scopes(List<String> scopes) { this.scopes = scopes; return this; }
        public Builder metadataUrl(String metadataUrl) { this.metadataUrl = metadataUrl; return this; }
        public Builder entityId(String entityId) { this.entityId = entityId; return this; }
        public Builder signingCertificate(String signingCertificate) { this.signingCertificate = signingCertificate; return this; }
        public Builder serverUrl(String serverUrl) { this.serverUrl = serverUrl; return this; }
        public Builder port(Integer port) { this.port = port; return this; }
        public Builder bindDn(String bindDn) { this.bindDn = bindDn; return this; }
        public Builder bindPasswordEncrypted(String bindPasswordEncrypted) { this.bindPasswordEncrypted = bindPasswordEncrypted; return this; }
        public Builder userSearchBase(String userSearchBase) { this.userSearchBase = userSearchBase; return this; }
        public Builder userSearchFilter(String userSearchFilter) { this.userSearchFilter = userSearchFilter; return this; }
        public Builder userObjectClass(String userObjectClass) { this.userObjectClass = userObjectClass; return this; }
        public Builder usernameAttribute(String usernameAttribute) { this.usernameAttribute = usernameAttribute; return this; }
        public Builder emailAttribute(String emailAttribute) { this.emailAttribute = emailAttribute; return this; }
        public Builder firstNameAttribute(String firstNameAttribute) { this.firstNameAttribute = firstNameAttribute; return this; }
        public Builder lastNameAttribute(String lastNameAttribute) { this.lastNameAttribute = lastNameAttribute; return this; }
        public Builder memberOfAttribute(String memberOfAttribute) { this.memberOfAttribute = memberOfAttribute; return this; }
        public Builder groupSearchBase(String groupSearchBase) { this.groupSearchBase = groupSearchBase; return this; }
        public Builder groupSearchFilter(String groupSearchFilter) { this.groupSearchFilter = groupSearchFilter; return this; }
        public Builder resolveNestedGroups(Boolean resolveNestedGroups) { this.resolveNestedGroups = resolveNestedGroups; return this; }
        public Builder syncEnabled(Boolean syncEnabled) { this.syncEnabled = syncEnabled; return this; }
        public Builder syncIntervalMinutes(Integer syncIntervalMinutes) { this.syncIntervalMinutes = syncIntervalMinutes; return this; }
        public Builder useSsl(Boolean useSsl) { this.useSsl = useSsl; return this; }
        public Builder connectionTimeout(Integer connectionTimeout) { this.connectionTimeout = connectionTimeout; return this; }
        public Builder readTimeout(Integer readTimeout) { this.readTimeout = readTimeout; return this; }
        public Builder azureTenantId(String azureTenantId) { this.azureTenantId = azureTenantId; return this; }
        public Builder enableAppRoles(Boolean enableAppRoles) { this.enableAppRoles = enableAppRoles; return this; }
        public Builder enableGroupClaims(Boolean enableGroupClaims) { this.enableGroupClaims = enableGroupClaims; return this; }
        public Builder groupAttributeName(String groupAttributeName) { this.groupAttributeName = groupAttributeName; return this; }
        public Builder allowedDomains(List<String> allowedDomains) { this.allowedDomains = allowedDomains; return this; }
        public Builder uaePassEnvironment(String uaePassEnvironment) { this.uaePassEnvironment = uaePassEnvironment; return this; }
        public Builder requiredAuthLevel(String requiredAuthLevel) { this.requiredAuthLevel = requiredAuthLevel; return this; }
        public Builder displayNameAr(String displayNameAr) { this.displayNameAr = displayNameAr; return this; }
        public Builder languagePreference(String languagePreference) { this.languagePreference = languagePreference; return this; }
        public Builder emiratesIdRequired(Boolean emiratesIdRequired) { this.emiratesIdRequired = emiratesIdRequired; return this; }
        public Builder enableDigitalSignature(Boolean enableDigitalSignature) { this.enableDigitalSignature = enableDigitalSignature; return this; }
        public Builder redirectUri(String redirectUri) { this.redirectUri = redirectUri; return this; }
        public Builder ssoUrl(String ssoUrl) { this.ssoUrl = ssoUrl; return this; }
        public Builder sloUrl(String sloUrl) { this.sloUrl = sloUrl; return this; }
        public Builder acsUrl(String acsUrl) { this.acsUrl = acsUrl; return this; }
        public Builder spCertificate(String spCertificate) { this.spCertificate = spCertificate; return this; }
        public Builder spPrivateKeyEncrypted(String spPrivateKeyEncrypted) { this.spPrivateKeyEncrypted = spPrivateKeyEncrypted; return this; }
        public Builder nameIdFormat(String nameIdFormat) { this.nameIdFormat = nameIdFormat; return this; }
        public Builder signAuthnRequest(Boolean signAuthnRequest) { this.signAuthnRequest = signAuthnRequest; return this; }
        public Builder wantAssertionsSigned(Boolean wantAssertionsSigned) { this.wantAssertionsSigned = wantAssertionsSigned; return this; }
        public Builder wantAssertionsEncrypted(Boolean wantAssertionsEncrypted) { this.wantAssertionsEncrypted = wantAssertionsEncrypted; return this; }
        public Builder enableSlo(Boolean enableSlo) { this.enableSlo = enableSlo; return this; }
        public Builder attributeMappings(String attributeMappings) { this.attributeMappings = attributeMappings; return this; }
        public Builder idpHint(String idpHint) { this.idpHint = idpHint; return this; }
        public Builder enabled(boolean enabled) { this.enabled = enabled; return this; }
        public Builder priority(int priority) { this.priority = priority; return this; }
        public Builder trustEmail(boolean trustEmail) { this.trustEmail = trustEmail; return this; }
        public Builder storeToken(boolean storeToken) { this.storeToken = storeToken; return this; }
        public Builder linkExistingAccounts(boolean linkExistingAccounts) { this.linkExistingAccounts = linkExistingAccounts; return this; }
        public Builder createdAt(Instant createdAt) { this.createdAt = createdAt; return this; }
        public Builder updatedAt(Instant updatedAt) { this.updatedAt = updatedAt; return this; }

        public ConfigNode build() {
            return new ConfigNode(
                id, tenantId, providerName, displayName, protocol,
                clientId, clientSecretEncrypted, discoveryUrl, authorizationUrl, tokenUrl,
                userInfoUrl, jwksUrl, issuerUrl, scopes,
                metadataUrl, entityId, signingCertificate,
                serverUrl, port, bindDn, bindPasswordEncrypted, userSearchBase, userSearchFilter,
                userObjectClass, usernameAttribute, emailAttribute, firstNameAttribute,
                lastNameAttribute, memberOfAttribute, groupSearchBase, groupSearchFilter,
                resolveNestedGroups, syncEnabled, syncIntervalMinutes, useSsl, connectionTimeout,
                readTimeout, azureTenantId, enableAppRoles, enableGroupClaims, groupAttributeName,
                allowedDomains, uaePassEnvironment, requiredAuthLevel, displayNameAr,
                languagePreference, emiratesIdRequired, enableDigitalSignature, redirectUri,
                ssoUrl, sloUrl, acsUrl, spCertificate, spPrivateKeyEncrypted, nameIdFormat,
                signAuthnRequest, wantAssertionsSigned, wantAssertionsEncrypted, enableSlo,
                attributeMappings, idpHint, enabled, priority, trustEmail, storeToken, linkExistingAccounts,
                createdAt, updatedAt
            );
        }
    }
}
