# arc42 to TOGAF Mapping

**Last Updated:** 2026-03-05

This matrix maps arc42 sections to TOGAF ADM artifacts so both documentation systems stay consistent. Arc42 is the **canonical source** for technical architecture detail; TOGAF phases **summarize and reference** arc42 content.

## Primary Mapping Matrix

| arc42 Section | Primary TOGAF Phase/Artifact | Security Coverage | Infrastructure Coverage |
|---------------|------------------------------|-------------------|------------------------|
| 01 Introduction and Goals | Phase A (Architecture Vision) | Security as quality priority #1 | N/A |
| 02 Constraints | Phase A + Principles + Technology Standards | TC-04 Provider-agnostic auth, TC-10 UUID tenant contracts | TC-07 Docker/K8s, TC-09 Kafka |
| 03 Context and Scope | Phase A/B/C/D context artifacts | Interface security matrix (JWT, OIDC, API keys) | Technical context topology |
| 04 Solution Strategy | Phase A/C/D + Opportunities | Encryption strategy (4.7), Credential management (4.8) | Deployment modes (4.9), HA phased rollout |
| 05 Building Blocks | Phase C (Application/Data) + ABB/SBB register | Data ownership encryption matrix (5.7) | Service matrix with ports and runtime status |
| 06 Runtime View | Phase C/D behavior models | Auth flow sequences, policy evaluation | Service interaction patterns |
| 07 Deployment View | Phase D + Migration Planning | Network segmentation (7.9), Secrets management (7.10), Backup encryption (7.11) | **Full infrastructure architecture**: topology (7.2), HA 3-phase roadmap (7.8), tier separation (7.9) |
| 08 Crosscutting Concepts | Phase C + D + Principles + Governance | **Primary security source**: Auth (8.2), AuthZ (8.3), Encryption at rest (8.13), In-transit TLS (8.14), Session TTL (8.15), Credential rotation (8.16) | Caching strategy (8.4), Observability (8.6), Eventing (8.7) |
| 09 Architecture Decisions | Governance + ADR traceability | ADR-004, 007, 014, 017, 019, 020, 022 | ADR-018 |
| 10 Quality Requirements | Phase A + Governance controls | SEC-01 through SEC-12 security scenarios | REL-01 through REL-04 reliability scenarios |
| 11 Risks and Technical Debt | Phases E/F/H + Governance | R-12 to R-14, R-19 security risks; TD-13 to TD-15 security debt | R-08 to R-11 infrastructure risks; TD-07 to TD-10 infrastructure debt |
| 12 Glossary | Repository support artifact | Security terminology | Infrastructure terminology |

## Security Architecture Cross-Reference

| Security Domain | arc42 Section | TOGAF Phase | ADRs |
|-----------------|---------------|-------------|------|
| Authentication | 08 (8.2) | C (Application) | ADR-004, ADR-007, ADR-011 |
| Authorization | 08 (8.3) | C (Application) | ADR-014, ADR-017 |
| Tenant isolation | 08 (8.1) | C (Application) | ADR-003, ADR-010 |
| Encryption at rest | 08 (8.13), 04 (4.7) | D (Technology) | ADR-019 |
| Encryption in transit | 08 (8.14) | D (Technology) | ADR-019, ADR-022 |
| Session governance | 08 (8.15) | C (Application) | N/A (ISSUE-INF-019) |
| Credential management | 08 (8.16), 04 (4.8) | D (Technology) | ADR-020 |
| Network segmentation | 07 (7.9) | D (Technology) | N/A (ISSUE-INF-001) |
| Security governance | 10 (10.5, 10.6) | G (Governance) | ADR-022 |
| Security audit | Governance | G (Governance) | SECURITY-TIER-BOUNDARY-AUDIT.md |

## Infrastructure Architecture Cross-Reference

| Infrastructure Domain | arc42 Section | TOGAF Phase | ADRs |
|-----------------------|---------------|-------------|------|
| Deployment topology | 07 (7.2) | D (Technology) | N/A |
| Environment strategy | 07 (7.3) | D (Technology) | N/A |
| High availability | 07 (7.8) | D + E (Opportunities) | ADR-018 |
| Network architecture | 07 (7.9) | D (Technology) | N/A (ISSUE-INF-001) |
| Secrets management | 07 (7.10) | D (Technology) | ADR-020 |
| Backup and recovery | 07 (7.11) | D + F (Migration) | ADR-018, ADR-019 |
| Domain/TLS provisioning | 07 (7.7) | D (Technology) | N/A |
| Migration roadmap | 07 (7.8.5) | F (Migration) | ADR-018 |

## Operating Rule

When changing architecture significantly:

1. Update ADR(s) first (decision rationale).
2. Update affected arc42 sections (canonical detail).
3. Update related TOGAF phase artifact(s) and matrices (summary + reference).
4. Verify security and infrastructure cross-references remain accurate.
5. Update this mapping if new cross-cutting concerns are added.
