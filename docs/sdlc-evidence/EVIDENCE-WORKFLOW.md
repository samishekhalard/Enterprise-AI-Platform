# SDLC Agent Evidence Workflow

## Purpose

This directory stores **proof of agent execution** for each feature implementation.
Three enforcement layers check these files:

1. **Claude Code hooks** — block source code edits if BA evidence is missing
2. **Git pre-commit hook** — block commits if QA evidence is missing
3. **Plan-mode gate** — CLAUDE.md rules require agents to create evidence files

## Required Evidence Files

Each feature implementation MUST produce these files before completion:

| File | Created By | Required Before | Enforced By |
|------|-----------|-----------------|-------------|
| `ba-signoff.md` | BA agent | DEV agent can edit source code | PreToolUse hook (Layer 2) |
| `principles-ack.md` | Any code-writing agent (DEV, QA-UNIT, QA-INT) | Agent can edit source code | PreToolUse hook (Layer 2) |
| `sa-review.md` | SA agent | DEV agent can edit source code | Informational only |
| `qa-report.md` | QA agent | Git commit is allowed | Pre-commit hook (Layer 3) |

## Evidence File Format

### principles-ack.md

```markdown
# Principles Acknowledgment

| Agent | Principles File | Version | Key Constraints | Date |
|-------|----------------|---------|-----------------|------|
| dev | DEV-PRINCIPLES.md | v1.1 | Test co-delivery, EBD, no solo implementation | YYYY-MM-DD |
| qa | QA-PRINCIPLES.md | v2.0 | Environment-aware testing, triage router, DoD gates | YYYY-MM-DD |
```

**Rules:**
- Each code-writing agent (DEV, QA-UNIT, QA-INT) MUST read its principles file FIRST
- Then create or append to this file with its agent type, version, and 3 key constraints
- The PreToolUse hook blocks source code edits until this file exists
- Multiple agents can append to the same file during a feature implementation

### ba-signoff.md

```markdown
# BA Sign-Off: [Feature Name]

**Date:** YYYY-MM-DD
**Agent:** BA
**Feature:** [Feature name / issue ID]

## Requirements Validated
- [x] Requirement 1 (source: docs/requirements/FILE.md, line N)
- [x] Requirement 2 (source: ...)

## Scope Confirmation
- All documented requirements are covered in the implementation plan
- No requirements were deferred without explicit user approval

## Missing Requirements Flagged
- None (or list any gaps found)
```

### sa-review.md

```markdown
# SA Review: [Feature Name]

**Date:** YYYY-MM-DD
**Agent:** SA
**Feature:** [Feature name / issue ID]

## API Contracts Validated
- [x] Endpoints match LLD / OpenAPI spec
- [x] DTOs/interfaces match backend records

## Data Model Review
- [x] Entity relationships correct
- [x] Database schema aligned with canonical model

## Issues Found
- None (or list any issues)
```

### qa-report.md

```markdown
# QA Report: [Feature Name]

**Date:** YYYY-MM-DD
**Agent:** QA
**Feature:** [Feature name / issue ID]

## Test Execution Summary
| Level | Total | Passed | Failed | Skipped | Coverage |
|-------|-------|--------|--------|---------|----------|
| Unit  | NN    | NN     | 0      | 0       | XX%      |
| E2E   | NN    | NN     | 0      | 0       | -        |

## Tests Executed
- `npx vitest run` — [result]
- `npx playwright test` — [result]

## DoD Checklist
- [x] Unit tests pass (>=80% coverage)
- [x] E2E tests pass
- [x] Responsive tests pass
- [x] Accessibility tests pass
- [x] Build green (`ng build` / `mvn verify`)
```

## Bypass Mechanism

For trivial changes (typo fixes, comment updates), create a bypass file:

```bash
echo "Bypass reason: typo fix in README" > docs/sdlc-evidence/.bypass
```

The bypass file is checked by hooks and allows the operation. It is automatically
deleted by the pre-commit hook after use (single-use bypass).

## Cleanup

Evidence files are feature-scoped. After a feature is committed and merged,
the evidence files can be removed or archived. The pre-commit hook only checks
for existence, not historical accumulation.
