package com.ems.auth.service;

import com.ems.common.exception.InvalidTokenException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for TokenService token creation and validation logic.
 * Note: Tests involving Valkey are skipped due to Mockito compatibility issues with Java 25.
 * These should be tested as integration tests with Testcontainers.
 */
class TokenServiceTest {

    @Test
    void isBlacklisted_returnsFalse_forNullJti() {
        // Create a minimal service to test null handling
        // This doesn't require Valkey
        TokenServiceImpl service = createMinimalService();
        assertFalse(service.isBlacklisted(null));
    }

    @Test
    void isBlacklisted_returnsFalse_forEmptyJti() {
        TokenServiceImpl service = createMinimalService();
        assertFalse(service.isBlacklisted(""));
    }

    @Test
    void isBlacklisted_returnsFalse_forBlankJti() {
        TokenServiceImpl service = createMinimalService();
        assertFalse(service.isBlacklisted("   "));
    }

    @Test
    void parseToken_throwsInvalidTokenException_forMalformedToken() {
        TokenServiceImpl service = createMinimalService();

        assertThrows(InvalidTokenException.class, () ->
                service.parseToken("not-a-valid-jwt"));
    }

    @Test
    void parseToken_throwsInvalidTokenException_forEmptyToken() {
        TokenServiceImpl service = createMinimalService();

        assertThrows(InvalidTokenException.class, () ->
                service.parseToken(""));
    }

    private TokenServiceImpl createMinimalService() {
        // Create service with null Valkey template for tests that don't need it
        return new TokenServiceImpl(
                null,
                "auth:blacklist:",
                "auth:mfa:",
                5,
                "test-signing-key-for-unit-tests-only-32-chars"
        );
    }
}
