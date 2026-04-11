# Data Entity Catalog

| Entity ID | Entity | Owning Service | System of Record | Tenant Scoped | Notes |
|-----------|--------|----------------|------------------|---------------|-------|
| DE-001 | Tenant | tenant-service | Neo4j | Yes |  |
| DE-002 | UserProfile | user-service | Neo4j | Yes |  |
| DE-003 | UserSession | user-service | Neo4j | Yes |  |
| DE-004 | TenantLicense | license-service | Neo4j | Yes |  |
| DE-005 | UserLicenseAssignment | license-service | Neo4j | Yes |  |
| DE-006 | NotificationTemplate | notification-service | Neo4j | Yes |  |
| DE-007 | AuditEvent | audit-service | Neo4j | Yes | Immutable |
| DE-008 | Conversation | ai-service | Neo4j | Yes |  |
| DE-009 | ProcessDefinition | process-service | Neo4j | Yes |  |
| DE-010 | Realm/User/Client internals | Keycloak | PostgreSQL | N/A | Keycloak-managed schema |
