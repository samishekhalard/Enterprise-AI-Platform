# Change Request Template

> Use this for planned implementation work (feature, bugfix, refactor, hardening).

# CHG-YYYYMMDD-XX: <Change Title>

## Metadata

- **Change ID:** CHG-YYYYMMDD-XX
- **Status:** Proposed | Approved | In Progress | Done | Rejected
- **Type:** Feature | Bugfix | Refactor | Security Hardening | Infra
- **Priority:** P0 | P1 | P2 | P3
- **Requested By:** <name/team>
- **Requested On:** YYYY-MM-DD
- **Target Release:** <release/sprint>

## Problem / Opportunity

<What is the problem or opportunity this change addresses?>

## Objective

<Clear outcome in measurable terms.>

## Scope

### In Scope

- <item>
- <item>

### Out of Scope

- <item>
- <item>

## Impacted Components

| Area | Component/Service | Change Type | Risk |
|------|-------------------|-------------|------|
| Frontend | <component> | <UI/API> | Low/Med/High |
| Backend | <service> | <API/Logic/Security> | Low/Med/High |
| Data | <db/migration> | <schema/data> | Low/Med/High |
| Infra | <gateway/compose/k8s> | <routing/config> | Low/Med/High |

## API / Contract Changes

- Endpoint additions/changes: <list>
- Request/response changes: <list>
- Backward compatibility: Compatible | Breaking

## Security / Compliance Impact

- AuthN/AuthZ impact: <details>
- Data sensitivity impact: <details>
- Required approvals: <security/architecture/etc>

## Implementation Plan

1. <step 1>
2. <step 2>
3. <step 3>

## Testing & Evidence Plan

- Unit tests: <what>
- Integration tests: <what>
- E2E tests: <what>
- Manual checks: <what>
- Evidence location: `docs/evidence/<path>`

## Rollout Plan

- Deployment order: <order>
- Feature flag/toggle: <yes/no + details>
- Monitoring after release: <metrics/logs/alerts>

## Rollback Plan

- Trigger conditions: <when to rollback>
- Rollback steps: <how>
- Data rollback notes: <if applicable>

## Acceptance Criteria

- [ ] <AC 1>
- [ ] <AC 2>
- [ ] <AC 3>

## Approvals

- [ ] Product
- [ ] Engineering
- [ ] QA
- [ ] Security (if applicable)
