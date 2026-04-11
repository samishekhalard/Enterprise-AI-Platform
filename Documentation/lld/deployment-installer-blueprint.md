# EMSIST Deployment Installer Blueprint

> **WP-ARCH-ALIGN (2026-03-24):** This document has been updated to reflect the frozen auth target model (Rev 2).
> See `Foundation/03-ownership-boundaries.md` § FROZEN for the canonical decision.

## 1. Purpose

Define the target installer and upgrade-manager behavior for EMSIST as a customer-managed COTS product.

This blueprint operationalizes:

- [R07 Cross-Cutting Platform Requirements](./../.Requirements/R07.%20PLATFORM%20OPERATIONS%20AND%20CUSTOMER%20DELIVERY/Design/01-Cross-Cutting-Platform-Requirements.md)
- [R07 Acceptance Criteria and Release Gates](./../.Requirements/R07.%20PLATFORM%20OPERATIONS%20AND%20CUSTOMER%20DELIVERY/Design/02-Acceptance-Criteria-and-Release-Gates.md)
- [Architecture section 9.4.4](./../Architecture/09-architecture-decisions.md#944-runtime-agnostic-cots-deployment-contract-adr-032)

It describes how EMSIST should be installed, upgraded, backed up, restored, validated, and rolled back across supported runtimes.

## 2. Scope

The installer blueprint covers:

- runtime-agnostic deployment lifecycle
- logical role separation
- release bundle expectations
- migration orchestration
- runtime adapters for Docker, Kubernetes, and local/native deployment

It does not yet define:

- final CLI syntax
- final customer UX
- implementation language
- final packaging repository structure

## 3. Logical Deployment Roles

Every runtime must preserve the same four logical roles.

| Role | Responsibility | Expected Stability |
|------|----------------|-------------------|
| `postgres` | PostgreSQL server, relational durability, relational backups. [TARGET] PostgreSQL is the authoritative store for tenant users, RBAC, memberships, provider config, sessions (via tenant-service). | Long-lived |
| `neo4j` | Neo4j server, graph durability, graph backups. [TARGET] Neo4j serves definition-service (canonical object types) ONLY. Auth graph nodes (User, Group, Role, Provider, Config) are [AS-IS] legacy and migrate to PostgreSQL via tenant-service. Neo4j is NOT an "identity" role in the target model. | Long-lived |
| `keycloak` | [TARGET] Authentication only (login, MFA, token issuance, federation). Realm/client bootstrap, identity durability. | Long-lived |
| `services` | eureka, backend services, gateway, frontend, support services. [TRANSITION] auth-facade and user-service are removed after migration; their responsibilities move to api-gateway (edge auth) and tenant-service (data/policy). | Replaceable |

The installer must treat these roles as deployment units even when the underlying runtime expresses them differently.

## 4. Canonical Provisioning Modes and Supporting Operations

### 4.1 `preflight`

Validate before any install or upgrade:

- runtime availability
- version compatibility
- disk space and memory
- secrets and environment completeness
- network/DNS/TLS prerequisites
- backup target availability
- existing deployment state

### 4.2 `first_install`

Create a new customer environment:

1. run preflight
2. provision or connect to `postgres`
3. provision or connect to `neo4j`
4. provision or connect to `keycloak`
5. initialize required relational databases and users
6. run controlled baseline relational and graph migration batches
7. bootstrap Keycloak client, roles, and initial admin path
8. deploy `services`
9. validate platform health and login flow

### 4.3 `upgrade`

Upgrade an existing environment:

1. run preflight
2. back up all protected state
3. verify release compatibility with current environment
4. run the controlled migration plan for the release, if required
5. upgrade only the required roles
6. validate health, login, and critical workflows
7. persist deployment metadata for rollback/audit

Migration planning must always distinguish:

- relational migrations
- graph migrations
- identity/bootstrap changes
- no-op releases with no data change

The installer must not assume that rebuilding services is the same thing as applying migrations.

### 4.4 `backup`

Back up:

- PostgreSQL databases, including `keycloak_db`
- Neo4j data
- Valkey persistence where relevant to customer recovery expectations
- deployment metadata needed for rollback and audit

### 4.5 `restore`

Restore protected state first, then restart identity and services, then validate:

1. relational restore
2. graph restore
3. identity verification/bootstrap reconciliation
4. services restart
5. health and login verification

### 4.6 `rollback`

Rollback must be explicit and role-aware.

At minimum, the installer must support:

- service-only rollback when no data change occurred
- coordinated rollback guidance when schema/graph changes have already been applied

## 5. Release Bundle Contract

A customer-deliverable release should contain the artifacts needed by the installer, not just raw source code.

Minimum release bundle contents:

- release manifest
- versioned runtime artifacts
- migration inventory
- runtime adapter manifests/templates
- environment template
- checksums/signatures
- release notes
- rollback notes

The release manifest should answer:

- which roles changed
- whether migrations are required
- whether identity bootstrap changed
- whether rollback is safe without restore

## 6. Runtime Adapters

### 6.1 Docker / Compose Adapter

Responsibilities:

- map logical roles to isolated Compose projects/stacks
- preserve durable state outside service-only rebuilds
- provide role-aware first-install/upgrade commands

Expected role mapping:

| Role | Docker/Compose Shape |
|------|----------------------|
| `postgres` | dedicated Compose project/stack |
| `neo4j` | dedicated Compose project/stack |
| `keycloak` | dedicated Compose project/stack |
| `services` | dedicated Compose project/stack |

### 6.2 Kubernetes Adapter

Responsibilities:

- map roles to charts/releases/namespaces/stateful resources
- orchestrate migrations as Jobs or controlled hooks
- isolate stateful platform roles from service rollouts

Expected role mapping:

| Role | Kubernetes Shape |
|------|------------------|
| `postgres` | StatefulSet/operator-managed database |
| `neo4j` | StatefulSet/operator/Helm release |
| `keycloak` | Deployment/Helm release with persistent external DB |
| `services` | Deployments/Ingress/ConfigMaps/Secrets |

### 6.3 Local / Native Adapter

Responsibilities:

- support customer environments where services run directly on installed hosts
- coordinate local service units and explicit migration commands

Expected role mapping:

| Role | Local/Native Shape |
|------|--------------------|
| `postgres` | installed PostgreSQL service |
| `neo4j` | installed Neo4j service |
| `keycloak` | installed Keycloak service |
| `services` | system services/process manager entries |

## 7. Migration Orchestration Rules

### 7.1 Relational migrations

Relational migrations must be invocable independently from normal service restart.

The installer must know which service-owned schemas are affected by a release, such as:

- tenant-service ([TARGET] aggregate root for tenant users, RBAC, memberships, provider config, sessions)
- user-service ([TRANSITION] removed after migration; entities migrate to tenant-service)
- license-service
- notification-service
- audit-service
- ai-service
- process-service

### 7.2 Graph migrations

Neo4j migrations and graph bootstrap steps must also be explicit deployment actions when required by a release. [TARGET] Graph migrations apply to definition-service (canonical object types) ONLY. Auth-related graph migrations (User, Group, Role, Provider, Config nodes) are [AS-IS] legacy and will not receive new migrations after the PostgreSQL migration is complete.

### 7.3 Identity bootstrap changes

Keycloak bootstrap must remain idempotent, but identity changes still need release awareness:

- client changes
- role changes
- protocol mapper changes
- service-account permission changes

## 8. Deployment Metadata

The installer should persist deployment state for audit and repeatability:

- installed version
- runtime type
- role versions
- migration results
- backup reference taken before upgrade
- validation status
- rollback eligibility

## 9. Transition Notes from Current Repo Baseline

Current repository baseline:

- Docker Compose is the active operational baseline
- development and staging use a `data/app` split
- services still include startup-time migration behavior in several modules

Target direction:

- runtime-agnostic installer
- explicit migration step
- role-aware first-install/upgrade/rollback
- customer choice of Docker, Kubernetes, or local/native runtime

This blueprint is therefore a transition document, not a claim that the full installer already exists.

## 10. Suggested Command Surface

Illustrative only:

```bash
emsistctl preflight --runtime docker --env-file .env.prod
emsistctl first-install --runtime docker --bundle emsist-1.4.0.tgz --env-file .env.prod
emsistctl upgrade --runtime kubernetes --bundle emsist-1.4.0.tgz --values values-prod.yaml
emsistctl restore --runtime local --backup-id bk-20260316-001
emsistctl rollback --runtime docker --to-version 1.3.2
emsistctl validate --runtime docker --env-file .env.prod
```

The final implementation may choose different syntax, but the lifecycle operations must remain intact.
