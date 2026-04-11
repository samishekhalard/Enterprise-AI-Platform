package com.ems.audit.repository;

import com.ems.audit.dto.AuditSearchRequest;
import com.ems.audit.entity.AuditEventEntity;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public final class AuditEventSpecifications {

    private AuditEventSpecifications() {}

    public static Specification<AuditEventEntity> fromSearchRequest(AuditSearchRequest request) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Tenant filter (required)
            if (request.tenantId() != null && !request.tenantId().isBlank()) {
                predicates.add(cb.equal(root.get("tenantId"), request.tenantId()));
            }

            // User filter
            if (request.userId() != null) {
                predicates.add(cb.equal(root.get("userId"), request.userId()));
            }

            // Event types filter
            if (request.eventTypes() != null && !request.eventTypes().isEmpty()) {
                predicates.add(root.get("eventType").in(request.eventTypes()));
            }

            // Event categories filter
            if (request.eventCategories() != null && !request.eventCategories().isEmpty()) {
                predicates.add(root.get("eventCategory").in(request.eventCategories()));
            }

            // Resource filter
            if (request.resourceType() != null && !request.resourceType().isBlank()) {
                predicates.add(cb.equal(root.get("resourceType"), request.resourceType()));
            }
            if (request.resourceId() != null && !request.resourceId().isBlank()) {
                predicates.add(cb.equal(root.get("resourceId"), request.resourceId()));
            }

            // Action filter
            if (request.action() != null && !request.action().isBlank()) {
                predicates.add(cb.equal(root.get("action"), request.action()));
            }

            // Outcome filter
            if (request.outcome() != null && !request.outcome().isBlank()) {
                predicates.add(cb.equal(root.get("outcome"), request.outcome()));
            }

            // Severities filter
            if (request.severities() != null && !request.severities().isEmpty()) {
                predicates.add(root.get("severity").in(request.severities()));
            }

            // Service filter
            if (request.serviceName() != null && !request.serviceName().isBlank()) {
                predicates.add(cb.equal(root.get("serviceName"), request.serviceName()));
            }

            // Timestamp range
            if (request.fromTimestamp() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("timestamp"), request.fromTimestamp()));
            }
            if (request.toTimestamp() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("timestamp"), request.toTimestamp()));
            }

            // Text search (message field)
            if (request.searchText() != null && !request.searchText().isBlank()) {
                String searchPattern = "%" + request.searchText().toLowerCase() + "%";
                predicates.add(cb.or(
                    cb.like(cb.lower(root.get("message")), searchPattern),
                    cb.like(cb.lower(root.get("resourceName")), searchPattern),
                    cb.like(cb.lower(root.get("username")), searchPattern)
                ));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
