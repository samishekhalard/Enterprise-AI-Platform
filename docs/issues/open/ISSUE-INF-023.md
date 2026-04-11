# ISSUE-INF-023: Broken Feign Client (auth-facade → license-service)

| Field | Value |
|-------|-------|
| Severity | MEDIUM |
| Category | Architecture |
| Source | SA-AUDIT-2026-002 |
| Priority | P2 |
| Status | OPEN |
| Opened | 2026-03-02 |
| Blocked By | — |
| Fixes | backend/auth-facade |
| Closes With | Fix Feign client or replace with WebClient |

## Description

auth-facade declares a Feign client dependency for calling license-service (seat validation during login), but the Feign client configuration may be incomplete or broken. The login flow includes seat validation as a step, but the inter-service call has not been verified end-to-end.

## Evidence

- `AuthServiceImpl.java`: Login flow calls seat validation
- `SeatValidationController.java` exists in license-service
- No Eureka/service registry — services use Docker DNS names
- Feign client may be misconfigured without service discovery

## Remediation

Options (in order of preference):
1. **Replace Feign with WebClient:** Use Spring WebClient with hardcoded `http://license-service:8085` URL (matches Docker DNS)
2. **Fix Feign client:** Configure Feign with explicit URL (no service discovery needed)
3. **Remove seat validation from login:** If license-service is not yet production-ready, make seat validation optional

## Acceptance Criteria

- [ ] auth-facade can successfully call license-service seat validation endpoint
- [ ] Integration test verifies the inter-service call
- [ ] Fallback behavior documented (what happens if license-service is down)
