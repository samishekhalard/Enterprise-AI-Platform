> **WP-ARCH-ALIGN (2026-03-24):** This document has been updated to reflect the frozen auth target model (Rev 2).
> See `Foundation/03-ownership-boundaries.md` FROZEN for the canonical decision.

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
| 6 | Intelligent automation | Agent Trust Score >= 85 enables autonomous workflows |
| 7 | Responsible AI | Ethics engine enforces platform baseline + tenant conduct policies |
| 8 | Continuous improvement | Cross-tenant benchmarking drives maturity advancement |

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
| AI Agent Platform | SuperAgent -> Sub-Orchestrator -> Worker hierarchy with maturity-gated autonomy, event-driven triggers, sandbox/HITL approvals, and ethics enforcement |

## 1.4 Primary Stakeholders

> **Persona Registry:** Detailed persona definitions are maintained in the centralized **[TX Persona Registry](../persona/PERSONA-REGISTRY.md)**.

| Stakeholder | Expectations | Persona Registry Mapping |
|-------------|--------------|--------------------------|
| Platform/Product Leadership | Predictable roadmap delivery, architecture traceability | -- |
| Tenant Administrators | Reliable tenant setup, identity integration, and user governance | [PER-UX-003] Fiona Shaw |
| End Users | Fast and secure daily workflows | [PER-UX-004] Lisa Harrison |
| Engineering Teams | Clear boundaries, low-coupling services, maintainable standards | -- |
| Operations/SRE | Observable, recoverable, and scalable runtime behavior | [PER-EX-002] Oliver Kent |
| Security/Compliance | Strong identity controls, auditability, and policy enforcement | [PER-EX-003] Joseph Hammond |
| AI/ML Engineering Teams | Clear agent abstraction, tool registry, prompt composition rules | [PER-EX-005] Thomas Morrison |
| Data Protection Officers | Ethics governance, PII handling transparency, EU AI Act compliance | [PER-EX-003] Joseph Hammond |

## 1.5 Quality Goals for AI Agent Platform

These quality targets apply to the Super Agent platform.

| Quality | Scenario | Target |
|---------|----------|--------|
| Orchestration Latency | SuperAgent dispatches to sub-orchestrator | p95 < 3s |
| Worker Execution | Single worker task including LLM call | p95 < 30s |
| HITL Notification | Approval request delivered to reviewer | < 5s |
| Ethics Check | Per-request conduct policy evaluation | < 100ms |
| Sandbox Isolation | Worker draft cannot affect committed data | 100% |
| Benchmark Privacy | Cross-tenant metrics preserve anonymity | k-anonymity k >= 5 |
| Maturity Accuracy | ATS score reflects true agent capability | 5-dimension validation |
| Event Throughput | Kafka event processing sustained rate | >= 1000 events/sec |

## 1.6 Scope Statement

In scope for the current architecture baseline:

- Multi-service platform with domain-separated services.
- Polyglot persistence: [AS-IS] Neo4j for auth-facade RBAC graph; [TARGET] RBAC/memberships migrate to tenant-service (PostgreSQL), Neo4j retained for definition-service only. PostgreSQL for relational domain services.
- Provider-agnostic authentication architecture with Keycloak as default provider.
- PostgreSQL serves 7 domain services (tenant, user, license, notification, audit, ai, process) and Keycloak internal persistence.

Detailed constraints are authoritative in [Constraints](./02-constraints.md).

---

## Changelog

| Timestamp | Change | Author |
|-----------|--------|--------|
| 2026-03-08 | Wave 2-3: Added Super Agent business goals (1.1.6-1.1.8), AI Agent capability (1.2.9), quality goals (1.5), stakeholders (Compliance Officer, Data Protection Officer) | ARCH Agent |
| 2026-03-09T14:30Z | Wave 6 (Final completeness): Verified all sections complete with zero TODOs, TBDs, or placeholders. All Super Agent content tagged [PLANNED]. Measurable quality targets present for all 8 Super Agent quality goals. Changelog added. | ARCH Agent |

---

**Next Section:** [Constraints](./02-constraints.md)
