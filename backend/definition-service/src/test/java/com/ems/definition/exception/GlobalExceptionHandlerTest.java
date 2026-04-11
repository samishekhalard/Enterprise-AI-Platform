package com.ems.definition.exception;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import jakarta.validation.Path;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler handler;

    @BeforeEach
    void setUp() {
        handler = new GlobalExceptionHandler();
    }

    @Test
    void handleResponseStatusException_returns_matching_status() {
        var ex = new ResponseStatusException(HttpStatus.NOT_FOUND, "Object not found");

        ResponseEntity<ProblemDetail> response = handler.handleResponseStatusException(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getDetail()).isEqualTo("Object not found");
        assertThat(response.getBody().getProperties()).containsKey("timestamp");
    }

    @Test
    void handleResponseStatusException_conflict() {
        var ex = new ResponseStatusException(HttpStatus.CONFLICT, "Duplicate typeKey");

        ResponseEntity<ProblemDetail> response = handler.handleResponseStatusException(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody().getDetail()).isEqualTo("Duplicate typeKey");
    }

    @Test
    void handleValidationException_returns_bad_request() {
        var bindingResult = mock(BindingResult.class);
        var fieldError = new FieldError("request", "name", "must not be blank");
        when(bindingResult.getFieldErrors()).thenReturn(List.of(fieldError));

        var ex = new MethodArgumentNotValidException(null, bindingResult);

        ResponseEntity<ProblemDetail> response = handler.handleValidationException(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getTitle()).isEqualTo("Validation Failed");
        assertThat(response.getBody().getDetail()).contains("name: must not be blank");
        assertThat(response.getBody().getProperties()).containsKey("timestamp");
    }

    @Test
    void handleValidationException_multiple_errors() {
        var bindingResult = mock(BindingResult.class);
        when(bindingResult.getFieldErrors()).thenReturn(List.of(
                new FieldError("req", "name", "must not be blank"),
                new FieldError("req", "typeKey", "size must be between 1 and 100")
        ));

        var ex = new MethodArgumentNotValidException(null, bindingResult);

        ResponseEntity<ProblemDetail> response = handler.handleValidationException(ex);

        assertThat(response.getBody().getDetail()).contains("name:", "typeKey:");
    }

    @SuppressWarnings("unchecked")
    @Test
    void handleConstraintViolation_returns_bad_request() {
        ConstraintViolation<?> violation = mock(ConstraintViolation.class);
        var path = mock(Path.class);
        when(path.toString()).thenReturn("id");
        when(violation.getPropertyPath()).thenReturn(path);
        when(violation.getMessage()).thenReturn("must not be null");

        var ex = new ConstraintViolationException(Set.<ConstraintViolation<?>>of(violation));

        ResponseEntity<ProblemDetail> response = handler.handleConstraintViolation(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody().getTitle()).isEqualTo("Constraint Violation");
        assertThat(response.getBody().getDetail()).contains("id: must not be null");
    }

    @Test
    void handleGenericException_returns_internal_server_error() {
        var ex = new RuntimeException("unexpected");

        ResponseEntity<ProblemDetail> response = handler.handleGenericException(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getTitle()).isEqualTo("Internal Server Error");
        assertThat(response.getBody().getDetail()).isEqualTo("An unexpected error occurred");
        assertThat(response.getBody().getProperties()).containsKey("timestamp");
    }
}
