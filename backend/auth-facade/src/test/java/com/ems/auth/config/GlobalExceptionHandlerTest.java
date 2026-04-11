package com.ems.auth.config;

import com.ems.auth.exception.UserNotFoundException;
import com.ems.auth.i18n.AuthProblemFactory;
import com.ems.auth.i18n.AuthProblemType;
import com.ems.auth.provider.ProviderAlreadyExistsException;
import com.ems.auth.provider.ProviderNotFoundException;
import com.ems.common.exception.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestHeaderException;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link GlobalExceptionHandler}.
 *
 * Covers: exception-to-ProblemType mapping, buildResponse locale/tenantId extraction,
 * extra properties, mapAuthenticationException switch cases, and null request handling.
 */
@ExtendWith(MockitoExtension.class)
class GlobalExceptionHandlerTest {

    @Mock
    private AuthProblemFactory problemFactory;

    @InjectMocks
    private GlobalExceptionHandler handler;

    // ------------------------------------------------------------------ //
    //  Exception → ProblemType mapping
    // ------------------------------------------------------------------ //

    @Nested
    @DisplayName("UT-BE-EXH-001 - Exception to ProblemType mapping")
    class ExceptionMapping {

        @Test
        @DisplayName("UT-BE-EXH-001a - InvalidCredentialsException maps to INVALID_CREDENTIALS")
        void invalidCredentials_mapsCorrectly() {
            // Arrange
            var request = mockRequest(Locale.ENGLISH, "tenant-1");
            stubFactory(AuthProblemType.INVALID_CREDENTIALS, HttpStatus.UNAUTHORIZED);

            // Act
            ResponseEntity<ProblemDetail> response = handler.handleInvalidCredentials(
                new InvalidCredentialsException(), request);

            // Assert
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
            verify(problemFactory).create(eq(AuthProblemType.INVALID_CREDENTIALS),
                eq(Locale.ENGLISH), eq("tenant-1"), eq(Map.of()), isNull());
        }

        @Test
        @DisplayName("UT-BE-EXH-001b - TokenExpiredException maps to INVALID_TOKEN")
        void tokenExpired_mapsCorrectly() {
            // Arrange
            var request = mockRequest(Locale.ENGLISH, null);
            stubFactory(AuthProblemType.INVALID_TOKEN, HttpStatus.UNAUTHORIZED);

            // Act
            ResponseEntity<ProblemDetail> response = handler.handleTokenExpired(
                new TokenExpiredException(), request);

            // Assert
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
            verify(problemFactory).create(eq(AuthProblemType.INVALID_TOKEN), any(), any(), any(), any());
        }

        @Test
        @DisplayName("UT-BE-EXH-001c - InvalidTokenException maps to INVALID_TOKEN")
        void invalidToken_mapsCorrectly() {
            // Arrange
            var request = mockRequest(Locale.ENGLISH, null);
            stubFactory(AuthProblemType.INVALID_TOKEN, HttpStatus.UNAUTHORIZED);

            // Act
            ResponseEntity<ProblemDetail> response = handler.handleInvalidToken(
                new InvalidTokenException(), request);

            // Assert
            verify(problemFactory).create(eq(AuthProblemType.INVALID_TOKEN), any(), any(), any(), any());
        }

        @Test
        @DisplayName("UT-BE-EXH-001d - AccessDeniedException maps to ACCESS_DENIED")
        void accessDenied_mapsCorrectly() {
            // Arrange
            var request = mockRequest(Locale.ENGLISH, "t1");
            stubFactory(AuthProblemType.ACCESS_DENIED, HttpStatus.FORBIDDEN);

            // Act
            ResponseEntity<ProblemDetail> response = handler.handleAccessDenied(
                new AccessDeniedException("forbidden"), request);

            // Assert
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
            verify(problemFactory).create(eq(AuthProblemType.ACCESS_DENIED), any(), any(), any(), any());
        }

        @Test
        @DisplayName("UT-BE-EXH-001e - AccountLockedException maps to ACCOUNT_LOCKED")
        void accountLocked_mapsCorrectly() {
            // Arrange
            var request = mockRequest(Locale.ENGLISH, null);
            stubFactory(AuthProblemType.ACCOUNT_LOCKED, HttpStatus.FORBIDDEN);

            // Act
            handler.handleAccountLocked(new AccountLockedException(), request);

            // Assert
            verify(problemFactory).create(eq(AuthProblemType.ACCOUNT_LOCKED), any(), any(), any(), any());
        }

        @Test
        @DisplayName("UT-BE-EXH-001f - TenantNotFoundException maps to TENANT_NOT_FOUND")
        void tenantNotFound_mapsCorrectly() {
            // Arrange
            var request = mockRequest(Locale.ENGLISH, null);
            stubFactory(AuthProblemType.TENANT_NOT_FOUND, HttpStatus.NOT_FOUND);

            // Act
            handler.handleTenantNotFound(new TenantNotFoundException("not found"), request);

            // Assert
            verify(problemFactory).create(eq(AuthProblemType.TENANT_NOT_FOUND), any(), any(), any(), any());
        }

        @Test
        @DisplayName("UT-BE-EXH-001g - ProviderNotFoundException maps to TENANT_NOT_FOUND")
        void providerNotFound_mapsCorrectly() {
            // Arrange
            var request = mockRequest(Locale.ENGLISH, null);
            stubFactory(AuthProblemType.TENANT_NOT_FOUND, HttpStatus.NOT_FOUND);

            // Act
            handler.handleProviderNotFound(new ProviderNotFoundException("not found"), request);

            // Assert
            verify(problemFactory).create(eq(AuthProblemType.TENANT_NOT_FOUND), any(), any(), any(), any());
        }

        @Test
        @DisplayName("UT-BE-EXH-001h - UserNotFoundException maps to NOT_AUTHENTICATED")
        void userNotFound_mapsCorrectly() {
            // Arrange
            var request = mockRequest(Locale.ENGLISH, null);
            stubFactory(AuthProblemType.NOT_AUTHENTICATED, HttpStatus.UNAUTHORIZED);

            // Act
            handler.handleUserNotFound(new UserNotFoundException("not found"), request);

            // Assert
            verify(problemFactory).create(eq(AuthProblemType.NOT_AUTHENTICATED), any(), any(), any(), any());
        }

        @Test
        @DisplayName("UT-BE-EXH-001i - ProviderAlreadyExistsException maps to INVALID_OPERATION")
        void providerAlreadyExists_mapsCorrectly() {
            // Arrange
            var request = mockRequest(Locale.ENGLISH, null);
            stubFactory(AuthProblemType.INVALID_OPERATION, HttpStatus.BAD_REQUEST);

            // Act
            handler.handleProviderAlreadyExists(
                new ProviderAlreadyExistsException("t1", "keycloak"), request);

            // Assert
            verify(problemFactory).create(eq(AuthProblemType.INVALID_OPERATION), any(), any(), any(), any());
        }

        @Test
        @DisplayName("UT-BE-EXH-001j - IllegalStateException maps to INVALID_OPERATION")
        void illegalState_mapsCorrectly() {
            // Arrange
            var request = mockRequest(Locale.ENGLISH, null);
            stubFactory(AuthProblemType.INVALID_OPERATION, HttpStatus.BAD_REQUEST);

            // Act
            handler.handleIllegalState(new IllegalStateException("bad state"), request);

            // Assert
            verify(problemFactory).create(eq(AuthProblemType.INVALID_OPERATION), any(), any(), any(), any());
        }

        @Test
        @DisplayName("UT-BE-EXH-001k - Generic Exception maps to INTERNAL_ERROR")
        void genericException_mapsCorrectly() {
            // Arrange
            var request = mockRequest(Locale.ENGLISH, null);
            stubFactory(AuthProblemType.INTERNAL_ERROR, HttpStatus.INTERNAL_SERVER_ERROR);

            // Act
            handler.handleGenericException(new RuntimeException("unexpected"), request);

            // Assert
            verify(problemFactory).create(eq(AuthProblemType.INTERNAL_ERROR), any(), any(), any(), any());
        }
    }

    // ------------------------------------------------------------------ //
    //  mapAuthenticationException switch cases
    // ------------------------------------------------------------------ //

    @Nested
    @DisplayName("UT-BE-EXH-002 - AuthenticationException errorCode switch mapping")
    class AuthenticationExceptionMapping {

        @Test
        @DisplayName("UT-BE-EXH-002a - invalid_mfa_code maps to INVALID_MFA_CODE")
        void invalidMfaCode() {
            // Arrange
            var request = mockRequest(Locale.ENGLISH, null);
            stubFactory(AuthProblemType.INVALID_MFA_CODE, HttpStatus.UNAUTHORIZED);
            var ex = new AuthenticationException("bad mfa", "invalid_mfa_code");

            // Act
            handler.handleAuthentication(ex, request);

            // Assert
            verify(problemFactory).create(eq(AuthProblemType.INVALID_MFA_CODE), any(), any(), any(), any());
        }

        @Test
        @DisplayName("UT-BE-EXH-002b - invalid_token maps to INVALID_TOKEN")
        void invalidToken() {
            // Arrange
            var request = mockRequest(Locale.ENGLISH, null);
            stubFactory(AuthProblemType.INVALID_TOKEN, HttpStatus.UNAUTHORIZED);

            // Act
            handler.handleAuthentication(
                new AuthenticationException("bad token", "invalid_token"), request);

            // Assert
            verify(problemFactory).create(eq(AuthProblemType.INVALID_TOKEN), any(), any(), any(), any());
        }

        @Test
        @DisplayName("UT-BE-EXH-002c - token_expired maps to INVALID_TOKEN")
        void tokenExpired() {
            // Arrange
            var request = mockRequest(Locale.ENGLISH, null);
            stubFactory(AuthProblemType.INVALID_TOKEN, HttpStatus.UNAUTHORIZED);

            // Act
            handler.handleAuthentication(
                new AuthenticationException("expired", "token_expired"), request);

            // Assert
            verify(problemFactory).create(eq(AuthProblemType.INVALID_TOKEN), any(), any(), any(), any());
        }

        @Test
        @DisplayName("UT-BE-EXH-002d - not_authenticated maps to NOT_AUTHENTICATED")
        void notAuthenticated() {
            // Arrange
            var request = mockRequest(Locale.ENGLISH, null);
            stubFactory(AuthProblemType.NOT_AUTHENTICATED, HttpStatus.UNAUTHORIZED);

            // Act
            handler.handleAuthentication(
                new AuthenticationException("unauthenticated", "not_authenticated"), request);

            // Assert
            verify(problemFactory).create(eq(AuthProblemType.NOT_AUTHENTICATED), any(), any(), any(), any());
        }

        @Test
        @DisplayName("UT-BE-EXH-002e - access_denied maps to ACCESS_DENIED")
        void accessDenied() {
            // Arrange
            var request = mockRequest(Locale.ENGLISH, null);
            stubFactory(AuthProblemType.ACCESS_DENIED, HttpStatus.FORBIDDEN);

            // Act
            handler.handleAuthentication(
                new AuthenticationException("denied", "access_denied"), request);

            // Assert
            verify(problemFactory).create(eq(AuthProblemType.ACCESS_DENIED), any(), any(), any(), any());
        }

        @Test
        @DisplayName("UT-BE-EXH-002f - license_service_unavailable maps to LICENSE_SERVICE_UNAVAILABLE")
        void licenseServiceUnavailable() {
            // Arrange
            var request = mockRequest(Locale.ENGLISH, null);
            stubFactory(AuthProblemType.LICENSE_SERVICE_UNAVAILABLE, HttpStatus.SERVICE_UNAVAILABLE);

            // Act
            handler.handleAuthentication(
                new AuthenticationException("license down", "license_service_unavailable"), request);

            // Assert
            verify(problemFactory).create(eq(AuthProblemType.LICENSE_SERVICE_UNAVAILABLE), any(), any(), any(), any());
        }

        @Test
        @DisplayName("UT-BE-EXH-002g - auth_provider_unavailable maps to PROVIDER_UNAVAILABLE")
        void providerUnavailable() {
            // Arrange
            var request = mockRequest(Locale.ENGLISH, null);
            stubFactory(AuthProblemType.PROVIDER_UNAVAILABLE, HttpStatus.SERVICE_UNAVAILABLE);

            // Act
            handler.handleAuthentication(
                new AuthenticationException("provider down", "auth_provider_unavailable"), request);

            // Assert
            verify(problemFactory).create(eq(AuthProblemType.PROVIDER_UNAVAILABLE), any(), any(), any(), any());
        }

        @Test
        @DisplayName("UT-BE-EXH-002h - unknown error code maps to INTERNAL_ERROR")
        void unknownErrorCode() {
            // Arrange
            var request = mockRequest(Locale.ENGLISH, null);
            stubFactory(AuthProblemType.INTERNAL_ERROR, HttpStatus.INTERNAL_SERVER_ERROR);

            // Act
            handler.handleAuthentication(
                new AuthenticationException("unknown", "something_unexpected"), request);

            // Assert
            verify(problemFactory).create(eq(AuthProblemType.INTERNAL_ERROR), any(), any(), any(), any());
        }
    }

    // ------------------------------------------------------------------ //
    //  Extra properties in specific handlers
    // ------------------------------------------------------------------ //

    @Nested
    @DisplayName("UT-BE-EXH-003 - Extra properties passed by specific handlers")
    class ExtraPropertiesHandlers {

        @Test
        @DisplayName("UT-BE-EXH-003a - MfaRequiredException passes mfaSessionToken as extra property")
        void mfaRequired_passesMfaSessionToken() {
            // Arrange
            var request = mockRequest(Locale.ENGLISH, "t1");
            stubFactory(AuthProblemType.MFA_REQUIRED, HttpStatus.FORBIDDEN);

            // Act
            handler.handleMfaRequired(new MfaRequiredException("mfa-tok-123"), request);

            // Assert
            verify(problemFactory).create(
                eq(AuthProblemType.MFA_REQUIRED),
                eq(Locale.ENGLISH), eq("t1"), eq(Map.of()),
                eq(Map.of("mfaSessionToken", "mfa-tok-123"))
            );
        }

        @Test
        @DisplayName("UT-BE-EXH-003b - NoActiveSeatException passes tenantId and userId as arguments")
        void noActiveSeat_passesTenantAndUser() {
            // Arrange
            var request = mockRequest(Locale.ENGLISH, "t1");
            stubFactory(AuthProblemType.NO_ACTIVE_SEAT, HttpStatus.FORBIDDEN);

            // Act
            handler.handleNoActiveSeat(new NoActiveSeatException("tenant-acme", "user-42"), request);

            // Assert
            verify(problemFactory).create(
                eq(AuthProblemType.NO_ACTIVE_SEAT),
                eq(Locale.ENGLISH), eq("t1"),
                eq(Map.of("tenantId", "tenant-acme", "userId", "user-42")),
                isNull()
            );
        }

        @Test
        @DisplayName("UT-BE-EXH-003c - RateLimitExceededException passes retryAfterSeconds as argument and retryAfter as extra")
        void rateLimit_passesRetryInfo() {
            // Arrange
            var request = mockRequest(Locale.ENGLISH, "t1");
            stubFactory(AuthProblemType.RATE_LIMIT_EXCEEDED, HttpStatus.TOO_MANY_REQUESTS);

            // Act
            handler.handleRateLimit(new RateLimitExceededException(45), request);

            // Assert
            verify(problemFactory).create(
                eq(AuthProblemType.RATE_LIMIT_EXCEEDED),
                eq(Locale.ENGLISH), eq("t1"),
                eq(Map.of("retryAfterSeconds", 45L)),
                eq(Map.of("retryAfter", 45L))
            );
        }

        @Test
        @DisplayName("UT-BE-EXH-003d - MissingRequestHeaderException passes header name as argument")
        void missingHeader_passesHeaderName() throws Exception {
            // Arrange
            var request = mockRequest(Locale.ENGLISH, null);
            stubFactory(AuthProblemType.MISSING_HEADER, HttpStatus.BAD_REQUEST);
            var ex = new MissingRequestHeaderException("X-Tenant-ID",
                new org.springframework.core.MethodParameter(
                    GlobalExceptionHandlerTest.class.getDeclaredMethod("dummyMethod", String.class), 0));

            // Act
            handler.handleMissingRequestHeader(ex, request);

            // Assert
            verify(problemFactory).create(
                eq(AuthProblemType.MISSING_HEADER),
                any(), any(),
                eq(Map.of("header", "X-Tenant-ID")),
                isNull()
            );
        }
    }

    // ------------------------------------------------------------------ //
    //  Validation error handlers
    // ------------------------------------------------------------------ //

    @Nested
    @DisplayName("UT-BE-EXH-004 - Validation error handlers")
    class ValidationHandlers {

        @Test
        @DisplayName("UT-BE-EXH-004a - MethodArgumentNotValidException extracts field errors as extra property")
        void methodArgumentNotValid_extractsFieldErrors() {
            // Arrange
            var request = mockRequest(Locale.ENGLISH, null);
            stubFactory(AuthProblemType.VALIDATION_ERROR, HttpStatus.BAD_REQUEST);
            var bindingResult = mock(BindingResult.class);
            var fieldError = new FieldError("loginRequest", "email", "must not be blank");
            when(bindingResult.getAllErrors()).thenReturn(List.of(fieldError));
            var ex = mock(MethodArgumentNotValidException.class);
            when(ex.getBindingResult()).thenReturn(bindingResult);

            // Act
            handler.handleValidationErrors(ex, request);

            // Assert
            verify(problemFactory).create(
                eq(AuthProblemType.VALIDATION_ERROR),
                any(), any(), eq(Map.of()),
                argThat(extra -> {
                    @SuppressWarnings("unchecked")
                    var errors = (Map<String, String>) extra.get("errors");
                    return errors != null && "must not be blank".equals(errors.get("email"));
                })
            );
        }

        @Test
        @DisplayName("UT-BE-EXH-004b - ConstraintViolationException passes message as errors extra property")
        void constraintViolation_passesMessage() {
            // Arrange
            var request = mockRequest(Locale.ENGLISH, null);
            stubFactory(AuthProblemType.VALIDATION_ERROR, HttpStatus.BAD_REQUEST);
            var ex = new ConstraintViolationException("email: must not be blank", Set.of());

            // Act
            handler.handleConstraintViolation(ex, request);

            // Assert
            verify(problemFactory).create(
                eq(AuthProblemType.VALIDATION_ERROR),
                any(), any(), eq(Map.of()),
                eq(Map.of("errors", "email: must not be blank"))
            );
        }
    }

    // ------------------------------------------------------------------ //
    //  buildResponse: locale and tenantId extraction
    // ------------------------------------------------------------------ //

    @Nested
    @DisplayName("UT-BE-EXH-005 - buildResponse locale and tenant extraction")
    class BuildResponse {

        @Test
        @DisplayName("UT-BE-EXH-005a - Should extract locale from request.getLocale()")
        void shouldExtractLocale_fromRequest() {
            // Arrange
            var arabicLocale = Locale.forLanguageTag("ar-SA");
            var request = mockRequest(arabicLocale, "t1");
            stubFactory(AuthProblemType.ACCESS_DENIED, HttpStatus.FORBIDDEN);

            // Act
            handler.handleAccessDenied(new AccessDeniedException("no"), request);

            // Assert
            verify(problemFactory).create(any(), eq(arabicLocale), eq("t1"), any(), any());
        }

        @Test
        @DisplayName("UT-BE-EXH-005b - Should extract tenantId from X-Tenant-ID header")
        void shouldExtractTenantId_fromHeader() {
            // Arrange
            var request = mockRequest(Locale.ENGLISH, "tenant-globex");
            stubFactory(AuthProblemType.INTERNAL_ERROR, HttpStatus.INTERNAL_SERVER_ERROR);

            // Act
            handler.handleGenericException(new RuntimeException("error"), request);

            // Assert
            verify(problemFactory).create(any(), any(), eq("tenant-globex"), any(), any());
        }

        @Test
        @DisplayName("UT-BE-EXH-005c - Should default to Locale.ENGLISH when request is null")
        void shouldDefaultLocale_whenRequestIsNull() {
            // Arrange
            stubFactory(AuthProblemType.INTERNAL_ERROR, HttpStatus.INTERNAL_SERVER_ERROR);

            // Act
            handler.handleGenericException(new RuntimeException("error"), null);

            // Assert
            verify(problemFactory).create(any(), eq(Locale.ENGLISH), isNull(), any(), any());
        }
    }

    // ------------------------------------------------------------------ //
    //  Response status propagation
    // ------------------------------------------------------------------ //

    @Nested
    @DisplayName("UT-BE-EXH-006 - Response status propagation")
    class ResponseStatus {

        @Test
        @DisplayName("UT-BE-EXH-006a - ResponseEntity status matches ProblemDetail status")
        void responseStatus_matchesProblemDetailStatus() {
            // Arrange
            var request = mockRequest(Locale.ENGLISH, null);
            var problem = ProblemDetail.forStatusAndDetail(HttpStatus.TOO_MANY_REQUESTS, "Too many");
            when(problemFactory.create(any(), any(), any(), any(), any())).thenReturn(problem);

            // Act
            ResponseEntity<ProblemDetail> response = handler.handleRateLimit(
                new RateLimitExceededException(30), request);

            // Assert
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
            assertThat(response.getBody()).isSameAs(problem);
        }
    }

    // ------------------------------------------------------------------ //
    //  Helpers
    // ------------------------------------------------------------------ //

    private HttpServletRequest mockRequest(Locale locale, String tenantId) {
        var request = mock(HttpServletRequest.class);
        when(request.getLocale()).thenReturn(locale);
        when(request.getHeader("X-Tenant-ID")).thenReturn(tenantId);
        return request;
    }

    private void stubFactory(AuthProblemType expectedType, HttpStatus status) {
        var problem = ProblemDetail.forStatusAndDetail(status, "test detail");
        when(problemFactory.create(eq(expectedType), any(), any(), any(), any())).thenReturn(problem);
    }

    /**
     * Dummy method used to construct a MethodParameter for MissingRequestHeaderException tests.
     */
    @SuppressWarnings("unused")
    private void dummyMethod(String header) {
        // intentionally empty
    }
}
