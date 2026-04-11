> **WP-ARCH-ALIGN (2026-03-24):** This document has been updated to reflect the frozen auth target model (Rev 2).
> See `Foundation/03-ownership-boundaries.md` S FROZEN for the canonical decision.

# Business Capability Catalog

> **Last Updated:** 2026-03-08
> **Status:** Active
> **Source:** TOGAF Phase B (Business Architecture), EMSIST Architecture Context

## Overview

This catalog organizes EMSIST platform capabilities into 4 strategic domains with 16 sub-capabilities. Maturity scores reflect the current implementation state as verified against the codebase (not aspirational targets). Target maturity represents the desired end-state for GA release.

## Capability Domains

### Domain 1: Tenant Governance

| Capability ID | Capability | Domain | Owner | Description | Current Maturity (1-5) | Target Maturity (1-5) | Notes |
|---------------|------------|--------|-------|-------------|------------------------|-----------------------|-------|
| BC-001 | Tenant Provisioning | Tenant Governance | Platform Team | Automated creation and initialization of tenant workspaces including database schema setup, default configuration seeding, and Keycloak realm association. Triggers downstream provisioning in license-service and user-service. | 2 | 4 | tenant-service exists with CRUD; automated provisioning pipeline not yet wired |
| BC-002 | Organization Management | Tenant Governance | Platform Team | Hierarchical organization structure within a tenant: departments, teams, cost centers. Supports tree-based navigation and org-scoped access policies. | 1 | 3 | Data model defined; no UI or API beyond basic tenant entity |
| BC-003 | Tenant Configuration | Tenant Governance | Platform Team | Per-tenant settings management: branding (logo, theme), feature flags, locale/timezone defaults, notification preferences, and security policy overrides (password complexity, session timeout). | 2 | 4 | TenantConfig entity exists in tenant-service; UI for configuration management is partial |
| BC-004 | Master-Tenant Oversight | Tenant Governance | Platform Team | Super-admin capabilities for the platform operator: cross-tenant dashboard, usage analytics, tenant health monitoring, billing integration hooks, and tenant suspension/reactivation workflows. | 1 | 4 | No master-tenant admin UI; basic admin endpoints only |

### Domain 2: Identity and Access

| Capability ID | Capability | Domain | Owner | Description | Current Maturity (1-5) | Target Maturity (1-5) | Notes |
|---------------|------------|--------|-------|-------------|------------------------|-----------------------|-------|
| BC-005 | Provider-Agnostic Authentication | Identity and Access | Security Team | BFF-pattern authentication abstraction via auth-facade. Supports pluggable identity providers (currently Keycloak only). Handles OAuth2/OIDC flows, token exchange, and session cookie management without exposing tokens to the browser. | 2 | 4 | Keycloak provider implemented; Auth0/Okta/Azure AD providers not yet built (ADR-007 at 25%) |
| BC-006 | Session Lifecycle | Identity and Access | Security Team | Server-side session management backed by Valkey distributed cache. Covers session creation, validation, renewal, expiration, forced logout, concurrent session limits, and cross-device session visibility. | 2 | 4 | Valkey-backed session store active; concurrent session limits and cross-device visibility not implemented |
| BC-007 | Device Management | Identity and Access | Security Team | Device fingerprinting, trusted device registration, and device-based anomaly detection. Each login captures device metadata for audit trail and risk-based authentication decisions. | 1 | 3 | DeviceFingerprint entity exists in user-service; no risk-based auth logic |
| BC-008 | Role-Based Access Control | Identity and Access | Security Team | [AS-IS] Graph-based RBAC stored in Neo4j (auth-facade). Roles, permissions, and role assignments modeled as nodes and relationships. [TARGET] RBAC migrates to tenant-service (PostgreSQL); auth-facade removed; Neo4j reserved for definition-service only. Supports hierarchical role inheritance, permission aggregation, and composite authorization (RBAC + Licensing + Data Classification). | 3 | 5 | Neo4j RBAC graph implemented in auth-facade with Role, Permission, RoleAssignment nodes; composite authorization partially wired |

### Domain 3: Business Operations

| Capability ID | Capability | Domain | Owner | Description | Current Maturity (1-5) | Target Maturity (1-5) | Notes |
|---------------|------------|--------|-------|-------------|------------------------|-----------------------|-------|
| BC-009 | License Distribution | Business Operations | Product Team | License lifecycle management: creation, activation, suspension, expiration, and renewal of tenant-level product licenses. Supports multiple license types (trial, standard, enterprise) with configurable feature entitlements. | 2 | 4 | license-service has TenantLicense CRUD; license type differentiation and feature entitlement mapping in progress |
| BC-010 | Seat Allocation | Business Operations | Product Team | Per-user seat management within a tenant license. Tracks seat assignment, revocation, and utilization metrics. Enforces seat count limits and provides usage dashboards for tenant admins. | 1 | 4 | LicenseSeat and UserLicenseAssignment entities exist; seat limit enforcement and utilization dashboards not built |
| BC-011 | BPMN Workflow Orchestration | Business Operations | Engineering Team | BPMN 2.0 process definition, deployment, and execution using bpmn-js for visual modeling. Supports process versioning, user task assignment, timer events, and process instance lifecycle tracking. | 2 | 4 | definition-service has ProcessDefinition CRUD; bpmn-js integrated in frontend; runtime execution engine not connected |
| BC-012 | AI/RAG Services | Business Operations | AI Team | Retrieval-Augmented Generation capabilities: document ingestion with pgvector embeddings, conversational AI with context retrieval, AI provider configuration (model selection, temperature, token limits), and conversation history management. | 2 | 4 | ai-service with PostgreSQL+pgvector; Conversation entity and AIProviderConfig exist; RAG pipeline partially implemented |

### Domain 4: Platform Operations

| Capability ID | Capability | Domain | Owner | Description | Current Maturity (1-5) | Target Maturity (1-5) | Notes |
|---------------|------------|--------|-------|-------------|------------------------|-----------------------|-------|
| BC-013 | Multi-Channel Notifications | Platform Operations | Platform Team | Template-based notification orchestration across email, SMS, in-app, and push channels. Supports notification preferences per user, delivery tracking, retry logic, and template versioning with variable interpolation. | 2 | 4 | notification-service has NotificationTemplate and NotificationLog entities; email channel implemented; SMS/push channels planned |
| BC-014 | Immutable Audit Trail | Platform Operations | Compliance Team | Append-only audit event logging for all security-sensitive and business-critical operations. Each event captures actor, action, target, timestamp, tenant context, and before/after state. Supports compliance reporting and forensic analysis. | 2 | 4 | audit-service with AuditEvent entity (PostgreSQL, append-only); basic event capture active; compliance reporting UI not built |
| BC-015 | Distributed Caching | Platform Operations | Platform Team | Valkey 8-backed distributed cache layer for session data, token validation results, and frequently accessed reference data. Provides cache invalidation patterns, TTL management, and cache-aside strategy for read-heavy workloads. | 2 | 4 | Valkey active for auth-facade sessions; Caffeine L1 cache not yet implemented; cache-aside pattern not standardized across services |
| BC-016 | API Gateway Routing | Platform Operations | Platform Team | Spring Cloud Gateway-based request routing, rate limiting, circuit breaking, and request/response transformation. Provides centralized cross-cutting concerns: CORS, security headers, request logging, and tenant context extraction from JWT claims. | 3 | 4 | api-gateway active with route definitions for all services; rate limiting and circuit breaking configured; tenant context extraction implemented |

## Maturity Scale Reference

| Level | Label | Description |
|-------|-------|-------------|
| 1 | Initial | Ad-hoc, minimal implementation, no standardization |
| 2 | Developing | Basic functionality exists, gaps in coverage, limited automation |
| 3 | Defined | Standardized processes, documented patterns, consistent implementation |
| 4 | Managed | Measured, monitored, automated testing, production-ready |
| 5 | Optimized | Continuously improved, self-healing, industry-leading practices |

## Gap Analysis Summary

| Domain | Avg Current Maturity | Avg Target Maturity | Gap | Priority |
|--------|---------------------|---------------------|-----|----------|
| Tenant Governance | 1.5 | 3.75 | 2.25 | HIGH |
| Identity and Access | 2.0 | 4.0 | 2.0 | HIGH |
| Business Operations | 1.75 | 4.0 | 2.25 | MEDIUM |
| Platform Operations | 2.25 | 4.0 | 1.75 | MEDIUM |
| **Overall** | **1.88** | **3.94** | **2.06** | - |
