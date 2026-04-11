# ADR-017: Data Classification Access Control

**Status:** Proposed
**Date:** 2026-02-27
**Decision Makers:** Architecture Review Board
**Author:** ARCH Agent

## Context

EMSIST already defines two authorization dimensions:

1. **RBAC** (role permissions)
2. **Licensing** (feature/module entitlement)

A new requirement adds a third dimension: strict control of data visibility by classification level:

- `OPEN`
- `INTERNAL`
- `CONFIDENTIAL`
- `RESTRICTED`

The platform must control who sees what data, including frontend UI components (especially tabs/sections/fields), while ensuring backend remains the security boundary.

Without a formal decision:

- classification behavior may diverge across services,
- frontend and backend policy can drift,
- sensitive data can leak through inconsistent filtering/masking.

## Decision

EMSIST adopts **classification-aware access control** as a first-class authorization dimension.

Effective access rule:

`ALLOW = TenantActive AND RoleAllowed AND FeatureAllowed AND ClassificationAllowed`

### 1. Classification Model

Classification lattice (ordered):

`OPEN < INTERNAL < CONFIDENTIAL < RESTRICTED`

Core rule:

- User may view resource/field only when `user.clearanceLevel >= resource.classificationLevel`, and RBAC + feature gates also pass.

### 2. Enforcement Boundaries

| Layer | Responsibility | Authority |
|------|----------------|-----------|
| Frontend | UX rendering controls (show/hide/disable/mask) | Advisory only |
| Backend API | Final policy decision for read/write/export | Authoritative |
| Data access layer | Row/field filtering and masking | Authoritative |

Frontend visibility improves usability and reduces accidental exposure, but cannot be trusted as a security control.

### 3. Authorization Context Contract

Login/refresh responses include classification context:

- `authorization.clearanceLevel`
- `authorization.policyVersion`
- classification-aware `uiVisibility` hints (e.g., field masking directives)

This extends ADR-014 authorization context; it does not replace it.

### 4. Denial and Masking Semantics

Required backend outcomes:

- `403 classification_denied` for disallowed access.
- Masked/redacted payload for partially visible fields when policy permits masked view.

Required frontend behavior:

- Deterministic UI state (`hidden`, `disabled`, `masked`, `redacted`) based on authorization context.
- Clear user feedback for restricted content without exposing protected values.

### 5. Policy Governance

- Default-deny for unmapped classification policy.
- All classification policy changes increment `policyVersion`.
- Release gate requires contract tests + backend authorization tests + E2E visibility/masking tests.

## Consequences

### Positive

- Uniform, auditable handling of sensitive data.
- Stronger defense against data leakage through UI/API inconsistencies.
- Predictable rollout model aligned with existing RBAC/licensing governance.

### Negative

- Additional policy and test complexity across services and frontend modules.
- More metadata management (resource/field classification labels).
- Potential performance impact for field-level filtering/masking in high-volume endpoints.

### Neutral

- Extends ADR-014; does not invalidate existing RBAC/licensing model.
- Keeps backend as authoritative enforcement plane.

## Alternatives Considered

### Option A: UI-only classification controls

Rejected:

- Not secure; client state is user-modifiable.
- Cannot prevent direct API access to restricted data.

### Option B: RBAC-only classification mapping

Rejected:

- Roles alone are too coarse for data-level visibility.
- Does not support field-level masking/redaction semantics.

### Option C: Full ABAC engine as immediate replacement

Deferred:

- High complexity and migration risk for current stage.
- Current decision keeps deterministic policy registry, with ABAC evolution possible later.

## Related Decisions

- [ADR-014](./ADR-014-rbac-licensing-integration.md) - RBAC + licensing integration
- [ADR-015](./ADR-015-on-premise-license-architecture.md) - on-premise license model
- [ADR-016](./ADR-016-polyglot-persistence.md) - persistence baseline

## Arc42 Sections Impacted

- `08-crosscutting.md` (authorization and policy model)
- `06-runtime-view.md` (classification check flow)
- `10-quality-requirements.md` (classification test gates)
- `09-architecture-decisions.md` (ADR index)
