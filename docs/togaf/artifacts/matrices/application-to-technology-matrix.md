# Application to Technology Matrix

| Application | Runtime | Framework | Database | Cache | Messaging |
|-------------|---------|-----------|----------|-------|----------|
| api-gateway | Java | Spring Cloud Gateway | - | - | - |
| auth-facade | Java | Spring Boot | Neo4j | Valkey | Kafka (optional) |
| tenant-service | Java | Spring Boot | Neo4j | - | Kafka |
| user-service | Java | Spring Boot | Neo4j | Valkey | Kafka |
| license-service | Java | Spring Boot | Neo4j | Valkey | Kafka |
| notification-service | Java | Spring Boot | Neo4j | Valkey | Kafka |
| audit-service | Java | Spring Boot | Neo4j | - | Kafka |
| ai-service | Java | Spring Boot | Neo4j | Valkey | Kafka |
| process-service | Java | Spring Boot | Neo4j | - | Kafka |
| frontend | TypeScript | Angular | - | Browser memory | - |
| keycloak | Java | Keycloak runtime | PostgreSQL | - | - |
