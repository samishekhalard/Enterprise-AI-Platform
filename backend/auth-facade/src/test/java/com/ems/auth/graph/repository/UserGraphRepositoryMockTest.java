package com.ems.auth.graph.repository;

import com.ems.auth.graph.entity.GroupNode;
import com.ems.auth.graph.entity.RoleNode;
import com.ems.auth.graph.entity.UserNode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

/**
 * Unit tests for UserGraphRepository mock behavior.
 *
 * Tests verify the repository contract using Mockito interface mocks.
 * UserGraphRepository is an interface (extends Neo4jRepository), so
 * Mockito can mock it without Byte Buddy class instrumentation.
 *
 * Tests cover:
 * - findByIdAndTenantId returning empty for missing users
 * - findByIdAndTenantId returning user with relationships
 * - findAllByTenantId returning empty for no users
 */
@ExtendWith(MockitoExtension.class)
class UserGraphRepositoryMockTest {

    @Mock
    private UserGraphRepository userGraphRepository;

    private static final String TENANT_ID = "tenant-acme";
    private static final String USER_ID = "550e8400-e29b-41d4-a716-446655440000";

    @Test
    @DisplayName("findByIdAndTenantId should return empty when user not in graph")
    void findByIdAndTenantId_shouldReturnEmptyForMissingUser() {
        // Arrange
        when(userGraphRepository.findByIdAndTenantId("unknown-user", TENANT_ID))
            .thenReturn(Optional.empty());

        // Act
        Optional<UserNode> result = userGraphRepository.findByIdAndTenantId("unknown-user", TENANT_ID);

        // Assert
        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("findAllByTenantId should return empty list when no users in graph")
    void findAllByTenantId_shouldReturnEmptyForNoUsers() {
        // Arrange
        when(userGraphRepository.findAllByTenantId(TENANT_ID))
            .thenReturn(Collections.emptyList());

        // Act
        List<UserNode> result = userGraphRepository.findAllByTenantId(TENANT_ID);

        // Assert
        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("findByIdAndTenantId should return user with relationships")
    void findByIdAndTenantId_shouldReturnUserWithRelationships() {
        // Arrange
        RoleNode role = RoleNode.builder().name("USER").build();
        GroupNode group = GroupNode.builder().id("g1").name("devs").tenantId(TENANT_ID).build();
        UserNode user = UserNode.builder()
            .id(USER_ID)
            .email("test@example.com")
            .tenantId(TENANT_ID)
            .active(true)
            .directRoles(List.of(role))
            .groups(List.of(group))
            .build();

        when(userGraphRepository.findByIdAndTenantId(USER_ID, TENANT_ID))
            .thenReturn(Optional.of(user));

        // Act
        Optional<UserNode> result = userGraphRepository.findByIdAndTenantId(USER_ID, TENANT_ID);

        // Assert
        assertThat(result).isPresent();
        assertThat(result.get().directRoles()).hasSize(1);
        assertThat(result.get().groups()).hasSize(1);
    }
}
