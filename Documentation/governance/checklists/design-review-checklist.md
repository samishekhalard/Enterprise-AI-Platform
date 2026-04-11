# Design Review Checklist v1.0

## Version

- **Version:** 1.0.0
- **Last Updated:** 2026-02-25
- **Purpose:** Verify design quality before implementation begins

---

## Quick Reference

Complete this checklist before starting implementation of any feature or change. All applicable items must be verified.

---

## Prerequisites

- [ ] User stories defined with acceptance criteria (BA)
- [ ] Business domain model updated (BA)
- [ ] Architecture impact assessed (ARCH)
- [ ] Related ADRs reviewed and no conflicts

---

## Architecture Alignment

- [ ] Design aligns with approved ADRs
- [ ] No conflicting technology choices
- [ ] Patterns consistent with existing codebase
- [ ] Quality attributes (NFRs) addressed
- [ ] Multi-tenancy requirements considered
- [ ] Scalability implications assessed

## Service Design

- [ ] Service boundaries clearly defined
- [ ] Data ownership established (no shared databases)
- [ ] API contracts defined (OpenAPI spec)
- [ ] Integration patterns specified
- [ ] Error handling strategy documented
- [ ] Idempotency considered for mutations

## Data Model

- [ ] BA business domain model exists
- [ ] SA canonical data model created
- [ ] Entity relationships documented
- [ ] Tenant isolation strategy defined
- [ ] Data migration path identified (if changing existing)
- [ ] Indexes planned for query patterns

## Security

- [ ] Authentication requirements defined
- [ ] Authorization rules specified (RBAC/ABAC)
- [ ] STRIDE threat model completed (for new features)
- [ ] OWASP Top 10 mitigations identified
- [ ] Sensitive data handling documented
- [ ] Audit logging requirements specified

## API Design

- [ ] RESTful conventions followed
- [ ] Versioning strategy applied
- [ ] Request/response schemas defined
- [ ] Error responses use RFC 7807
- [ ] Pagination specified for list endpoints
- [ ] Rate limiting requirements identified

## Integration

- [ ] Upstream dependencies identified
- [ ] Downstream consumers considered
- [ ] Sync vs async communication decided
- [ ] Event schemas defined (if using events)
- [ ] Circuit breaker requirements assessed
- [ ] Retry/timeout strategies documented

## Testing Strategy

- [ ] Unit test approach defined
- [ ] Integration test scope identified
- [ ] E2E test scenarios documented
- [ ] Performance test requirements specified
- [ ] Test data strategy planned

## Documentation

- [ ] LLD document created
- [ ] C4 diagrams updated (if architectural change)
- [ ] API documentation drafted
- [ ] Architecture sections identified for update

## Deployment

- [ ] Infrastructure requirements identified
- [ ] Database migration approach planned
- [ ] Rollback strategy defined
- [ ] Feature flag requirements assessed
- [ ] Monitoring/alerting needs documented

---

## Review Meeting

### Participants

| Role | Required | Optional |
|------|----------|----------|
| SA (Designer) | Yes | - |
| ARCH (Reviewer) | Yes | - |
| DEV Lead | Yes | - |
| QA | Yes | - |
| SEC | For security-sensitive | - |
| DBA | For data-heavy features | - |

### Outcomes

| Outcome | Action |
|---------|--------|
| Approved | Proceed to implementation |
| Approved with Comments | Address minor issues during implementation |
| Needs Revision | Revise design, schedule re-review |
| Rejected | Major concerns, escalate to ARCH |

---

## Design Review Record

After review, document:

```markdown
## Design Review: {Feature Name}

**Date:** YYYY-MM-DD
**Participants:** [names]
**Outcome:** Approved / Approved with Comments / Needs Revision / Rejected

### Key Decisions
- {Decision 1}
- {Decision 2}

### Action Items
- [ ] {Action 1} - Assignee
- [ ] {Action 2} - Assignee

### Concerns Raised
- {Concern and resolution}
```

---

## Related Checklists

- [Pre-Commit Checklist](./pre-commit-checklist.md) - Before code commit
- [Release Checklist](./release-checklist.md) - Before deployment

---

**Last Updated:** 2026-02-25
