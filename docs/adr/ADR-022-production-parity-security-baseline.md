# ADR-022: Production-Parity Security Baseline (COTS)

**Status:** Accepted  
**Date:** 2026-03-04  
**Decision Makers:** Architecture Review Board, Security, DevOps, Product

## Context

EMSIST is a licensed COTS product intended for customer installation at any time.  
A dual-security posture ("relaxed dev" vs "secure production") is not acceptable for this model.

Current evidence shows a mixed posture:

- Plain `http://` endpoints are still present in runtime configuration.
- In-transit TLS is tracked but not fully implemented (see ADR-019).
- Some internal service endpoints are protected by `internal.service` scope, but service-to-service authentication is not uniformly enforced across all services/routes.

This creates governance drift and delayed hardening, which is incompatible with product-grade delivery expectations.

## Decision

Adopt a **production-parity full-stack security baseline** as a mandatory architecture rule.

### 1) No environment-level security downgrades

- Security controls must be designed and implemented once, then used across dev/staging/production.
- "Dev-only insecure shortcuts" are treated as technical debt exceptions, not normal practice.

### 2) Transport security is mandatory

- Edge traffic must use HTTPS.
- Service-to-service traffic must move to authenticated secure channels (mTLS and/or signed service identity tokens as defined by service boundaries).
- Data-store connections must use TLS where protocol supports it.

### 3) Internal APIs are not implicitly trusted

- `/api/v1/internal/**` endpoints must require explicit service authentication and least privilege.
- Gateway deny-by-default for internal edge exposure remains mandatory.

### 4) Enforce with pipeline governance

- CI must block **net-new** insecure transport entries.
- Existing insecure entries are tracked via an allowlist baseline and must be burned down.
- No merge without passing transport-security governance checks.

## Consequences

### Positive

- Aligns architecture with COTS product expectations.
- Reduces security variance and late-stage remediation risk.
- Makes release readiness objective and enforceable.

### Negative

- Immediate implementation effort across configuration, certificates, and infrastructure.
- Existing local workflows may require HTTPS/mTLS-compatible setup.

### Neutral

- Technical debt may remain temporarily but is explicit, measured, and blocked from growth.

## Implementation Contract

1. Transport-security baseline gate in CI:
   - `scripts/check-transport-security-baseline.sh`
   - `scripts/transport-security-allowlist.txt`
2. Architecture traceability updates in arc42 + ADR index.
3. Progressive elimination of allowlisted insecure entries until baseline reaches zero.

## Related Decisions

- [ADR-004](./ADR-004-keycloak-authentication.md) (HTTPS only in production)
- [ADR-019](./ADR-019-encryption-at-rest.md) (in-transit TLS tier)
- [ADR-020](./ADR-020-service-credential-management.md) (secure service posture)
- [ADR-021](./ADR-021-licensed-software-requirements.md) (on-prem COTS constraints)

## References

- [ISSUE-005 Auth Boundary Bypass](../issues/open/ISSUE-005-auth-boundary-bypass-header-trust.md)
- [arc42 Runtime View](../arc42/06-runtime-view.md)
- [arc42 Risks and Technical Debt](../arc42/11-risks-technical-debt.md)
