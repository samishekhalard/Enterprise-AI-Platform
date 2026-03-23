# ABB/SBB Register

## Architecture Building Blocks (ABB)

| ABB ID | ABB Name | Domain | Description | Realized By SBB |
|--------|----------|--------|-------------|-----------------|
| ABB-001 | Identity Orchestration | Application | Provider-agnostic authentication orchestration | SBB-001 |
| ABB-002 | Tenant Context Enforcement | Security/Data | Tenant-scoped context and query enforcement | SBB-002 |
| ABB-003 | Distributed Cache Layer | Technology | Shared L2 cache for hot reads and auth/session | SBB-003 |
| ABB-004 | Audit Event Backbone | Integration | Event-driven immutable audit pattern | SBB-004 |

## Solution Building Blocks (SBB)

| SBB ID | SBB Name | Type | Owner | Notes |
|--------|----------|------|-------|-------|
| SBB-001 | auth-facade + IdentityProvider strategy | Application service | Platform Team | Keycloak default implementation |
| SBB-002 | TenantContextFilter + tenant-scoped repositories | Code pattern | Service Teams | Mandatory for data access |
| SBB-003 | Valkey + Caffeine cache stack | Platform runtime | Platform Team | L1/L2 cache model |
| SBB-004 | Kafka + audit-service pipeline | Integration runtime | Platform Team | Immutable audit event persistence |
