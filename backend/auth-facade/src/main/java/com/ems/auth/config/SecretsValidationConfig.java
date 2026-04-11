package com.ems.auth.config;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

/**
 * Validates that required secrets are configured at startup.
 * Only active in non-local and non-test profiles to prevent
 * misconfigured deployments reaching production.
 *
 * <p>Secrets validated:</p>
 * <ul>
 *   <li>JASYPT_PASSWORD - Encryption master key (mandatory)</li>
 *   <li>NEO4J_PASSWORD - Neo4j database password</li>
 *   <li>KEYCLOAK_CLIENT_SECRET - Keycloak OAuth client secret</li>
 * </ul>
 */
@Configuration
@Profile("!local & !test")
@Slf4j
public class SecretsValidationConfig {

    @Value("${jasypt.encryptor.password:}")
    private String jasyptPassword;

    @Value("${spring.neo4j.authentication.password:}")
    private String neo4jPassword;

    @Value("${keycloak.client.client-secret:}")
    private String keycloakClientSecret;

    @Value("${token.mfa-signing-key:}")
    private String mfaSigningKey;

    @PostConstruct
    public void validateSecrets() {
        var missing = new java.util.ArrayList<String>();

        if (isBlank(jasyptPassword)) {
            missing.add("JASYPT_PASSWORD (jasypt.encryptor.password)");
        }
        if (isBlank(neo4jPassword)) {
            missing.add("NEO4J_PASSWORD (spring.neo4j.authentication.password)");
        }
        if (isBlank(keycloakClientSecret)) {
            missing.add("KEYCLOAK_CLIENT_SECRET (keycloak.client.client-secret)");
        }
        if (isBlank(mfaSigningKey)) {
            missing.add("MFA_SIGNING_KEY (token.mfa-signing-key)");
        }

        if (!missing.isEmpty()) {
            String msg = "SECURITY: Required secrets are not configured: " + String.join(", ", missing);
            log.error(msg);
            throw new IllegalStateException(msg);
        }

        log.info("All required secrets are configured");
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
