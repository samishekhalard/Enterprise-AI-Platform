package com.ems.definition.repository;

import com.ems.definition.node.ObjectTypeNode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.data.neo4j.DataNeo4jTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.Neo4jContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration tests for {@link ObjectTypeRepository} against a real Neo4j instance.
 *
 * Uses @DataNeo4jTest (repository slice only — no web, no security, no Keycloak)
 * with Testcontainers to spin up a Neo4j 5 container per test class.
 *
 * Covers:
 * - Persist and retrieve by id + tenantId
 * - Tenant isolation (cross-tenant queries return nothing)
 * - Paginated listing per tenant
 * - Count per tenant
 * - TypeKey uniqueness check per tenant
 * - Delete
 */
@DataNeo4jTest
@Testcontainers(disabledWithoutDocker = true)
@DisplayName("ObjectTypeRepository — Integration Tests")
class ObjectTypeRepositoryIT {

    @Container
    static Neo4jContainer<?> neo4j = new Neo4jContainer<>("neo4j:5-community")
            .withAdminPassword("test-password");

    @DynamicPropertySource
    static void configureNeo4j(DynamicPropertyRegistry registry) {
        registry.add("spring.neo4j.uri", neo4j::getBoltUrl);
        registry.add("spring.neo4j.authentication.username", () -> "neo4j");
        registry.add("spring.neo4j.authentication.password", neo4j::getAdminPassword);
    }

    @Autowired
    private ObjectTypeRepository repository;

    private static final String TENANT_A = "tenant-a";
    private static final String TENANT_B = "tenant-b";

    @BeforeEach
    void cleanDatabase() {
        repository.deleteAll();
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private ObjectTypeNode node(String id, String tenantId, String name, String typeKey, String status) {
        Instant now = Instant.now();
        return ObjectTypeNode.builder()
                .id(id)
                .tenantId(tenantId)
                .name(name)
                .typeKey(typeKey)
                .code("OBJ_001")
                .description("Integration test node")
                .iconName("box")
                .iconColor("#428177")
                .status(status)
                .state("user_defined")
                .createdAt(now)
                .updatedAt(now)
                .attributes(new ArrayList<>())
                .connections(new ArrayList<>())
                .build();
    }

    // ── Test groups ───────────────────────────────────────────────────────────

    @Nested
    @DisplayName("findByIdAndTenantId")
    class FindByIdAndTenantId {

        @Test
        @DisplayName("returns node when id and tenantId match")
        void returnsNodeOnMatch() {
            repository.save(node("ot-1", TENANT_A, "Server", "server", "active"));

            Optional<ObjectTypeNode> result = repository.findByIdAndTenantId("ot-1", TENANT_A);

            assertThat(result).isPresent();
            assertThat(result.get().getName()).isEqualTo("Server");
            assertThat(result.get().getTypeKey()).isEqualTo("server");
            assertThat(result.get().getTenantId()).isEqualTo(TENANT_A);
        }

        @Test
        @DisplayName("returns empty when tenantId does not match (tenant isolation)")
        void emptyWhenTenantMismatch() {
            repository.save(node("ot-1", TENANT_A, "Server", "server", "active"));

            Optional<ObjectTypeNode> result = repository.findByIdAndTenantId("ot-1", TENANT_B);

            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("returns empty when id does not exist")
        void emptyWhenIdMissing() {
            Optional<ObjectTypeNode> result = repository.findByIdAndTenantId("non-existent", TENANT_A);
            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("findByTenantId (paginated)")
    class FindByTenantId {

        @Test
        @DisplayName("returns only nodes belonging to the requested tenant")
        void returnsTenantScopedNodes() {
            repository.save(node("ot-1", TENANT_A, "Server", "server", "active"));
            repository.save(node("ot-2", TENANT_A, "Application", "application", "planned"));
            repository.save(node("ot-3", TENANT_B, "Database", "database", "active")); // different tenant

            List<ObjectTypeNode> result = repository.findByTenantId(TENANT_A, PageRequest.of(0, 10));

            assertThat(result).hasSize(2);
            assertThat(result).extracting(ObjectTypeNode::getTenantId).containsOnly(TENANT_A);
            assertThat(result).extracting(ObjectTypeNode::getName)
                    .containsExactlyInAnyOrder("Server", "Application");
        }

        @Test
        @DisplayName("respects page and size parameters")
        void respectsPagination() {
            repository.save(node("ot-1", TENANT_A, "A", "a", "active"));
            repository.save(node("ot-2", TENANT_A, "B", "b", "active"));
            repository.save(node("ot-3", TENANT_A, "C", "c", "active"));

            List<ObjectTypeNode> page0 = repository.findByTenantId(TENANT_A, PageRequest.of(0, 2));
            List<ObjectTypeNode> page1 = repository.findByTenantId(TENANT_A, PageRequest.of(1, 2));

            assertThat(page0).hasSize(2);
            assertThat(page1).hasSize(1);
        }

        @Test
        @DisplayName("returns empty list for unknown tenant")
        void emptyForUnknownTenant() {
            List<ObjectTypeNode> result = repository.findByTenantId("unknown-tenant", PageRequest.of(0, 10));
            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("countByTenantId")
    class CountByTenantId {

        @Test
        @DisplayName("counts only nodes for the specified tenant")
        void countsTenantScopedNodes() {
            repository.save(node("ot-1", TENANT_A, "Server", "server", "active"));
            repository.save(node("ot-2", TENANT_A, "Application", "application", "active"));
            repository.save(node("ot-3", TENANT_B, "Database", "database", "active"));

            assertThat(repository.countByTenantId(TENANT_A)).isEqualTo(2L);
            assertThat(repository.countByTenantId(TENANT_B)).isEqualTo(1L);
        }

        @Test
        @DisplayName("returns 0 for unknown tenant")
        void returnsZeroForUnknownTenant() {
            assertThat(repository.countByTenantId("unknown")).isEqualTo(0L);
        }
    }

    @Nested
    @DisplayName("existsByTypeKeyAndTenantId")
    class ExistsByTypeKeyAndTenantId {

        @Test
        @DisplayName("returns true when typeKey exists for tenant")
        void trueWhenKeyExists() {
            repository.save(node("ot-1", TENANT_A, "Server", "server", "active"));

            assertThat(repository.existsByTypeKeyAndTenantId("server", TENANT_A)).isTrue();
        }

        @Test
        @DisplayName("returns false when typeKey belongs to a different tenant (tenant isolation)")
        void falseWhenKeyBelongsToDifferentTenant() {
            repository.save(node("ot-1", TENANT_A, "Server", "server", "active"));

            assertThat(repository.existsByTypeKeyAndTenantId("server", TENANT_B)).isFalse();
        }

        @Test
        @DisplayName("returns false for a non-existent typeKey")
        void falseWhenKeyDoesNotExist() {
            assertThat(repository.existsByTypeKeyAndTenantId("missing", TENANT_A)).isFalse();
        }
    }

    @Nested
    @DisplayName("delete")
    class Delete {

        @Test
        @DisplayName("deletes node and verifies removal")
        void deletesNode() {
            ObjectTypeNode saved = repository.save(node("ot-1", TENANT_A, "Server", "server", "active"));

            assertThat(repository.findByIdAndTenantId("ot-1", TENANT_A)).isPresent();

            repository.delete(saved);

            assertThat(repository.findByIdAndTenantId("ot-1", TENANT_A)).isEmpty();
            assertThat(repository.countByTenantId(TENANT_A)).isEqualTo(0L);
        }

        @Test
        @DisplayName("deleting one tenant's node does not affect another tenant's nodes")
        void deletionIsTenantScoped() {
            ObjectTypeNode nodeA = repository.save(node("ot-1", TENANT_A, "Server", "server", "active"));
            repository.save(node("ot-2", TENANT_B, "Database", "database", "active"));

            repository.delete(nodeA);

            assertThat(repository.countByTenantId(TENANT_A)).isEqualTo(0L);
            assertThat(repository.countByTenantId(TENANT_B)).isEqualTo(1L);
        }
    }
}
