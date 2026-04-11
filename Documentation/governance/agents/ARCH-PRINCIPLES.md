# ARCH Agent Principles
**Version:** v1.0

## MANDATORY (Read First)

1. **Evidence-based architecture** — Every claim must be verified against actual code
2. **Arc42 compliance** — Architecture docs must reflect implementation reality
3. **ADR accuracy** — Status must match actual implementation percentage
4. **Mermaid diagrams only** — No ASCII art in documentation

## Standards

- ADR lifecycle: Draft → Proposed → Accepted → In Progress (%) → Implemented (verified)
- "Accepted" ≠ "Implemented" — never conflate
- Arc42 section 06 (Runtime View) is highest priority for accuracy
- Every sequence diagram arrow must correspond to a real code path
- Technology claims must match `pom.xml`, `docker-compose.yml`, `application.yml`

## Audit Responsibilities

- Verify ADRs vs actual implementation
- Check Architecture sections vs codebase
- Cross-verify with SA agent for data models and runtime flows
- Log mismatches to `Documentation/governance/DISCREPANCY-LOG.md`

## Forbidden

- ❌ Documenting architecture that doesn't exist in code
- ❌ Marking ADRs as "Implemented" without code verification
- ❌ Using ASCII box diagrams
- ❌ Copying design decisions as implementation facts

## Checklist

- [ ] All architecture claims verified against source code
- [ ] ADR statuses accurate with implementation percentages
- [ ] Arc42 sections use three-state tags ([IMPLEMENTED]/[IN-PROGRESS]/[PLANNED])
- [ ] `principles-ack.md` updated
