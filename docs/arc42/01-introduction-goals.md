# 1. Introduction and Goals

## 1.1 System Purpose

EMS (Enterprise Management System & Integrated Service Transformation) is a multi-tenant SaaS platform for enterprise business and IT transformation management.

## 1.2 Business Goals

| Priority | Goal | Success Indicator |
|----------|------|-------------------|
| 1 | Secure tenant isolation | No cross-tenant data leakage |
| 2 | Fast user experience | API p95 < 200 ms for core flows |
| 3 | Reliable operations | 99.9% service availability |
| 4 | Scalable growth | Supports 10,000 concurrent users |
| 5 | Delivery agility | Services can be deployed independently |

## 1.3 Core Capabilities

| Capability | Description |
|------------|-------------|
| Multi-Tenancy | Master-tenant governance for provisioning and managing tenant organizations |
| Authentication | Provider-agnostic tenant authentication endpoints with zero-redirect BFF flows (Keycloak default) |
| User Management | User profiles, session lifecycle, and device management |
| License Management | Centralized master license distribution with tenant caps and local seat allocation |
| Audit Logging | Immutable audit trail |
| Notifications | Cross-tenant master templates plus tenant-specific templates across email, SMS, and push channels |
| AI Services | Multi-provider AI capabilities with RAG support |
| Process Management | BPMN-based workflow orchestration |

## 1.4 Primary Stakeholders

| Stakeholder | Expectations |
|-------------|--------------|
| Platform/Product Leadership | Predictable roadmap delivery, architecture traceability |
| Tenant Administrators | Reliable tenant setup, identity integration, and user governance |
| End Users | Fast and secure daily workflows |
| Engineering Teams | Clear boundaries, low-coupling services, maintainable standards |
| Operations/SRE | Observable, recoverable, and scalable runtime behavior |
| Security/Compliance | Strong identity controls, auditability, and policy enforcement |

## 1.5 Scope Statement

In scope for the current architecture baseline:

- Multi-service platform with domain-separated services.
- Polyglot persistence: Neo4j for auth-facade RBAC graph, PostgreSQL for relational domain services ([ADR-016](../adr/ADR-016-polyglot-persistence.md)).
- Provider-agnostic authentication architecture with Keycloak as default provider.
- PostgreSQL serves 7 domain services (tenant, user, license, notification, audit, ai, process) and Keycloak internal persistence.

Detailed constraints are authoritative in [Constraints](./02-constraints.md).

---

**Next Section:** [Constraints](./02-constraints.md)
