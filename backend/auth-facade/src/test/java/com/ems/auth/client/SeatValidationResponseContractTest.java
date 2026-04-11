package com.ems.auth.client;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Contract test verifying that SeatValidationResponse correctly
 * deserializes the JSON format returned by license-service.
 */
class SeatValidationResponseContractTest {

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
    }

    @Test
    @DisplayName("Should deserialize valid seat response from license-service")
    void shouldDeserializeValidSeatResponse() throws Exception {
        UUID tenantLicenseId = UUID.randomUUID();
        String json = """
                {
                    "valid": true,
                    "tier": "PROFESSIONAL",
                    "tenantLicenseId": "%s",
                    "reason": null,
                    "expiresAt": "2026-12-31T23:59:59Z"
                }
                """.formatted(tenantLicenseId);

        SeatValidationResponse response = objectMapper.readValue(json, SeatValidationResponse.class);

        assertThat(response.isValid()).isTrue();
        assertThat(response.getTier()).isEqualTo("PROFESSIONAL");
        assertThat(response.getTenantLicenseId()).isEqualTo(tenantLicenseId);
        assertThat(response.getReason()).isNull();
        assertThat(response.getExpiresAt()).isEqualTo(Instant.parse("2026-12-31T23:59:59Z"));
    }

    @Test
    @DisplayName("Should deserialize invalid seat response with reason")
    void shouldDeserializeInvalidSeatResponse() throws Exception {
        String json = """
                {
                    "valid": false,
                    "tier": null,
                    "tenantLicenseId": null,
                    "reason": "No active license found for tenant",
                    "expiresAt": null
                }
                """;

        SeatValidationResponse response = objectMapper.readValue(json, SeatValidationResponse.class);

        assertThat(response.isValid()).isFalse();
        assertThat(response.getTier()).isNull();
        assertThat(response.getTenantLicenseId()).isNull();
        assertThat(response.getReason()).isEqualTo("No active license found for tenant");
        assertThat(response.getExpiresAt()).isNull();
    }

    @Test
    @DisplayName("Should handle unknown fields gracefully via @JsonIgnoreProperties")
    void shouldHandleUnknownFieldsGracefully() throws Exception {
        UUID tenantLicenseId = UUID.randomUUID();
        String json = """
                {
                    "valid": true,
                    "tier": "ENTERPRISE",
                    "tenantLicenseId": "%s",
                    "reason": null,
                    "expiresAt": "2027-06-15T12:00:00Z",
                    "futureField": "some-value",
                    "anotherNewField": 42
                }
                """.formatted(tenantLicenseId);

        SeatValidationResponse response = objectMapper.readValue(json, SeatValidationResponse.class);

        assertThat(response.isValid()).isTrue();
        assertThat(response.getTier()).isEqualTo("ENTERPRISE");
        assertThat(response.getTenantLicenseId()).isEqualTo(tenantLicenseId);
        assertThat(response.getExpiresAt()).isEqualTo(Instant.parse("2027-06-15T12:00:00Z"));
    }
}
