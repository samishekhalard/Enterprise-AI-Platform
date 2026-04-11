# ADR to TOGAF Traceability

| ADR | Decision Focus | TOGAF Phase(s) | TOGAF Artifact Link |
|-----|----------------|----------------|---------------------|
| ADR-001 | Neo4j as primary app DB | C (Data/App), D | `03-data-architecture.md`, `04-application-architecture.md`, `05-technology-architecture.md` |
| ADR-002 | Spring Boot baseline | D | `05-technology-architecture.md` |
| ADR-003 | Tenant isolation strategy | B, C, F | `02-business-architecture.md`, `03-data-architecture.md`, `07-migration-planning.md` |
| ADR-004 | Keycloak with BFF | C, D, G | `04-application-architecture.md`, `05-technology-architecture.md`, `08-implementation-governance.md` |
| ADR-005 | Valkey caching | D, G | `05-technology-architecture.md`, `08-implementation-governance.md` |
| ADR-006 | Service consolidation proposal | E, F, H | `06-opportunities-solutions.md`, `07-migration-planning.md`, `09-architecture-change-management.md` |
| ADR-007 | Provider-agnostic auth abstraction | C, D, H | `04-application-architecture.md`, `05-technology-architecture.md`, `09-architecture-change-management.md` |
| ADR-008 | IdP management UI consolidation | E, F | `06-opportunities-solutions.md`, `07-migration-planning.md` |
| ADR-009 | Neo4j auth graph architecture | C, D | `03-data-architecture.md`, `04-application-architecture.md`, `05-technology-architecture.md` |
| ADR-010 | Graph-per-tenant routing | C, F, H | `03-data-architecture.md`, `07-migration-planning.md`, `09-architecture-change-management.md` |
| ADR-011 | Multi-provider implementation rollout | E, F, H | `06-opportunities-solutions.md`, `07-migration-planning.md`, `09-architecture-change-management.md` |

## Maintenance Rule

Any ADR status change requires review of this file and impacted TOGAF phase artifacts.
