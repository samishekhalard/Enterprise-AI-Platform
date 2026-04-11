# ISSUE-INF-025: MailHog Exposed on Host Network

| Field | Value |
|-------|-------|
| Severity | MEDIUM |
| Category | Security |
| Source | SEC-14 |
| Priority | P2 |
| Status | OPEN |
| Opened | 2026-03-02 |
| Blocked By | — |
| Fixes | docker-compose.*.yml |
| Closes With | Restrict MailHog to dev only, bind to localhost |

## Description

MailHog (email testing tool) web UI is exposed on the host network (port 8025) in both dev and staging Docker Compose files. In staging, this allows anyone with network access to read all test emails, which may contain password reset links, verification codes, or notification content.

## Evidence

- docker-compose.dev.yml: MailHog ports `8025:8025` (web UI) and `1025:1025` (SMTP)
- docker-compose.staging.yml: Same port mapping
- MailHog has no authentication for its web interface

## Remediation

1. **Dev:** Bind MailHog to localhost only: `127.0.0.1:8025:8025`
2. **Staging:** Remove MailHog or replace with a real SMTP relay (e.g., AWS SES sandbox)
3. **Production:** No MailHog at all — use production SMTP service

## Acceptance Criteria

- [ ] MailHog is not exposed on staging
- [ ] MailHog binds to localhost in dev
- [ ] Production deployment has no MailHog service
