# Requirements Template

> Use this when requesting new functionality or major behavior changes.

# REQ-YYYYMMDD-XX: <Requirement Title>

## Metadata

- **Requirement ID:** REQ-YYYYMMDD-XX
- **Status:** Draft | Approved | Implementing | Done
- **Owner:** <name/team>
- **Date:** YYYY-MM-DD
- **Linked Change Request:** <CHG-...>

## Business Context

<Why this is needed and what problem it solves.>

## Goals

- <goal 1>
- <goal 2>

## Success Metrics

- <metric, baseline, target>
- <metric, baseline, target>

## Scope

### In Scope

- <item>
- <item>

### Out of Scope

- <item>
- <item>

## Actors / Roles

- <role>: <responsibility>
- <role>: <responsibility>

## Functional Requirements

| ID | Requirement | Priority | Rationale |
|----|-------------|----------|-----------|
| FR-001 | <statement> | Must | <why> |
| FR-002 | <statement> | Should | <why> |

## Non-Functional Requirements

| ID | Category | Requirement |
|----|----------|-------------|
| NFR-001 | Performance | <e.g., p95 < 300ms> |
| NFR-002 | Security | <e.g., ADMIN/SUPER_ADMIN only> |
| NFR-003 | Reliability | <e.g., retry/idempotency/logging> |

## UX / API / Data Expectations

### UX

- <screen behavior>
- <validation/error states>

### API

- <endpoint contracts or references>

### Data

- <entity/schema changes>

## Constraints & Assumptions

- <constraint>
- <assumption>

## Dependencies

- <service/team/system dependency>

## Acceptance Criteria

- [ ] <AC 1>
- [ ] <AC 2>
- [ ] <AC 3>

## Test Scenarios

1. <happy path>
2. <negative path>
3. <authorization/tenant isolation path>

## Delivery Notes for Codex (Copy/Paste)

- Objective:
- Exact scope (files/components/services):
- Environments to validate (local/dev/stg):
- Priority order (1..n):
- UI parity baseline (`frontendold` references if needed):
- API assumptions or sample payloads:
- Done definition (what must be visible/working):
