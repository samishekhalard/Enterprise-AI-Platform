package com.ems.auth.config;

import com.ems.auth.exception.UserNotFoundException;
import com.ems.auth.i18n.AuthProblemFactory;
import com.ems.auth.i18n.AuthProblemType;
import com.ems.auth.provider.ProviderAlreadyExistsException;
import com.ems.auth.provider.ProviderNotFoundException;
import com.ems.common.exception.AccountLockedException;
import com.ems.common.exception.AuthenticationException;
import com.ems.common.exception.InvalidCredentialsException;
import com.ems.common.exception.InvalidTokenException;
import com.ems.common.exception.MfaRequiredException;
import com.ems.common.exception.NoActiveSeatException;
import com.ems.common.exception.RateLimitExceededException;
import com.ems.common.exception.TenantNotFoundException;
import com.ems.common.exception.TokenExpiredException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    private final AuthProblemFactory problemFactory;

    public GlobalExceptionHandler(AuthProblemFactory problemFactory) {
        this.problemFactory = problemFactory;
    }

    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<ProblemDetail> handleInvalidCredentials(
        InvalidCredentialsException ex,
        HttpServletRequest request
    ) {
        log.warn("Invalid credentials: {}", ex.getMessage());
        return buildResponse(AuthProblemType.INVALID_CREDENTIALS, request, Map.of(), null);
    }

    @ExceptionHandler(TokenExpiredException.class)
    public ResponseEntity<ProblemDetail> handleTokenExpired(
        TokenExpiredException ex,
        HttpServletRequest request
    ) {
        log.warn("Token expired: {}", ex.getMessage());
        return buildResponse(AuthProblemType.INVALID_TOKEN, request, Map.of(), null);
    }

    @ExceptionHandler(InvalidTokenException.class)
    public ResponseEntity<ProblemDetail> handleInvalidToken(
        InvalidTokenException ex,
        HttpServletRequest request
    ) {
        log.warn("Invalid token: {}", ex.getMessage());
        return buildResponse(AuthProblemType.INVALID_TOKEN, request, Map.of(), null);
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ProblemDetail> handleAuthentication(
        AuthenticationException ex,
        HttpServletRequest request
    ) {
        log.warn("Authentication error [{}]: {}", ex.getErrorCode(), ex.getMessage());
        AuthProblemType type = mapAuthenticationException(ex);
        return buildResponse(type, request, Map.of(), null);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ProblemDetail> handleAccessDenied(
        AccessDeniedException ex,
        HttpServletRequest request
    ) {
        log.warn("Access denied: {}", ex.getMessage());
        return buildResponse(AuthProblemType.ACCESS_DENIED, request, Map.of(), null);
    }

    @ExceptionHandler(MfaRequiredException.class)
    public ResponseEntity<ProblemDetail> handleMfaRequired(
        MfaRequiredException ex,
        HttpServletRequest request
    ) {
        log.info("MFA required for user");
        return buildResponse(
            AuthProblemType.MFA_REQUIRED,
            request,
            Map.of(),
            Map.of("mfaSessionToken", ex.getMfaSessionToken())
        );
    }

    @ExceptionHandler(AccountLockedException.class)
    public ResponseEntity<ProblemDetail> handleAccountLocked(
        AccountLockedException ex,
        HttpServletRequest request
    ) {
        log.warn("Account locked: {}", ex.getMessage());
        return buildResponse(AuthProblemType.ACCOUNT_LOCKED, request, Map.of(), null);
    }

    @ExceptionHandler(NoActiveSeatException.class)
    public ResponseEntity<ProblemDetail> handleNoActiveSeat(
        NoActiveSeatException ex,
        HttpServletRequest request
    ) {
        log.warn("No active seat for user {} in tenant {}", ex.getUserId(), ex.getTenantId());
        return buildResponse(
            AuthProblemType.NO_ACTIVE_SEAT,
            request,
            Map.of("tenantId", ex.getTenantId(), "userId", ex.getUserId()),
            null
        );
    }

    @ExceptionHandler(RateLimitExceededException.class)
    public ResponseEntity<ProblemDetail> handleRateLimit(
        RateLimitExceededException ex,
        HttpServletRequest request
    ) {
        log.warn("Rate limit exceeded");
        return buildResponse(
            AuthProblemType.RATE_LIMIT_EXCEEDED,
            request,
            Map.of("retryAfterSeconds", ex.getRetryAfterSeconds()),
            Map.of("retryAfter", ex.getRetryAfterSeconds())
        );
    }

    @ExceptionHandler(TenantNotFoundException.class)
    public ResponseEntity<ProblemDetail> handleTenantNotFound(
        TenantNotFoundException ex,
        HttpServletRequest request
    ) {
        log.warn("Tenant not found: {}", ex.getMessage());
        return buildResponse(AuthProblemType.TENANT_NOT_FOUND, request, Map.of(), null);
    }

    @ExceptionHandler(ProviderNotFoundException.class)
    public ResponseEntity<ProblemDetail> handleProviderNotFound(
        ProviderNotFoundException ex,
        HttpServletRequest request
    ) {
        log.warn("Provider not found: {}", ex.getMessage());
        return buildResponse(AuthProblemType.TENANT_NOT_FOUND, request, Map.of(), null);
    }

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<ProblemDetail> handleUserNotFound(
        UserNotFoundException ex,
        HttpServletRequest request
    ) {
        log.warn("User not found: {}", ex.getMessage());
        return buildResponse(AuthProblemType.NOT_AUTHENTICATED, request, Map.of(), null);
    }

    @ExceptionHandler(ProviderAlreadyExistsException.class)
    public ResponseEntity<ProblemDetail> handleProviderAlreadyExists(
        ProviderAlreadyExistsException ex,
        HttpServletRequest request
    ) {
        log.warn("Provider already exists: {}", ex.getMessage());
        return buildResponse(AuthProblemType.INVALID_OPERATION, request, Map.of(), null);
    }

    @ExceptionHandler(MissingRequestHeaderException.class)
    public ResponseEntity<ProblemDetail> handleMissingRequestHeader(
        MissingRequestHeaderException ex,
        HttpServletRequest request
    ) {
        log.warn("Missing required request header: {}", ex.getHeaderName());
        return buildResponse(
            AuthProblemType.MISSING_HEADER,
            request,
            Map.of("header", ex.getHeaderName()),
            null
        );
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ProblemDetail> handleValidationErrors(
        MethodArgumentNotValidException ex,
        HttpServletRequest request
    ) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = error instanceof FieldError fieldError ? fieldError.getField() : error.getObjectName();
            fieldErrors.put(fieldName, error.getDefaultMessage());
        });
        log.warn("Validation failed: {}", fieldErrors);
        return buildResponse(
            AuthProblemType.VALIDATION_ERROR,
            request,
            Map.of(),
            Map.of("errors", fieldErrors)
        );
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ProblemDetail> handleConstraintViolation(
        ConstraintViolationException ex,
        HttpServletRequest request
    ) {
        log.warn("Constraint violation: {}", ex.getMessage());
        return buildResponse(
            AuthProblemType.VALIDATION_ERROR,
            request,
            Map.of(),
            Map.of("errors", ex.getMessage())
        );
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ProblemDetail> handleIllegalState(
        IllegalStateException ex,
        HttpServletRequest request
    ) {
        log.warn("Illegal state: {}", ex.getMessage());
        return buildResponse(AuthProblemType.INVALID_OPERATION, request, Map.of(), null);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ProblemDetail> handleGenericException(
        Exception ex,
        HttpServletRequest request
    ) {
        log.error("Unexpected error", ex);
        return buildResponse(AuthProblemType.INTERNAL_ERROR, request, Map.of(), null);
    }

    private ResponseEntity<ProblemDetail> buildResponse(
        AuthProblemType type,
        HttpServletRequest request,
        Map<String, ?> arguments,
        Map<String, ?> extraProperties
    ) {
        Locale locale = request != null ? request.getLocale() : Locale.ENGLISH;
        String tenantId = request != null ? request.getHeader("X-Tenant-ID") : null;
        ProblemDetail problem = problemFactory.create(type, locale, tenantId, arguments, extraProperties);
        return ResponseEntity.status(problem.getStatus()).body(problem);
    }

    private AuthProblemType mapAuthenticationException(AuthenticationException ex) {
        return switch (ex.getErrorCode()) {
            case "invalid_mfa_code" -> AuthProblemType.INVALID_MFA_CODE;
            case "invalid_token", "token_expired" -> AuthProblemType.INVALID_TOKEN;
            case "not_authenticated" -> AuthProblemType.NOT_AUTHENTICATED;
            case "access_denied" -> AuthProblemType.ACCESS_DENIED;
            case "license_service_unavailable" -> AuthProblemType.LICENSE_SERVICE_UNAVAILABLE;
            case "auth_provider_unavailable" -> AuthProblemType.PROVIDER_UNAVAILABLE;
            default -> AuthProblemType.INTERNAL_ERROR;
        };
    }
}
