# 12. Glossary

## 12.1 Domain Terms

| Term | Definition |
|------|------------|
| Tenant | Organization using EMS with isolated data and configuration scope |
| Tenant Admin | Administrative user responsible for tenant-level governance |
| Super Admin | Platform-level administrator with master-tenant privileges |
| License | Entitlement granting access to products/features |
| Seat | User-level license assignment |
| Feature Gate | Runtime access control based on entitlements |
| Realm | Keycloak identity domain boundary (default provider context) |

## 12.2 Architecture Terms

| Term | Definition |
|------|------------|
| arc42 | Structured architecture documentation template |
| ADR | Architecture Decision Record |
| BFF | Backend-for-Frontend pattern |
| CQRS | Separation of write and read responsibilities |
| RBAC | Role-based authorization model |
| ABAC | Attribute/context-based authorization checks |
| RAG | Retrieval-Augmented Generation workflow |

## 12.3 Technology Terms

| Term | Definition |
|------|------------|
| Neo4j | Graph database for auth-facade RBAC/identity graph ([ADR-016](../adr/ADR-016-polyglot-persistence.md)) |
| PostgreSQL | Relational database for 7 domain services + Keycloak internal persistence ([ADR-016](../adr/ADR-016-polyglot-persistence.md)) |
| Keycloak | Default identity provider implementation |
| Valkey | Distributed cache data store |
| Kafka | Event streaming platform |

## 12.4 Quality and Operations Terms

| Term | Definition |
|------|------------|
| SLO | Service Level Objective |
| SLI | Service Level Indicator |
| MTTR | Mean Time to Recovery |
| MTBF | Mean Time Between Failures |
| HPA | Horizontal Pod Autoscaler |
| RFC 7807 | Standardized HTTP problem detail format |

## 12.5 Abbreviations

| Abbreviation | Meaning |
|--------------|---------|
| API | Application Programming Interface |
| BPMN | Business Process Model and Notation |
| CI/CD | Continuous Integration / Continuous Deployment |
| IAM | Identity and Access Management |
| JWT | JSON Web Token |
| OIDC | OpenID Connect |
| SLA | Service Level Agreement |
| TLS | Transport Layer Security |

---

**Previous Section:** [Risks and Technical Debt](./11-risks-technical-debt.md)
**Back to Index:** [arc42 README](./README.md)
