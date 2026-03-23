# Pre-Commit Checklist v1.0

## Version

- **Version:** 1.0.0
- **Last Updated:** 2026-02-25
- **Purpose:** Verify code quality before committing changes

---

## Quick Reference

Run this checklist before every commit. All items must pass.

---

## Code Quality

- [ ] Code compiles without errors
- [ ] No compiler warnings (or documented exceptions)
- [ ] Code formatted per project standards (Checkstyle/ESLint)
- [ ] No TODO/FIXME without JIRA ticket reference
- [ ] No commented-out code blocks
- [ ] No debug statements (`System.out.println`, `console.log`)

## Testing

- [ ] Unit tests written for new code
- [ ] All existing tests pass
- [ ] Code coverage >= 80% for changed files
- [ ] Integration tests pass (if applicable)
- [ ] No `@Disabled` tests without JIRA ticket

## Security

- [ ] No secrets in code (passwords, API keys, tokens)
- [ ] No hardcoded credentials
- [ ] Input validation on new inputs
- [ ] Query-injection prevention (Cypher/SQL parameterization as applicable)
- [ ] XSS prevention (output encoding)
- [ ] Tenant isolation enforced (if data access)

## Multi-Tenancy

- [ ] Tenant scope predicate enforced in new data queries
- [ ] Tenant context verified in service methods and filters
- [ ] No cross-tenant data access possible

## Documentation

- [ ] JavaDoc/TSDoc for new public methods
- [ ] README updated (if applicable)
- [ ] API changes reflected in OpenAPI spec
- [ ] Changelog entry added (for significant changes)
- [ ] Architecture changes reflected in arc42 + ADR links
- [ ] No duplicate architecture statements across arc42 sections

## Git Hygiene

- [ ] Meaningful commit message (conventional commits)
- [ ] Commit includes only related changes
- [ ] No large binary files committed
- [ ] No generated files committed
- [ ] Branch is up-to-date with main

---

## Commit Message Format

```
type(scope): short description

Longer description if needed.

Refs: JIRA-123
Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no logic change |
| `refactor` | Restructuring, no behavior change |
| `test` | Adding/modifying tests |
| `chore` | Build, dependencies, config |

---

## Pre-Commit Hooks (Automated)

The following checks run automatically:

| Check | Tool | Failure Action |
|-------|------|----------------|
| Lint | Checkstyle/ESLint | Block commit |
| Secrets scan | GitLeaks | Block commit |
| Tests | JUnit/Jasmine | Block commit |
| Format | Prettier/SpotlessApply | Auto-fix or block |

---

## If Checklist Fails

1. Fix the issue
2. Re-run checklist
3. If exception needed, document in commit message
4. Get approval from code reviewer

---

## Related Checklists

- [Design Review Checklist](./design-review-checklist.md) - Before implementation
- [Release Checklist](./release-checklist.md) - Before deployment

---

**Last Updated:** 2026-02-25
