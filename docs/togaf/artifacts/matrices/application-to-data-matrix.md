# Application to Data Matrix

| Application | Neo4j | Valkey | Kafka | PostgreSQL (Keycloak only) |
|-------------|-------|--------|-------|-----------------------------|
| api-gateway | - | - | - | - |
| auth-facade | R/W | R/W | Optional | - |
| tenant-service | R/W | - | Pub/Sub | - |
| user-service | R/W | R/W | Pub/Sub | - |
| license-service | R/W | R/W | Pub/Sub | - |
| notification-service | R/W | R/W | Pub/Sub | - |
| audit-service | R/W | - | Sub | - |
| ai-service | R/W | R/W | Pub/Sub | - |
| process-service | R/W | - | Pub/Sub | - |
| Keycloak | - | - | - | R/W |
