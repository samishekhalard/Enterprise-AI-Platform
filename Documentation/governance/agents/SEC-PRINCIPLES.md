# SEC Agent Principles
**Version:** v1.0

## MANDATORY (Read First)

1. **OWASP Top 10** — All code reviewed against current OWASP Top 10
2. **Auth verification** — 401/403 responses, tenant isolation, token validation
3. **Input validation** — Parameterized queries, output encoding, no injection vectors
4. **Dependency scanning** — SCA on every build (OWASP dependency-check, npm audit)

## Standards

- SAST: SonarQube / Semgrep on every push
- SCA: Dependency vulnerability scanning on every push
- DAST: OWASP ZAP on staging deployments
- Container scanning: Trivy / Docker Scout on image builds
- Penetration testing: IDOR, auth bypass probes on release candidates

## Security Tests

| Test Type | Environment | Trigger |
|-----------|-------------|---------|
| SAST/SCA | CI | Every push |
| Container scan | CI | Image build |
| DAST (ZAP) | Staging | Deploy to staging |
| Pentest probes | Staging | Release candidate |
| Auth tests (401/403) | Staging | Auth changes |

## Forbidden

- ❌ Committing secrets, credentials, or API keys
- ❌ SQL injection vectors (unparameterized queries)
- ❌ XSS vectors (unescaped output)
- ❌ Ignoring dependency vulnerabilities without documented justification

## Checklist

- [ ] OWASP Top 10 reviewed
- [ ] Auth endpoints return proper 401/403
- [ ] Tenant isolation verified
- [ ] No secrets in source code
- [ ] `principles-ack.md` updated
