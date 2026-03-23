package com.ems.definition;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

/**
 * Smoke test to verify the application class can be instantiated.
 *
 * Note: Full @SpringBootTest context loading requires a live Neo4j instance
 * or Testcontainers. This test validates the class structure without
 * bootstrapping the Spring context, consistent with DefinitionServiceApplicationTest.
 *
 * A full integration test with Testcontainers is deferred to the QA-INT agent.
 */
class DefinitionServiceApplicationTests {

    @Test
    void contextLoads() {
        // Verifies application class is structurally valid
        assertDoesNotThrow(() -> DefinitionServiceApplication.class.getDeclaredConstructor().newInstance());
    }
}
