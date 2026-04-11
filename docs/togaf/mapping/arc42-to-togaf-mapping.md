# arc42 to TOGAF Mapping

This matrix maps current arc42 sections to TOGAF ADM artifacts so both documentation systems stay consistent.

| arc42 Section | Primary TOGAF Phase/Artifact | Notes |
|---------------|------------------------------|-------|
| 01 Introduction and Goals | Phase A (Architecture Vision) | Goals, stakeholders, scope baseline |
| 02 Constraints | Phase A + Principles + Technology Standards | Canonical constraints feed all phases |
| 03 Context and Scope | Phase A/B/C/D context artifacts | External/internal boundaries |
| 04 Solution Strategy | Phase A/C/D + Opportunities | Strategic technology and pattern choices |
| 05 Building Blocks | Phase C (Application/Data) + ABB/SBB register | Static architecture decomposition |
| 06 Runtime View | Phase C/D behavior models | Runtime scenarios and interactions |
| 07 Deployment View | Phase D + Migration Planning | Technology/deployment target |
| 08 Crosscutting Concepts | Principles + Governance controls | Shared policies and standards |
| 09 Architecture Decisions | Governance + ADR traceability | ADR index/status view |
| 10 Quality Requirements | Phase A + Governance controls | Quality objectives and metrics |
| 11 Risks and Technical Debt | Phases E/F/H + Governance | Risk/debt management and roadmap |
| 12 Glossary | Repository support artifact | Controlled vocabulary |

## Operating Rule

When changing architecture significantly:

1. Update ADR(s) first (decision rationale).
2. Update affected arc42 sections.
3. Update related TOGAF phase artifact(s) and matrices.
