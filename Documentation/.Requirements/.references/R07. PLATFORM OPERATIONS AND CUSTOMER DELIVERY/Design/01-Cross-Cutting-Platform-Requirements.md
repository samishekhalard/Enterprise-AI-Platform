# R07 Cross-Cutting Platform Requirements

**Status:** Draft
**Owner:** Architecture / DevOps / Security
**Date:** 2026-03-13

---

## 1. Purpose

This document defines the architecture-significant requirements for packaging EMSIST for customer delivery and operating it safely across install, upgrade, restore, and rollback events.

It is the canonical requirement source for the following cross-cutting domains:

1. Production packaging and customer delivery model
2. Environment provisioning and application initializer
3. Authentication, identity bootstrap, and runtime prerequisites
4. Data durability, backup/restore, and upgrade safety
5. Runtime-agnostic deployment behavior

## 2. Scope and Boundary

### In Scope

- artifact-only customer delivery model
- runtime-agnostic customer delivery contract
- customer-facing installation contract
- provisioning modes and bootstrap behavior
- deployment-role separation for `postgres`, `neo4j`, `keycloak`, and `services`
- Keycloak bootstrap and runtime dependency chain
- app-tier versus data-tier rollout rules
- backup, restore, rollback, and release-gate requirements

### Out of Scope

- screen inventory and UI flow design
- business-module feature requirements
- service-level API field design outside provisioning and durability contracts

## 3. Current Repo Baseline

The requirements in this document are justified by the current repository state:

- production currently assumes image-based Docker delivery through `docker-compose.prod.yml`
- development and staging already separate app and data concerns through split Compose files
- login depends on more than Keycloak; non-master tenant login also depends on license-seat validation
- Keycloak state is stored in PostgreSQL and is therefore vulnerable to the same volume-destruction events as other relational data
- the customer runbook now documents P0 durability rules, but implementation and release evidence still need to be completed

## 4. P0 Rules

The following rules are non-negotiable for customer environments.

| P0 ID | Rule |
|-------|------|
| P0-01 | App-tier rebuilds and upgrades must not remove or recreate Postgres, Neo4j, Valkey, or Keycloak customer data. |
| P0-02 | Customer production delivery must use versioned runtime artifacts only; source code, source checkout, Docker build contexts, and local builds are not part of the customer installation contract. |
| P0-03 | Provisioning must support `preflight`, `first_install`, `upgrade`, and `restore` as distinct modes. |
| P0-04 | Keycloak realm and user data must persist independently of container lifecycle and be covered by backup and restore. |
| P0-05 | `docker compose down -v` is forbidden in scripts, runbooks, CI, and release automation for non-disposable environments. |
| P0-06 | Release approval requires demonstrated backup/restore and successful login continuity after app-tier rebuild or upgrade. |

## 5. Requirement Catalog

### 5.1 Production Packaging and Customer Delivery

| Req ID | Requirement | Priority |
|--------|-------------|----------|
| R07-PKG-001 | Customer production deployment must consume versioned runtime artifacts plus manifests/templates, scripts, runbooks, and checksums only. | Critical |
| R07-PKG-002 | Production delivery artifacts must not require shipping the Git repository, source code, source trees, Docker build contexts, or local compilation/build toolchains to the customer. | High |
| R07-PKG-003 | Frontend delivery may use compiled static assets only; production source maps must remain disabled. | High |
| R07-PKG-004 | Production rollout defaults to app-only version replacement; stateful data services are treated as protected operational assets. | Critical |
| R07-PKG-005 | The customer deployment contract must support Docker, Kubernetes, and local/native runtime adapters without changing the lifecycle semantics defined in this requirement set. | High |

### 5.2 Environment Provisioning and Application Initializer

| Req ID | Requirement | Priority |
|--------|-------------|----------|
| R07-PROV-001 | Provisioning must expose four explicit modes: `preflight`, `first_install`, `upgrade`, and `restore`. | Critical |
| R07-PROV-002 | `preflight` must validate secrets, URLs, certificates, backup target reachability, clock sync, required ports, and runtime dependencies before installation or upgrade begins. | High |
| R07-PROV-003 | `first_install` may create schemas and bootstrap baseline identity/configuration, but must not be reused to overwrite customer-created data. | Critical |
| R07-PROV-004 | `upgrade` may run compatibility checks and controlled migration batches only; it must never recreate customer identity data or reset platform state. | Critical |
| R07-PROV-005 | `restore` must rebuild data state first, then identity/runtime dependencies, then verify login and core platform workflows. | High |
| R07-PROV-006 | Deployment tooling must preserve four logical roles across all supported runtimes: `postgres`, `neo4j`, `keycloak`, and `services`. | High |

### 5.3 Authentication, Identity Bootstrap, and Runtime Prerequisites

| Req ID | Requirement | Priority |
|--------|-------------|----------|
| R07-AUTH-001 | Authentication readiness must include Keycloak, auth-facade secrets, license-seat validation path, Valkey session support, and correct host time. | Critical |
| R07-AUTH-002 | Keycloak bootstrap must be idempotent and first-install-safe. It must never overwrite customer-created realm, user, or role state during upgrade or restore. | Critical |
| R07-AUTH-003 | Login continuity is not considered verified unless a persisted user can authenticate successfully after restart, upgrade, and restore flows. | Critical |

### 5.4 Data Durability, Backup/Restore, and Upgrade Safety

| Req ID | Requirement | Priority |
|--------|-------------|----------|
| R07-DUR-001 | Postgres, Neo4j, Valkey, and Keycloak state must survive app-tier rebuilds and routine upgrades without operator data movement. | Critical |
| R07-DUR-002 | Backup scope must include `keycloak_db`, service databases, Neo4j data, and Valkey persistence state. | Critical |
| R07-DUR-003 | Backup and restore must be tested before release; documentation alone is insufficient evidence. | Critical |
| R07-DUR-004 | Rollback and restore procedures must verify login continuity, not only container health and startup success. | High |
| R07-DUR-005 | Volume-destruction commands and workflows are prohibited outside disposable environments and must be guarded in automation. | Critical |

## 6. Traceability Baseline

| Domain | Primary Ops Evidence | Architecture Trace |
|--------|----------------------|--------------------|
| Packaging | `docker-compose.prod.yml`, `scripts/deploy.sh`, release bundle contract | Architecture 07, Architecture 08, TOGAF 07, ADR-032 |
| Provisioning | `CUSTOMER-INSTALL-RUNBOOK.md`, bootstrap scripts | Architecture 07, Architecture 08, TOGAF 07, TOGAF 10 |
| Auth prerequisites | `auth-facade`, Keycloak bootstrap, license-service dependency | Architecture 08, Architecture 10, TOGAF 10 |
| Durability | backup strategy, restore gates, volume rules | Architecture 07, Architecture 10, TOGAF 07, TOGAF 10, ADR-032 |

## 7. Open Gaps

The requirements are now documented, but the following implementation gaps remain open:

- no automated preflight implementation exists yet
- production still uses a single Compose manifest and relies on procedural separation rules
- Keycloak production posture still includes `start-dev --import-realm`
- backup/restore evidence has not yet been automated as a release artifact
- runtime adapters for Kubernetes and local/native are not yet implemented as governed installer backends
