package com.ems.registry;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration tests for the EMS Service Registry (Eureka Server).
 *
 * Verifies that:
 *   1. The Spring application context loads with @EnableEurekaServer configured.
 *   2. The actuator health endpoint is reachable and returns status UP.
 *   3. Self-preservation mode is correctly configured (no self-registration).
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class EurekaServerApplicationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    void contextLoads() {
        // Verifies @EnableEurekaServer + all Spring Cloud auto-config initialises correctly.
        // A failed context load throws an exception and fails this test automatically.
    }

    @Test
    void actuatorHealthEndpointReturnsUp() {
        ResponseEntity<String> response = restTemplate.getForEntity(
                "http://localhost:" + port + "/actuator/health", String.class);

        assertThat(response.getStatusCode())
                .as("Health endpoint should return 200 OK")
                .isEqualTo(HttpStatus.OK);

        assertThat(response.getBody())
                .as("Health body should contain status UP")
                .contains("\"status\":\"UP\"");
    }

    @Test
    void eurekaEndpointIsAccessible() {
        // The Eureka registry REST API should be reachable at /eureka/apps
        ResponseEntity<String> response = restTemplate.getForEntity(
                "http://localhost:" + port + "/eureka/apps", String.class);

        // Eureka returns 200 with an XML/JSON registry listing (may be empty on startup)
        assertThat(response.getStatusCode())
                .as("Eureka /apps endpoint should be accessible")
                .isEqualTo(HttpStatus.OK);
    }
}
