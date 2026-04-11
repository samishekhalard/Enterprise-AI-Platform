package com.ems.auth.i18n;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;

import java.time.Instant;
import java.util.Locale;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link AuthProblemFactory}.
 *
 * Covers: type URI construction, standard properties, tenantId inclusion/exclusion,
 * extra properties merging, and status propagation.
 */
@ExtendWith(MockitoExtension.class)
class AuthProblemFactoryTest {

    @Mock
    private AuthLocalizedMessageResolver messageResolver;

    @InjectMocks
    private AuthProblemFactory factory;

    // ------------------------------------------------------------------ //
    //  Standard properties
    // ------------------------------------------------------------------ //

    @Nested
    @DisplayName("UT-BE-I18N-010 - Standard ProblemDetail properties")
    class StandardProperties {

        @Test
        @DisplayName("UT-BE-I18N-010a - Should build ProblemDetail with correct type URI, code, error, message, timestamp, locale")
        void shouldBuildProblemDetail_withAllStandardProperties() {
            // Arrange
            var type = AuthProblemType.INVALID_CREDENTIALS;
            var resolved = new AuthLocalizedMessageResolver.ResolvedAuthMessage(
                "AUTH-E-028", "invalid_credentials",
                "Invalid credentials", "Check your email or username and password, then try again.",
                HttpStatus.UNAUTHORIZED, "en"
            );
            when(messageResolver.resolve(eq(type), eq(Locale.ENGLISH), eq("tenant-acme"), anyMap()))
                .thenReturn(resolved);

            // Act
            ProblemDetail problem = factory.create(
                type, Locale.ENGLISH, "tenant-acme", Map.of(), null
            );

            // Assert
            assertThat(problem.getType().toString()).isEqualTo("urn:emsist:auth:auth-e-028");
            assertThat(problem.getTitle()).isEqualTo("Invalid credentials");
            assertThat(problem.getDetail()).isEqualTo("Check your email or username and password, then try again.");
            assertThat(problem.getStatus()).isEqualTo(401);
            assertThat(problem.getProperties()).containsEntry("code", "AUTH-E-028");
            assertThat(problem.getProperties()).containsEntry("error", "invalid_credentials");
            assertThat(problem.getProperties()).containsEntry("message",
                "Check your email or username and password, then try again.");
            assertThat(problem.getProperties()).containsEntry("locale", "en");
            assertThat(problem.getProperties()).containsKey("timestamp");
            assertThat(problem.getProperties().get("timestamp")).isInstanceOf(Instant.class);
        }

        @Test
        @DisplayName("UT-BE-I18N-010b - Should merge 'code' into arguments before calling resolver")
        void shouldMergeCodeIntoArguments() {
            // Arrange
            var type = AuthProblemType.RATE_LIMIT_EXCEEDED;
            var resolved = new AuthLocalizedMessageResolver.ResolvedAuthMessage(
                "AUTH-E-022", "rate_limit_exceeded",
                "Too many attempts", "Try again in 30 seconds.",
                HttpStatus.TOO_MANY_REQUESTS, "en"
            );
            when(messageResolver.resolve(eq(type), any(), any(), argThat(args ->
                args != null && "AUTH-E-022".equals(args.get("code")) && Integer.valueOf(30).equals(args.get("retryAfterSeconds"))
            ))).thenReturn(resolved);

            // Act
            factory.create(type, Locale.ENGLISH, "t1",
                Map.of("retryAfterSeconds", 30), null);

            // Assert - verify resolver was called with merged arguments including code
            verify(messageResolver).resolve(eq(type), eq(Locale.ENGLISH), eq("t1"),
                argThat(args -> "AUTH-E-022".equals(args.get("code"))
                    && Integer.valueOf(30).equals(args.get("retryAfterSeconds"))));
        }
    }

    // ------------------------------------------------------------------ //
    //  Tenant ID handling
    // ------------------------------------------------------------------ //

    @Nested
    @DisplayName("UT-BE-I18N-011 - TenantId inclusion/exclusion")
    class TenantIdHandling {

        @Test
        @DisplayName("UT-BE-I18N-011a - Should include tenantId property when non-null non-blank")
        void shouldIncludeTenantId_whenPresent() {
            // Arrange
            var resolved = resolvedMessage(HttpStatus.UNAUTHORIZED);
            when(messageResolver.resolve(any(), any(), any(), anyMap())).thenReturn(resolved);

            // Act
            ProblemDetail problem = factory.create(
                AuthProblemType.INVALID_CREDENTIALS, Locale.ENGLISH, "tenant-acme", Map.of(), null
            );

            // Assert
            assertThat(problem.getProperties()).containsEntry("tenantId", "tenant-acme");
        }

        @Test
        @DisplayName("UT-BE-I18N-011b - Should exclude tenantId property when null")
        void shouldExcludeTenantId_whenNull() {
            // Arrange
            var resolved = resolvedMessage(HttpStatus.UNAUTHORIZED);
            when(messageResolver.resolve(any(), any(), any(), anyMap())).thenReturn(resolved);

            // Act
            ProblemDetail problem = factory.create(
                AuthProblemType.INVALID_CREDENTIALS, Locale.ENGLISH, null, Map.of(), null
            );

            // Assert
            assertThat(problem.getProperties()).doesNotContainKey("tenantId");
        }

        @Test
        @DisplayName("UT-BE-I18N-011c - Should exclude tenantId property when blank")
        void shouldExcludeTenantId_whenBlank() {
            // Arrange
            var resolved = resolvedMessage(HttpStatus.UNAUTHORIZED);
            when(messageResolver.resolve(any(), any(), any(), anyMap())).thenReturn(resolved);

            // Act
            ProblemDetail problem = factory.create(
                AuthProblemType.INVALID_CREDENTIALS, Locale.ENGLISH, "   ", Map.of(), null
            );

            // Assert
            assertThat(problem.getProperties()).doesNotContainKey("tenantId");
        }
    }

    // ------------------------------------------------------------------ //
    //  Extra properties
    // ------------------------------------------------------------------ //

    @Nested
    @DisplayName("UT-BE-I18N-012 - Extra properties merging")
    class ExtraProperties {

        @Test
        @DisplayName("UT-BE-I18N-012a - Should merge extra properties into ProblemDetail")
        void shouldMergeExtraProperties() {
            // Arrange
            var resolved = resolvedMessage(HttpStatus.FORBIDDEN);
            when(messageResolver.resolve(any(), any(), any(), anyMap())).thenReturn(resolved);

            // Act
            ProblemDetail problem = factory.create(
                AuthProblemType.MFA_REQUIRED, Locale.ENGLISH, "t1", Map.of(),
                Map.of("mfaSessionToken", "tok-abc-123")
            );

            // Assert
            assertThat(problem.getProperties()).containsEntry("mfaSessionToken", "tok-abc-123");
        }

        @Test
        @DisplayName("UT-BE-I18N-012b - Should handle null extra properties without error")
        void shouldHandleNullExtraProperties() {
            // Arrange
            var resolved = resolvedMessage(HttpStatus.UNAUTHORIZED);
            when(messageResolver.resolve(any(), any(), any(), anyMap())).thenReturn(resolved);

            // Act
            ProblemDetail problem = factory.create(
                AuthProblemType.INVALID_CREDENTIALS, Locale.ENGLISH, "t1", Map.of(), null
            );

            // Assert - should still have standard properties, no NPE
            assertThat(problem.getProperties()).containsKey("code");
        }

        @Test
        @DisplayName("UT-BE-I18N-012c - Should merge multiple extra properties")
        void shouldMergeMultipleExtraProperties() {
            // Arrange
            var resolved = resolvedMessage(HttpStatus.TOO_MANY_REQUESTS);
            when(messageResolver.resolve(any(), any(), any(), anyMap())).thenReturn(resolved);

            // Act
            ProblemDetail problem = factory.create(
                AuthProblemType.RATE_LIMIT_EXCEEDED, Locale.ENGLISH, "t1",
                Map.of("retryAfterSeconds", 30),
                Map.of("retryAfter", 30L, "limit", 100)
            );

            // Assert
            assertThat(problem.getProperties()).containsEntry("retryAfter", 30L);
            assertThat(problem.getProperties()).containsEntry("limit", 100);
        }
    }

    // ------------------------------------------------------------------ //
    //  Status propagation
    // ------------------------------------------------------------------ //

    @Nested
    @DisplayName("UT-BE-I18N-013 - Status propagation")
    class StatusPropagation {

        @Test
        @DisplayName("UT-BE-I18N-013a - Should set ProblemDetail status from resolved message")
        void shouldSetStatus_fromResolvedMessage() {
            // Arrange
            var resolved = new AuthLocalizedMessageResolver.ResolvedAuthMessage(
                "AUTH-E-020", "access_denied", "Access denied", "No permission.",
                HttpStatus.FORBIDDEN, "en"
            );
            when(messageResolver.resolve(any(), any(), any(), anyMap())).thenReturn(resolved);

            // Act
            ProblemDetail problem = factory.create(
                AuthProblemType.ACCESS_DENIED, Locale.ENGLISH, "t1", Map.of(), null
            );

            // Assert
            assertThat(problem.getStatus()).isEqualTo(403);
        }
    }

    // ------------------------------------------------------------------ //
    //  Null arguments
    // ------------------------------------------------------------------ //

    @Nested
    @DisplayName("UT-BE-I18N-014 - Null arguments handling")
    class NullArguments {

        @Test
        @DisplayName("UT-BE-I18N-014a - Should handle null arguments map by only passing code")
        void shouldHandleNullArguments() {
            // Arrange
            var resolved = resolvedMessage(HttpStatus.UNAUTHORIZED);
            when(messageResolver.resolve(any(), any(), any(), anyMap())).thenReturn(resolved);

            // Act
            ProblemDetail problem = factory.create(
                AuthProblemType.INVALID_CREDENTIALS, Locale.ENGLISH, "t1", null, null
            );

            // Assert
            assertThat(problem.getProperties()).containsKey("code");
            verify(messageResolver).resolve(eq(AuthProblemType.INVALID_CREDENTIALS), any(), any(),
                argThat(args -> args.containsKey("code") && args.size() == 1));
        }
    }

    // ------------------------------------------------------------------ //
    //  Helpers
    // ------------------------------------------------------------------ //

    private AuthLocalizedMessageResolver.ResolvedAuthMessage resolvedMessage(HttpStatus status) {
        return new AuthLocalizedMessageResolver.ResolvedAuthMessage(
            "TEST-CODE", "test_error", "Test title", "Test detail", status, "en"
        );
    }
}
