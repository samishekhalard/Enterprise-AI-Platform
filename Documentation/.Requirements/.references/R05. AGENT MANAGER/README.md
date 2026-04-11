# AI Service Documentation Baseline

This section contains the implementation baseline for the AI platform stream.

Scope note: Existing EMSIST `ai-service` runtime may be partially aligned while migration proceeds in phases.

## Documents

1. [01-PRD-AI-Agent-Platform.md](./01-PRD-AI-Agent-Platform.md)
2. [02-Technical-Specification.md](./02-Technical-Specification.md)
3. [03-Epics-and-User-Stories.md](./03-Epics-and-User-Stories.md)
4. [04-Git-Structure-and-Claude-Code-Guide.md](./04-Git-Structure-and-Claude-Code-Guide.md)

## Governance

- Two-model baseline: local Orchestrator (~8B role) + local Worker (~24B baseline role)
- Retry policy baseline: default 2 retries, skill override up to 3
- Deterministic validation required before response delivery
- PDF parity and extension transparency are captured in the PRD/Tech Spec appendices
