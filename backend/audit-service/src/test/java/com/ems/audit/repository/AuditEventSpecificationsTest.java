package com.ems.audit.repository;

import com.ems.audit.dto.AuditSearchRequest;
import com.ems.audit.entity.AuditEventEntity;
import jakarta.persistence.criteria.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.jpa.domain.Specification;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuditEventSpecifications Unit Tests")
class AuditEventSpecificationsTest {

    @Mock
    private Root<AuditEventEntity> root;

    @Mock
    private CriteriaQuery<?> query;

    @Mock
    private CriteriaBuilder cb;

    @Mock
    private Predicate predicate;

    @Mock
    private Path<Object> path;

    @Mock
    private Path<String> stringPath;

    @Mock
    private Expression<String> lowerExpr;

    @BeforeEach
    void setUp() {
        lenient().when(cb.and(any(Predicate[].class))).thenReturn(predicate);
        lenient().when(cb.equal(any(), any())).thenReturn(predicate);
        lenient().when(cb.greaterThanOrEqualTo(any(Expression.class), any(Instant.class))).thenReturn(predicate);
        lenient().when(cb.lessThanOrEqualTo(any(Expression.class), any(Instant.class))).thenReturn(predicate);
        lenient().when(cb.like(any(Expression.class), anyString())).thenReturn(predicate);
        lenient().when(cb.or(any(Predicate[].class))).thenReturn(predicate);
        lenient().when(cb.lower(any())).thenReturn(lowerExpr);
    }

    @Nested
    @DisplayName("fromSearchRequest")
    class FromSearchRequest {

        @Test
        @DisplayName("fromSearchRequest_withTenantId_shouldAddTenantPredicate")
        void fromSearchRequest_withTenantId_shouldAddTenantPredicate() {
            // Arrange
            AuditSearchRequest request = new AuditSearchRequest(
                    "tenant-1", null, null, null, null, null,
                    null, null, null, null, null, null, null,
                    0, 50, "timestamp", "DESC"
            );

            when(root.get("tenantId")).thenReturn(path);
            Specification<AuditEventEntity> spec = AuditEventSpecifications.fromSearchRequest(request);

            // Act
            spec.toPredicate(root, query, cb);

            // Assert
            verify(cb).equal(path, "tenant-1");
        }

        @Test
        @DisplayName("fromSearchRequest_withUserId_shouldAddUserPredicate")
        void fromSearchRequest_withUserId_shouldAddUserPredicate() {
            // Arrange
            UUID userId = UUID.randomUUID();
            AuditSearchRequest request = new AuditSearchRequest(
                    null, userId, null, null, null, null,
                    null, null, null, null, null, null, null,
                    0, 50, "timestamp", "DESC"
            );

            when(root.get("userId")).thenReturn(path);
            Specification<AuditEventEntity> spec = AuditEventSpecifications.fromSearchRequest(request);

            // Act
            spec.toPredicate(root, query, cb);

            // Assert
            verify(cb).equal(path, userId);
        }

        @Test
        @DisplayName("fromSearchRequest_withEventTypes_shouldAddInPredicate")
        void fromSearchRequest_withEventTypes_shouldAddInPredicate() {
            // Arrange
            List<String> eventTypes = List.of("USER_LOGIN", "USER_LOGOUT");
            AuditSearchRequest request = new AuditSearchRequest(
                    null, null, eventTypes, null, null, null,
                    null, null, null, null, null, null, null,
                    0, 50, "timestamp", "DESC"
            );

            CriteriaBuilder.In<Object> inPredicate = mock(CriteriaBuilder.In.class);
            when(root.get("eventType")).thenReturn(path);
            when(path.in(eventTypes)).thenReturn(inPredicate);
            Specification<AuditEventEntity> spec = AuditEventSpecifications.fromSearchRequest(request);

            // Act
            spec.toPredicate(root, query, cb);

            // Assert
            verify(path).in(eventTypes);
        }

        @Test
        @DisplayName("fromSearchRequest_withEmptyEventTypes_shouldNotAddPredicate")
        void fromSearchRequest_withEmptyEventTypes_shouldNotAddPredicate() {
            // Arrange
            AuditSearchRequest request = new AuditSearchRequest(
                    null, null, List.of(), null, null, null,
                    null, null, null, null, null, null, null,
                    0, 50, "timestamp", "DESC"
            );

            Specification<AuditEventEntity> spec = AuditEventSpecifications.fromSearchRequest(request);

            // Act
            spec.toPredicate(root, query, cb);

            // Assert
            verify(root, never()).get("eventType");
        }

        @Test
        @DisplayName("fromSearchRequest_withResourceType_shouldAddResourceTypePredicate")
        void fromSearchRequest_withResourceType_shouldAddResourceTypePredicate() {
            // Arrange
            AuditSearchRequest request = new AuditSearchRequest(
                    null, null, null, null, "USER", null,
                    null, null, null, null, null, null, null,
                    0, 50, "timestamp", "DESC"
            );

            when(root.get("resourceType")).thenReturn(path);
            Specification<AuditEventEntity> spec = AuditEventSpecifications.fromSearchRequest(request);

            // Act
            spec.toPredicate(root, query, cb);

            // Assert
            verify(cb).equal(path, "USER");
        }

        @Test
        @DisplayName("fromSearchRequest_withTimestampRange_shouldAddBothPredicates")
        void fromSearchRequest_withTimestampRange_shouldAddBothPredicates() {
            // Arrange
            Instant from = Instant.now().minus(7, ChronoUnit.DAYS);
            Instant to = Instant.now();

            AuditSearchRequest request = new AuditSearchRequest(
                    null, null, null, null, null, null,
                    null, null, null, null, from, to, null,
                    0, 50, "timestamp", "DESC"
            );

            when(root.get("timestamp")).thenReturn(path);
            Specification<AuditEventEntity> spec = AuditEventSpecifications.fromSearchRequest(request);

            // Act
            spec.toPredicate(root, query, cb);

            // Assert
            verify(cb).greaterThanOrEqualTo(any(Expression.class), eq(from));
            verify(cb).lessThanOrEqualTo(any(Expression.class), eq(to));
        }

        @Test
        @DisplayName("fromSearchRequest_withSearchText_shouldAddOrPredicateForMultipleFields")
        void fromSearchRequest_withSearchText_shouldAddOrPredicateForMultipleFields() {
            // Arrange
            AuditSearchRequest request = new AuditSearchRequest(
                    null, null, null, null, null, null,
                    null, null, null, null, null, null, "admin",
                    0, 50, "timestamp", "DESC"
            );

            when(root.get("message")).thenReturn(path);
            when(root.get("resourceName")).thenReturn(path);
            when(root.get("username")).thenReturn(path);

            Specification<AuditEventEntity> spec = AuditEventSpecifications.fromSearchRequest(request);

            // Act
            spec.toPredicate(root, query, cb);

            // Assert
            verify(cb).or(any(Predicate[].class));
        }

        @Test
        @DisplayName("fromSearchRequest_withBlankSearchText_shouldNotAddSearchPredicate")
        void fromSearchRequest_withBlankSearchText_shouldNotAddSearchPredicate() {
            // Arrange
            AuditSearchRequest request = new AuditSearchRequest(
                    null, null, null, null, null, null,
                    null, null, null, null, null, null, "   ",
                    0, 50, "timestamp", "DESC"
            );

            Specification<AuditEventEntity> spec = AuditEventSpecifications.fromSearchRequest(request);

            // Act
            spec.toPredicate(root, query, cb);

            // Assert
            verify(cb, never()).or(any(Predicate[].class));
        }

        @Test
        @DisplayName("fromSearchRequest_withAllNullFilters_shouldReturnEmptyPredicateArray")
        void fromSearchRequest_withAllNullFilters_shouldReturnEmptyPredicateArray() {
            // Arrange
            AuditSearchRequest request = new AuditSearchRequest(
                    null, null, null, null, null, null,
                    null, null, null, null, null, null, null,
                    0, 50, "timestamp", "DESC"
            );

            Specification<AuditEventEntity> spec = AuditEventSpecifications.fromSearchRequest(request);

            // Act
            Predicate result = spec.toPredicate(root, query, cb);

            // Assert
            verify(cb).and(argThat((Predicate[] predicates) -> predicates.length == 0));
        }

        @Test
        @DisplayName("fromSearchRequest_withAction_shouldAddActionPredicate")
        void fromSearchRequest_withAction_shouldAddActionPredicate() {
            // Arrange
            AuditSearchRequest request = new AuditSearchRequest(
                    null, null, null, null, null, null,
                    "CREATE", null, null, null, null, null, null,
                    0, 50, "timestamp", "DESC"
            );

            when(root.get("action")).thenReturn(path);
            Specification<AuditEventEntity> spec = AuditEventSpecifications.fromSearchRequest(request);

            // Act
            spec.toPredicate(root, query, cb);

            // Assert
            verify(cb).equal(path, "CREATE");
        }

        @Test
        @DisplayName("fromSearchRequest_withOutcome_shouldAddOutcomePredicate")
        void fromSearchRequest_withOutcome_shouldAddOutcomePredicate() {
            // Arrange
            AuditSearchRequest request = new AuditSearchRequest(
                    null, null, null, null, null, null,
                    null, "FAILURE", null, null, null, null, null,
                    0, 50, "timestamp", "DESC"
            );

            when(root.get("outcome")).thenReturn(path);
            Specification<AuditEventEntity> spec = AuditEventSpecifications.fromSearchRequest(request);

            // Act
            spec.toPredicate(root, query, cb);

            // Assert
            verify(cb).equal(path, "FAILURE");
        }

        @Test
        @DisplayName("fromSearchRequest_withSeverities_shouldAddInPredicate")
        void fromSearchRequest_withSeverities_shouldAddInPredicate() {
            // Arrange
            List<String> severities = List.of("CRITICAL", "HIGH");
            AuditSearchRequest request = new AuditSearchRequest(
                    null, null, null, null, null, null,
                    null, null, severities, null, null, null, null,
                    0, 50, "timestamp", "DESC"
            );

            CriteriaBuilder.In<Object> inPredicate = mock(CriteriaBuilder.In.class);
            when(root.get("severity")).thenReturn(path);
            when(path.in(severities)).thenReturn(inPredicate);
            Specification<AuditEventEntity> spec = AuditEventSpecifications.fromSearchRequest(request);

            // Act
            spec.toPredicate(root, query, cb);

            // Assert
            verify(path).in(severities);
        }

        @Test
        @DisplayName("fromSearchRequest_withServiceName_shouldAddServiceNamePredicate")
        void fromSearchRequest_withServiceName_shouldAddServiceNamePredicate() {
            // Arrange
            AuditSearchRequest request = new AuditSearchRequest(
                    null, null, null, null, null, null,
                    null, null, null, "auth-facade", null, null, null,
                    0, 50, "timestamp", "DESC"
            );

            when(root.get("serviceName")).thenReturn(path);
            Specification<AuditEventEntity> spec = AuditEventSpecifications.fromSearchRequest(request);

            // Act
            spec.toPredicate(root, query, cb);

            // Assert
            verify(cb).equal(path, "auth-facade");
        }

        @Test
        @DisplayName("fromSearchRequest_withEventCategories_shouldAddInPredicate")
        void fromSearchRequest_withEventCategories_shouldAddInPredicate() {
            // Arrange
            List<String> categories = List.of("AUTHENTICATION", "AUTHORIZATION");
            AuditSearchRequest request = new AuditSearchRequest(
                    null, null, null, categories, null, null,
                    null, null, null, null, null, null, null,
                    0, 50, "timestamp", "DESC"
            );

            CriteriaBuilder.In<Object> inPredicate = mock(CriteriaBuilder.In.class);
            when(root.get("eventCategory")).thenReturn(path);
            when(path.in(categories)).thenReturn(inPredicate);
            Specification<AuditEventEntity> spec = AuditEventSpecifications.fromSearchRequest(request);

            // Act
            spec.toPredicate(root, query, cb);

            // Assert
            verify(path).in(categories);
        }

        @Test
        @DisplayName("fromSearchRequest_withResourceId_shouldAddResourceIdPredicate")
        void fromSearchRequest_withResourceId_shouldAddResourceIdPredicate() {
            // Arrange
            AuditSearchRequest request = new AuditSearchRequest(
                    null, null, null, null, null, "res-456",
                    null, null, null, null, null, null, null,
                    0, 50, "timestamp", "DESC"
            );

            when(root.get("resourceId")).thenReturn(path);
            Specification<AuditEventEntity> spec = AuditEventSpecifications.fromSearchRequest(request);

            // Act
            spec.toPredicate(root, query, cb);

            // Assert
            verify(cb).equal(path, "res-456");
        }

        @Test
        @DisplayName("fromSearchRequest_withBlankTenantId_shouldNotAddTenantPredicate")
        void fromSearchRequest_withBlankTenantId_shouldNotAddTenantPredicate() {
            // Arrange
            AuditSearchRequest request = new AuditSearchRequest(
                    "  ", null, null, null, null, null,
                    null, null, null, null, null, null, null,
                    0, 50, "timestamp", "DESC"
            );

            Specification<AuditEventEntity> spec = AuditEventSpecifications.fromSearchRequest(request);

            // Act
            spec.toPredicate(root, query, cb);

            // Assert
            verify(root, never()).get("tenantId");
        }
    }
}
