package com.ems.user.config;

import com.ems.common.exception.ResourceNotFoundException;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;

import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@DisplayName("GlobalExceptionHandler Unit Tests")
class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler handler;

    @BeforeEach
    void setUp() {
        handler = new GlobalExceptionHandler();
    }

    @Test
    @DisplayName("Should handle ResourceNotFoundException with 404 status")
    void handleResourceNotFound_shouldReturn404() {
        // Arrange
        ResourceNotFoundException ex = new ResourceNotFoundException("User", "abc-123");

        // Act
        ResponseEntity<GlobalExceptionHandler.ErrorResponse> response = handler.handleResourceNotFound(ex);

        // Assert
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().error()).isEqualTo("resource_not_found");
        assertThat(response.getBody().message()).contains("User not found: abc-123");
        assertThat(response.getBody().timestamp()).isNotNull();
    }

    @Test
    @DisplayName("Should handle MethodArgumentNotValidException with field errors")
    void handleValidationErrors_shouldReturn400WithFieldErrors() {
        // Arrange
        BindingResult bindingResult = mock(BindingResult.class);
        FieldError fieldError = new FieldError("request", "email", "must not be blank");
        when(bindingResult.getAllErrors()).thenReturn(List.of(fieldError));

        MethodArgumentNotValidException ex = new MethodArgumentNotValidException(null, bindingResult);

        // Act
        ResponseEntity<GlobalExceptionHandler.ErrorResponse> response = handler.handleValidationErrors(ex);

        // Assert
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().error()).isEqualTo("validation_error");
        assertThat(response.getBody().details()).containsEntry("email", "must not be blank");
    }

    @Test
    @DisplayName("Should handle ConstraintViolationException with 400 status")
    void handleConstraintViolation_shouldReturn400() {
        // Arrange
        ConstraintViolationException ex = new ConstraintViolationException("Invalid value", Set.of());

        // Act
        ResponseEntity<GlobalExceptionHandler.ErrorResponse> response = handler.handleConstraintViolation(ex);

        // Assert
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().error()).isEqualTo("validation_error");
    }

    @Test
    @DisplayName("Should handle IllegalStateException with 400 status")
    void handleIllegalState_shouldReturn400() {
        // Arrange
        IllegalStateException ex = new IllegalStateException("Operation not allowed");

        // Act
        ResponseEntity<GlobalExceptionHandler.ErrorResponse> response = handler.handleIllegalState(ex);

        // Assert
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().error()).isEqualTo("invalid_operation");
        assertThat(response.getBody().message()).isEqualTo("Operation not allowed");
    }

    @Test
    @DisplayName("Should handle IllegalArgumentException with 400 status")
    void handleIllegalArgument_shouldReturn400() {
        // Arrange
        IllegalArgumentException ex = new IllegalArgumentException("Bad argument");

        // Act
        ResponseEntity<GlobalExceptionHandler.ErrorResponse> response = handler.handleIllegalArgument(ex);

        // Assert
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().error()).isEqualTo("invalid_argument");
        assertThat(response.getBody().message()).isEqualTo("Bad argument");
    }

    @Test
    @DisplayName("Should handle generic Exception with 500 status")
    void handleGenericException_shouldReturn500() {
        // Arrange
        Exception ex = new RuntimeException("Something went wrong");

        // Act
        ResponseEntity<GlobalExceptionHandler.ErrorResponse> response = handler.handleGenericException(ex);

        // Assert
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().error()).isEqualTo("internal_error");
        assertThat(response.getBody().message()).isEqualTo("An unexpected error occurred");
    }

    @Test
    @DisplayName("ErrorResponse.of(error, message) should create response without details")
    void errorResponseOf_withoutDetails_shouldHaveNullDetails() {
        // Arrange & Act
        GlobalExceptionHandler.ErrorResponse response =
            GlobalExceptionHandler.ErrorResponse.of("test_error", "Test message");

        // Assert
        assertThat(response.error()).isEqualTo("test_error");
        assertThat(response.message()).isEqualTo("Test message");
        assertThat(response.details()).isNull();
        assertThat(response.timestamp()).isNotNull();
    }
}
