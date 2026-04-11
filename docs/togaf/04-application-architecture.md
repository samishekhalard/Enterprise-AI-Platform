# 04. Application Architecture (ADM Phase C - Application)

## 1. Document Control

| Field | Value |
|-------|-------|
| Status | Draft |
| Owner | Architecture + Engineering |
| Last Updated | 2026-02-25 |

## 2. Application Portfolio Scope

Reference the application portfolio in [artifacts/catalogs/application-portfolio-catalog.md](./artifacts/catalogs/application-portfolio-catalog.md).

## 3. Application Interaction Model

Reference detailed service structure in arc42 [Building Blocks](../arc42/05-building-blocks.md) and runtime interactions in [Runtime View](../arc42/06-runtime-view.md).

## 4. Interface and Integration Standards

| Interface Type | Standard |
|----------------|----------|
| Sync service APIs | REST/JSON |
| Async integration | Kafka |
| Identity integration | OIDC/OAuth2 via auth-facade |

## 5. Application-to-Data Mapping

Maintain [artifacts/matrices/application-to-data-matrix.md](./artifacts/matrices/application-to-data-matrix.md).

## 6. Application Security Controls

| Control Area | Pattern |
|--------------|---------|
| Authentication | BFF + provider abstraction (Keycloak default) |
| Authorization | RBAC + contextual checks |
| Tenant isolation | Tenant context + query predicate enforcement |

## 7. Gap Analysis

| Application Area | Baseline | Target | Gap |
|------------------|----------|--------|-----|
|  |  |  |  |
