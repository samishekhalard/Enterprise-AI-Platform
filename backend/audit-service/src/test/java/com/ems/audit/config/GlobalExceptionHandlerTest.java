package com.ems.audit.config;

import com.ems.common.dto.ErrorResponse;
import com.ems.common.exception.BusinessException;
import com.ems.common.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;

import static org.assertj.core.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("GlobalExceptionHandler Unit Tests")
class GlobalExceptionHandlerTest {

    @InjectMocks
    private GlobalExceptionHandler handler;

    @Nested
    @DisplayName("handleResourceNotFound")
    class HandleResourceNotFound {

        @Test
        @DisplayName("handleResourceNotFound_shouldReturn404WithErrorBody")
        void handleResourceNotFound_shouldReturn404WithErrorBody() {
            // Arrange
            ResourceNotFoundException ex = new ResourceNotFoundException("AuditEvent", "abc-123");

            // Act
            ResponseEntity<ErrorResponse> response = handler.handleResourceNotFound(ex);

            // Assert
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().error()).isEqualTo("not_found");
            assertThat(response.getBody().message()).contains("AuditEvent");
            assertThat(response.getBody().message()).contains("abc-123");
        }

        @Test
        @DisplayName("handleResourceNotFound_withSimpleMessage_shouldReturn404")
        void handleResourceNotFound_withSimpleMessage_shouldReturn404() {
            // Arrange
            ResourceNotFoundException ex = new ResourceNotFoundException("Entity not found");

            // Act
            ResponseEntity<ErrorResponse> response = handler.handleResourceNotFound(ex);

            // Assert
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
            assertThat(response.getBody().message()).isEqualTo("Entity not found");
        }
    }

    @Nested
    @DisplayName("handleBusinessException")
    class HandleBusinessException {

        @Test
        @DisplayName("handleBusinessException_shouldReturn400WithCodeAndMessage")
        void handleBusinessException_shouldReturn400WithCodeAndMessage() {
            // Arrange
            BusinessException ex = new BusinessException("audit_limit_exceeded",
                    "Maximum audit retention period exceeded");

            // Act
            ResponseEntity<ErrorResponse> response = handler.handleBusinessException(ex);

            // Assert
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().error()).isEqualTo("audit_limit_exceeded");
            assertThat(response.getBody().message()).isEqualTo("Maximum audit retention period exceeded");
        }
    }

    @Nested
    @DisplayName("handleValidationErrors")
    class HandleValidationErrors {

        @Test
        @DisplayName("handleValidationErrors_shouldReturn400WithFieldErrors")
        void handleValidationErrors_shouldReturn400WithFieldErrors() throws Exception {
            // Arrange
            BeanPropertyBindingResult bindingResult =
                    new BeanPropertyBindingResult(new Object(), "createAuditEventRequest");
            bindingResult.addError(new FieldError("createAuditEventRequest", "tenantId",
                    "must not be blank"));
            bindingResult.addError(new FieldError("createAuditEventRequest", "eventType",
                    "must not be blank"));

            MethodParameter parameter = new MethodParameter(
                    this.getClass().getDeclaredMethod("handleValidationErrors_shouldReturn400WithFieldErrors"), -1);

            MethodArgumentNotValidException ex =
                    new MethodArgumentNotValidException(parameter, bindingResult);

            // Act
            ResponseEntity<ErrorResponse> response = handler.handleValidationErrors(ex);

            // Assert
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().error()).isEqualTo("validation_error");
            assertThat(response.getBody().details()).containsKey("tenantId");
            assertThat(response.getBody().details()).containsKey("eventType");
            assertThat(response.getBody().details().get("tenantId")).isEqualTo("must not be blank");
        }
    }

    @Nested
    @DisplayName("handleGenericException")
    class HandleGenericException {

        @Test
        @DisplayName("handleGenericException_shouldReturn500WithGenericMessage")
        void handleGenericException_shouldReturn500WithGenericMessage() {
            // Arrange
            Exception ex = new RuntimeException("Something unexpected happened");

            // Act
            ResponseEntity<ErrorResponse> response = handler.handleGenericException(ex);

            // Assert
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().error()).isEqualTo("internal_error");
            assertThat(response.getBody().message()).isEqualTo("An unexpected error occurred");
        }

        @Test
        @DisplayName("handleGenericException_withNullPointerException_shouldReturn500")
        void handleGenericException_withNullPointerException_shouldReturn500() {
            // Arrange
            Exception ex = new NullPointerException();

            // Act
            ResponseEntity<ErrorResponse> response = handler.handleGenericException(ex);

            // Assert
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
            assertThat(response.getBody().error()).isEqualTo("internal_error");
        }
    }
}
