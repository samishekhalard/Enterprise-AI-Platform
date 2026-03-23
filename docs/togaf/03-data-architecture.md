# 03. Data Architecture (ADM Phase C - Data)

## 1. Document Control

| Field | Value |
|-------|-------|
| Status | Draft |
| Owner | Architecture + Data |
| Last Updated | 2026-03-01 |

## 2. Data Architecture Scope

- Domain entities and ownership.
- Data lifecycle and quality controls.
- Data platform standards and constraints.

## 3. Canonical Data Principles

Per [ADR-016 Polyglot Persistence](../adr/ADR-016-polyglot-persistence.md):

- **Neo4j** stores RBAC, identity graph, and provider configuration data (auth-facade only).
- **PostgreSQL** stores relational domain data for 7 services (tenant, user, license, notification, audit, ai, process) and Keycloak internal persistence.
- **Valkey 8** provides distributed caching for auth-facade token/session data.
- Tenant isolation is enforced in data access patterns (tenant_id column discrimination for PostgreSQL services; graph labels for Neo4j).

## 4. Entity and Ownership Catalog

Maintain and reference [artifacts/catalogs/data-entity-catalog.md](./artifacts/catalogs/data-entity-catalog.md).

## 5. Data Lifecycle and Retention

| Data Domain | System of Record | Retention | Archive/Deletion Rule |
|-------------|------------------|-----------|------------------------|
|  |  |  |  |

## 6. Data Quality and Governance

| Data Quality Dimension | Metric | Target | Owner |
|------------------------|--------|--------|-------|
| Completeness |  |  |  |
| Accuracy |  |  |  |
| Consistency |  |  |  |
| Timeliness |  |  |  |

## 7. Data Security and Privacy

| Control | Implementation | Validation |
|---------|----------------|-----------|
|  |  |  |

## 8. Gap and Transition Notes

| Area | Baseline | Target | Work Package |
|------|----------|--------|-------------|
|  |  |  |  |
