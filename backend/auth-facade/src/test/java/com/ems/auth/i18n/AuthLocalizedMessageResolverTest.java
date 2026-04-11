package com.ems.auth.i18n;

import com.ems.auth.client.MessageRegistryClient;
import com.ems.auth.client.ResolvedMessageResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.Locale;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link AuthLocalizedMessageResolver}.
 *
 * Covers: happy-path resolution via Feign, fallback on exception,
 * locale candidate ordering, argument substitution, and orDefault guard.
 */
@ExtendWith(MockitoExtension.class)
class AuthLocalizedMessageResolverTest {

    @Mock
    private MessageRegistryClient messageRegistryClient;

    @InjectMocks
    private AuthLocalizedMessageResolver resolver;

    // ------------------------------------------------------------------ //
    //  Happy-path: client returns a response
    // ------------------------------------------------------------------ //

    @Nested
    @DisplayName("UT-BE-I18N-001 - Happy path: client returns response")
    class HappyPath {

        @Test
        @DisplayName("UT-BE-I18N-001a - Should use response values when client succeeds on first candidate")
        void shouldUseResponseValues_whenClientSucceeds() {
            // Arrange
            var type = AuthProblemType.INVALID_CREDENTIALS;
            var locale = Locale.ENGLISH;
            var tenantId = "tenant-acme";
            var response = new ResolvedMessageResponse(
                "AUTH-E-028", "Custom title", "Custom detail", 401, "en"
            );
            when(messageRegistryClient.resolveMessage("AUTH-E-028", "en", tenantId))
                .thenReturn(response);

            // Act
            var result = resolver.resolve(type, locale, tenantId, Map.of());

            // Assert
            assertThat(result.code()).isEqualTo("AUTH-E-028");
            assertThat(result.legacyError()).isEqualTo("invalid_credentials");
            assertThat(result.title()).isEqualTo("Custom title");
            assertThat(result.detail()).isEqualTo("Custom detail");
            assertThat(result.status()).isEqualTo(HttpStatus.UNAUTHORIZED);
            assertThat(result.locale()).isEqualTo("en");
        }

        @Test
        @DisplayName("UT-BE-I18N-001b - Should use enum httpStatus when response httpStatus is null")
        void shouldUseEnumStatus_whenResponseStatusIsNull() {
            // Arrange
            var type = AuthProblemType.ACCESS_DENIED;
            var response = new ResolvedMessageResponse(
                "AUTH-E-020", "Denied", "Not allowed", null, "en"
            );
            when(messageRegistryClient.resolveMessage("AUTH-E-020", "en", null))
                .thenReturn(response);

            // Act
            var result = resolver.resolve(type, Locale.ENGLISH, null, Map.of());

            // Assert
            assertThat(result.status()).isEqualTo(HttpStatus.FORBIDDEN);
        }

        @Test
        @DisplayName("UT-BE-I18N-001c - Should fall back to second locale candidate when first fails")
        void shouldFallToSecondCandidate_whenFirstFails() {
            // Arrange
            var type = AuthProblemType.INVALID_CREDENTIALS;
            var locale = Locale.forLanguageTag("fr-CA");
            var tenantId = "t1";
            when(messageRegistryClient.resolveMessage("AUTH-E-028", "fr-CA", tenantId))
                .thenThrow(new RuntimeException("not found"));
            var response = new ResolvedMessageResponse(
                "AUTH-E-028", "Titre", "Detail", 401, "fr"
            );
            when(messageRegistryClient.resolveMessage("AUTH-E-028", "fr", tenantId))
                .thenReturn(response);

            // Act
            var result = resolver.resolve(type, locale, tenantId, Map.of());

            // Assert
            assertThat(result.title()).isEqualTo("Titre");
            assertThat(result.locale()).isEqualTo("fr");
        }

        @Test
        @DisplayName("UT-BE-I18N-001d - Should fall back to 'en' candidate when first two fail")
        void shouldFallToEnCandidate_whenOthersFail() {
            // Arrange
            var type = AuthProblemType.INVALID_CREDENTIALS;
            var locale = Locale.forLanguageTag("fr-CA");
            var tenantId = "t1";
            when(messageRegistryClient.resolveMessage("AUTH-E-028", "fr-CA", tenantId))
                .thenThrow(new RuntimeException("not found"));
            when(messageRegistryClient.resolveMessage("AUTH-E-028", "fr", tenantId))
                .thenThrow(new RuntimeException("not found"));
            var response = new ResolvedMessageResponse(
                "AUTH-E-028", "English title", "English detail", 401, "en"
            );
            when(messageRegistryClient.resolveMessage("AUTH-E-028", "en", tenantId))
                .thenReturn(response);

            // Act
            var result = resolver.resolve(type, locale, tenantId, Map.of());

            // Assert
            assertThat(result.title()).isEqualTo("English title");
            assertThat(result.locale()).isEqualTo("en");
        }
    }

    // ------------------------------------------------------------------ //
    //  Fallback: all candidates fail
    // ------------------------------------------------------------------ //

    @Nested
    @DisplayName("UT-BE-I18N-002 - Fallback on exception")
    class FallbackOnException {

        @Test
        @DisplayName("UT-BE-I18N-002a - Should return enum defaults when all locale candidates fail")
        void shouldReturnEnumDefaults_whenAllCandidatesFail() {
            // Arrange
            var type = AuthProblemType.INVALID_CREDENTIALS;
            when(messageRegistryClient.resolveMessage(anyString(), anyString(), anyString()))
                .thenThrow(new RuntimeException("service down"));

            // Act
            var result = resolver.resolve(type, Locale.ENGLISH, "t1", Map.of());

            // Assert
            assertThat(result.code()).isEqualTo("AUTH-E-028");
            assertThat(result.legacyError()).isEqualTo("invalid_credentials");
            assertThat(result.title()).isEqualTo("Invalid credentials");
            assertThat(result.detail()).isEqualTo("Check your email or username and password, then try again.");
            assertThat(result.status()).isEqualTo(HttpStatus.UNAUTHORIZED);
            assertThat(result.locale()).isEqualTo("en");
        }

        @Test
        @DisplayName("UT-BE-I18N-002b - Should return Arabic fallback when locale is Arabic and all fail")
        void shouldReturnArabicFallback_whenArabicLocaleAndAllFail() {
            // Arrange
            var type = AuthProblemType.INVALID_CREDENTIALS;
            var locale = Locale.forLanguageTag("ar-SA");
            when(messageRegistryClient.resolveMessage(anyString(), anyString(), anyString()))
                .thenThrow(new RuntimeException("service down"));

            // Act
            var result = resolver.resolve(type, locale, "t1", Map.of());

            // Assert
            assertThat(result.title()).isEqualTo("\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0627\u0639\u062a\u0645\u0627\u062f \u063a\u064a\u0631 \u0635\u062d\u064a\u062d\u0629");
            assertThat(result.locale()).isEqualTo("ar-SA");
        }

        @Test
        @DisplayName("UT-BE-I18N-002c - Should use Locale.ENGLISH tag when locale is null and all fail")
        void shouldUseEnglishTag_whenLocaleIsNullAndAllFail() {
            // Arrange
            var type = AuthProblemType.ACCESS_DENIED;
            when(messageRegistryClient.resolveMessage(anyString(), anyString(), anyString()))
                .thenThrow(new RuntimeException("service down"));

            // Act
            var result = resolver.resolve(type, null, "t1", Map.of());

            // Assert
            assertThat(result.locale()).isEqualTo("en");
            assertThat(result.title()).isEqualTo("Access denied");
        }
    }

    // ------------------------------------------------------------------ //
    //  Locale candidate ordering
    // ------------------------------------------------------------------ //

    @Nested
    @DisplayName("UT-BE-I18N-003 - Locale candidate ordering")
    class LocaleCandidateOrdering {

        @Test
        @DisplayName("UT-BE-I18N-003a - ar-SA produces [ar-SA, ar, en]")
        void arSa_shouldProduceThreeCandidates() {
            // Arrange
            var type = AuthProblemType.ACCESS_DENIED;
            var locale = Locale.forLanguageTag("ar-SA");
            when(messageRegistryClient.resolveMessage(anyString(), anyString(), anyString()))
                .thenThrow(new RuntimeException("fail"));

            // Act
            resolver.resolve(type, locale, "t1", Map.of());

            // Assert - verify all three candidates were tried in order
            var inOrder = inOrder(messageRegistryClient);
            inOrder.verify(messageRegistryClient).resolveMessage("AUTH-E-020", "ar-SA", "t1");
            inOrder.verify(messageRegistryClient).resolveMessage("AUTH-E-020", "ar", "t1");
            inOrder.verify(messageRegistryClient).resolveMessage("AUTH-E-020", "en", "t1");
            inOrder.verifyNoMoreInteractions();
        }

        @Test
        @DisplayName("UT-BE-I18N-003b - en produces [en] (no duplicates)")
        void en_shouldProduceSingleCandidate() {
            // Arrange
            var type = AuthProblemType.ACCESS_DENIED;
            when(messageRegistryClient.resolveMessage(anyString(), anyString(), anyString()))
                .thenThrow(new RuntimeException("fail"));

            // Act
            resolver.resolve(type, Locale.ENGLISH, "t1", Map.of());

            // Assert - 'en' and language 'en' collapse into one entry via LinkedHashSet
            verify(messageRegistryClient, times(1)).resolveMessage("AUTH-E-020", "en", "t1");
        }

        @Test
        @DisplayName("UT-BE-I18N-003c - null locale defaults to [en]")
        void nullLocale_shouldDefaultToEn() {
            // Arrange
            var type = AuthProblemType.ACCESS_DENIED;
            when(messageRegistryClient.resolveMessage(anyString(), anyString(), anyString()))
                .thenThrow(new RuntimeException("fail"));

            // Act
            resolver.resolve(type, null, "t1", Map.of());

            // Assert
            verify(messageRegistryClient, times(1)).resolveMessage("AUTH-E-020", "en", "t1");
        }

        @Test
        @DisplayName("UT-BE-I18N-003d - fr-CA produces [fr-CA, fr, en]")
        void frCa_shouldProduceThreeCandidates() {
            // Arrange
            var type = AuthProblemType.ACCESS_DENIED;
            var locale = Locale.forLanguageTag("fr-CA");
            when(messageRegistryClient.resolveMessage(anyString(), anyString(), anyString()))
                .thenThrow(new RuntimeException("fail"));

            // Act
            resolver.resolve(type, locale, "t1", Map.of());

            // Assert
            var inOrder = inOrder(messageRegistryClient);
            inOrder.verify(messageRegistryClient).resolveMessage("AUTH-E-020", "fr-CA", "t1");
            inOrder.verify(messageRegistryClient).resolveMessage("AUTH-E-020", "fr", "t1");
            inOrder.verify(messageRegistryClient).resolveMessage("AUTH-E-020", "en", "t1");
        }
    }

    // ------------------------------------------------------------------ //
    //  Argument substitution
    // ------------------------------------------------------------------ //

    @Nested
    @DisplayName("UT-BE-I18N-004 - Argument substitution")
    class ArgumentSubstitution {

        @Test
        @DisplayName("UT-BE-I18N-004a - Should replace {retryAfterSeconds} and {code} in detail from response")
        void shouldReplacePlaceholders_inResponseDetail() {
            // Arrange
            var type = AuthProblemType.RATE_LIMIT_EXCEEDED;
            var response = new ResolvedMessageResponse(
                "AUTH-E-022",
                "Too many attempts",
                "Try again in {retryAfterSeconds} seconds. Code: {code}.",
                429, "en"
            );
            when(messageRegistryClient.resolveMessage(eq("AUTH-E-022"), eq("en"), anyString()))
                .thenReturn(response);

            // Act
            var result = resolver.resolve(type, Locale.ENGLISH, "t1",
                Map.of("retryAfterSeconds", 30, "code", "AUTH-E-022"));

            // Assert
            assertThat(result.detail()).isEqualTo("Try again in 30 seconds. Code: AUTH-E-022.");
        }

        @Test
        @DisplayName("UT-BE-I18N-004b - Should replace placeholders in fallback when all candidates fail")
        void shouldReplacePlaceholders_inFallbackDetail() {
            // Arrange
            var type = AuthProblemType.RATE_LIMIT_EXCEEDED;
            when(messageRegistryClient.resolveMessage(anyString(), anyString(), anyString()))
                .thenThrow(new RuntimeException("fail"));

            // Act
            var result = resolver.resolve(type, Locale.ENGLISH, "t1",
                Map.of("retryAfterSeconds", 60, "code", "AUTH-E-022"));

            // Assert
            assertThat(result.detail()).contains("60 seconds");
            assertThat(result.detail()).contains("AUTH-E-022");
        }

        @Test
        @DisplayName("UT-BE-I18N-004c - Should handle null arguments map gracefully")
        void shouldHandleNullArguments() {
            // Arrange
            var type = AuthProblemType.ACCESS_DENIED;
            when(messageRegistryClient.resolveMessage(anyString(), anyString(), anyString()))
                .thenThrow(new RuntimeException("fail"));

            // Act
            var result = resolver.resolve(type, Locale.ENGLISH, "t1", null);

            // Assert
            assertThat(result.detail()).isEqualTo("You do not have permission to perform this action.");
        }

        @Test
        @DisplayName("UT-BE-I18N-004d - Should handle empty arguments map gracefully")
        void shouldHandleEmptyArguments() {
            // Arrange
            var type = AuthProblemType.ACCESS_DENIED;
            when(messageRegistryClient.resolveMessage(anyString(), anyString(), anyString()))
                .thenThrow(new RuntimeException("fail"));

            // Act
            var result = resolver.resolve(type, Locale.ENGLISH, "t1", Map.of());

            // Assert
            assertThat(result.detail()).isEqualTo("You do not have permission to perform this action.");
        }
    }

    // ------------------------------------------------------------------ //
    //  orDefault: null/blank response fields fall back to enum
    // ------------------------------------------------------------------ //

    @Nested
    @DisplayName("UT-BE-I18N-005 - orDefault null/blank guard")
    class OrDefaultGuard {

        @Test
        @DisplayName("UT-BE-I18N-005a - Should use enum title when response title is null")
        void shouldUseEnumTitle_whenResponseTitleIsNull() {
            // Arrange
            var type = AuthProblemType.INVALID_CREDENTIALS;
            var response = new ResolvedMessageResponse(
                "AUTH-E-028", null, "Custom detail", 401, "en"
            );
            when(messageRegistryClient.resolveMessage("AUTH-E-028", "en", "t1"))
                .thenReturn(response);

            // Act
            var result = resolver.resolve(type, Locale.ENGLISH, "t1", Map.of());

            // Assert
            assertThat(result.title()).isEqualTo("Invalid credentials");
        }

        @Test
        @DisplayName("UT-BE-I18N-005b - Should use enum title when response title is blank")
        void shouldUseEnumTitle_whenResponseTitleIsBlank() {
            // Arrange
            var type = AuthProblemType.INVALID_CREDENTIALS;
            var response = new ResolvedMessageResponse(
                "AUTH-E-028", "   ", "Custom detail", 401, "en"
            );
            when(messageRegistryClient.resolveMessage("AUTH-E-028", "en", "t1"))
                .thenReturn(response);

            // Act
            var result = resolver.resolve(type, Locale.ENGLISH, "t1", Map.of());

            // Assert
            assertThat(result.title()).isEqualTo("Invalid credentials");
        }

        @Test
        @DisplayName("UT-BE-I18N-005c - Should use enum detail when response detail is null")
        void shouldUseEnumDetail_whenResponseDetailIsNull() {
            // Arrange
            var type = AuthProblemType.INVALID_CREDENTIALS;
            var response = new ResolvedMessageResponse(
                "AUTH-E-028", "Custom title", null, 401, "en"
            );
            when(messageRegistryClient.resolveMessage("AUTH-E-028", "en", "t1"))
                .thenReturn(response);

            // Act
            var result = resolver.resolve(type, Locale.ENGLISH, "t1", Map.of());

            // Assert
            assertThat(result.detail()).isEqualTo("Check your email or username and password, then try again.");
        }
    }
}
