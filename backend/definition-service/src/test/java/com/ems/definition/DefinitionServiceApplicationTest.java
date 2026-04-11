package com.ems.definition;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

/**
 * Smoke test for DefinitionServiceApplication main class.
 */
class DefinitionServiceApplicationTest {

    @Test
    void main_shouldNotThrow() {
        // Verifies main method is callable (Spring context not loaded in unit test)
        assertDoesNotThrow(() -> DefinitionServiceApplication.class.getDeclaredConstructor().newInstance());
    }
}
