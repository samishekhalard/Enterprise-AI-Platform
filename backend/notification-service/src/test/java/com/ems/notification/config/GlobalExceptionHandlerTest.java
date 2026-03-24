package com.ems.notification.config;

import com.ems.common.dto.ErrorResponse;
import com.ems.common.exception.BusinessException;
import com.ems.common.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("GlobalExceptionHandler Unit Tests")
class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler handler;

    @BeforeEach
    void setUp() {
        handler = new GlobalExceptionHandler();
    }

    @Test
    @DisplayName("Should return 404 for ResourceNotFoundException")
    void handleResourceNotFound_shouldReturn404() {
        // Arrange
        ResourceNotFoundException ex = new ResourceNotFoundException("Notification", "abc-123");

        // Act
        ResponseEntity<ErrorResponse> response = handler.handleResourceNotFound(ex);

        // Assert
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().error()).isEqualTo("not_found");
        assertThat(response.getBody().message()).contains("Notification");
    }

    @Test
    @DisplayName("Should return 400 for BusinessException with error code")
    void handleBusinessException_shouldReturn400WithCode() {
        // Arrange
        BusinessException ex = new BusinessException("TEMPLATE_EXISTS", "Template already exists");

        // Act
        ResponseEntity<ErrorResponse> response = handler.handleBusinessException(ex);

        // Assert
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().error()).isEqualTo("TEMPLATE_EXISTS");
        assertThat(response.getBody().message()).isEqualTo("Template already exists");
    }

    @Test
    @DisplayName("Should return 400 with field errors for validation exception")
    void handleValidationErrors_shouldReturn400WithFieldDetails() {
        // Arrange
        BeanPropertyBindingResult bindingResult = new BeanPropertyBindingResult(new Object(), "request");
        bindingResult.addError(new FieldError("request", "tenantId", "must not be blank"));
        bindingResult.addError(new FieldError("request", "type", "must not be blank"));
        MethodArgumentNotValidException ex =
                new MethodArgumentNotValidException(null, bindingResult);

        // Act
        ResponseEntity<ErrorResponse> response = handler.handleValidationErrors(ex);

        // Assert
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().error()).isEqualTo("validation_error");
        assertThat(response.getBody().details()).containsKeys("tenantId", "type");
    }

    @Test
    @DisplayName("Should return 500 for generic exceptions")
    void handleGenericException_shouldReturn500() {
        // Arrange
        Exception ex = new NullPointerException("Something went wrong");

        // Act
        ResponseEntity<ErrorResponse> response = handler.handleGenericException(ex);

        // Assert
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().error()).isEqualTo("internal_error");
    }
}
