> **WP-ARCH-ALIGN (2026-03-24):** This document has been updated to reflect the frozen auth target model (Rev 2).
> See `Foundation/03-ownership-boundaries.md` S FROZEN for the canonical decision.

# Capability to Service Matrix

This matrix maps the 17 EMSIST sub-capabilities (grouped by 4 capability domains) to the 12 active services plus the frontend application. It shows each service's participation level in delivering each capability.

## Matrix

| Domain | Sub-Capability | api-gateway | auth-facade | tenant-service | user-service | license-service | notification-service | audit-service | ai-service | definition-service | process-service | service-registry | frontend |
|--------|---------------|-------------|-------------|----------------|--------------|-----------------|----------------------|---------------|-----------|-------------------|----------------|-----------------|----------|
| **Tenant Governance** | Tenant Provisioning | S | S | P | C | C | C | C | - | - | - | - | C |
| **Tenant Governance** | Organization Management | S | - | P | S | - | - | C | - | - | - | - | C |
| **Tenant Governance** | Tenant Configuration | S | - | P | - | S | - | C | - | S | - | - | C |
| **Tenant Governance** | Master-Tenant Oversight | S | S | P | S | S | - | C | - | - | - | - | C |
| **Identity and Access** | Provider-Agnostic AuthN | S | P | - | C | - | - | C | - | - | - | - | C |
| **Identity and Access** | Session Lifecycle | S | P | - | S | - | - | C | - | - | - | - | C |
| **Identity and Access** | Device Management | S | P | - | S | - | - | C | - | - | - | - | C |
| **Identity and Access** | Role-Based Access Control | S | P | S | S | S | - | C | - | - | - | - | C |
| **Business Operations** | License Distribution | S | - | S | - | P | - | C | - | - | - | - | C |
| **Business Operations** | Seat Allocation | S | - | S | S | P | - | C | - | - | - | - | C |
| **Business Operations** | BPMN Workflow Orchestration | S | - | - | - | - | - | C | - | P | S | - | C |
| **Business Operations** | AI/RAG Services | S | - | - | - | - | - | C | P | - | - | - | C |
| **Platform Operations** | Multi-Channel Notifications | S | - | S | S | - | P | C | - | - | - | - | C |
| **Platform Operations** | Immutable Audit Trail | S | C | C | C | C | C | P | C | C | C | - | - |
| **Platform Operations** | Distributed Caching | - | P | - | - | S | - | - | S | - | - | - | - |
| **Platform Operations** | Service Discovery & Registration | C | C | C | C | C | C | C | C | C | C | P | - |
| **Platform Operations** | API Gateway Routing | P | C | C | C | C | C | C | C | C | C | S | C |

## Service Participation Summary

| Service | Primary (P) | Supporting (S) | Consuming (C) | No Role (-) |
|---------|-------------|----------------|---------------|-------------|
| api-gateway | 1 | 14 | 1 | 1 |
| auth-facade | 5 | 2 | 3 | 7 |
| tenant-service | 4 | 4 | 3 | 6 |
| user-service | 0 | 7 | 5 | 5 |
| license-service | 2 | 4 | 4 | 7 |
| notification-service | 1 | 0 | 4 | 12 |
| audit-service | 1 | 0 | 15 | 1 |
| ai-service | 1 | 1 | 3 | 12 |
| definition-service | 1 | 1 | 3 | 12 |
| process-service | 0 | 1 | 3 | 13 |
| service-registry | 1 | 1 | 0 | 15 |
| frontend | 0 | 0 | 14 | 3 |

## Legend

| Symbol | Meaning | Description |
|--------|---------|-------------|
| `P` | Primary | Service is the principal owner and implementer of this capability |
| `S` | Supporting | Service provides essential supporting functionality for this capability |
| `C` | Consuming | Service consumes or depends on this capability provided by others |
| `-` | No participation | Service has no role in this capability |

## Notes

- **api-gateway** is Primary for API Gateway Routing and Supporting for all routed capabilities (it proxies requests but does not own business logic).
- [AS-IS] **auth-facade** is Primary for all Identity and Access sub-capabilities; it is the sole service using Neo4j (RBAC graph) and Valkey (session/token cache). [TARGET] auth-facade is a TRANSITION service (removed after migration). Identity and Access capabilities migrate to tenant-service (RBAC, memberships, session control via PostgreSQL) and api-gateway (auth endpoints). Neo4j is reserved for definition-service only.
- **audit-service** Consumes almost every capability because it receives audit events from all domain operations (append-only pattern).
- **service-registry** (Eureka) is Primary for Service Discovery & Registration. All 10 client services (api-gateway, auth-facade, tenant-service, user-service, license-service, notification-service, audit-service, ai-service, definition-service, process-service) register with it as Consuming clients. Evidence: `@EnableEurekaServer` in `EurekaServerApplication.java`; all client services have either `@EnableDiscoveryClient` annotation or `eureka.client` configuration in `application.yml`.
- **process-service** manages BPMN element type definitions (styling, rendering metadata) via PostgreSQL at port 8089. It is Supporting for BPMN Workflow Orchestration alongside the Primary definition-service, which manages object type schemas via Neo4j. Both services coexist with complementary responsibilities. Evidence: `BpmnElementTypeController.java`, `BpmnElementTypeEntity.java`, `@EnableDiscoveryClient` in `ProcessServiceApplication.java`.
- **definition-service** is Primary for BPMN Workflow Orchestration, managing master object type definitions and metadata contracts via Neo4j.
- **frontend** Consumes all user-facing capabilities but does not participate in Immutable Audit Trail (audit is purely backend) or Service Discovery (infrastructure concern).

## Change Log

| Date | Change | Gaps Addressed |
|------|--------|----------------|
| 2026-03-08 | Added "Service Discovery & Registration" sub-capability with service-registry as Primary and all 10 client services as Consuming | GAP-012 |
| 2026-03-08 | Added process-service column; mapped as Supporting for BPMN Workflow Orchestration, Consuming for Immutable Audit Trail, Service Discovery, and API Gateway Routing | GAP-016, GAP-017 |
| 2026-03-08 | Corrected note that incorrectly stated definition-service "replaces" process-service; both services coexist with different responsibilities | GAP-016 |
| 2026-03-08 | Recalculated Service Participation Summary for all services to reflect the new row and column | - |
