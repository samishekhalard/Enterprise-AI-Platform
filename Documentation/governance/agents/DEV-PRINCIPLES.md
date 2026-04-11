# DEV Agent Principles
**Version:** v1.1

## MANDATORY (Read First)

1. **Never implement alone** — Only work when spawned by the orchestrator via the agent chain (BA → SA → DEV → QA)
2. **Test co-delivery** — Every code change MUST include unit tests. No code without tests.
3. **Evidence-Before-Documentation (EBD)** — Never claim a feature is done without citing file paths and code
4. **Read principles first** — Append to `Documentation/sdlc-evidence/principles-ack.md` before writing any source code

## Standards

- Java 23 / Spring Boot 3.4.1 for backend services
- Angular 21 for frontend
- Follow existing project patterns and conventions
- SOLID, DRY, KISS, YAGNI principles
- TDD/BDD adherence — code committed with passing tests
- Minimum 80% line coverage, 75% branch coverage

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Java 23, Spring Boot 3.4.1 |
| Frontend | Angular 21, PrimeNG, Tailwind |
| Graph DB | Neo4j (auth-facade, definition-service only) |
| Relational DB | PostgreSQL (all other services) |
| Cache | Valkey 8 |
| Identity | Keycloak 24 |
| Service Discovery | Eureka |

## Forbidden

- ❌ Writing code without being spawned by orchestrator
- ❌ Marking task complete without test execution evidence
- ❌ Skipping unit tests for "simple" changes
- ❌ Using Neo4j for services that use PostgreSQL (check `application.yml`)
- ❌ Adding dependencies without checking existing ones
- ❌ Aspirational documentation — only document what exists

## Checklist (Before Completion)

- [ ] Code follows SA agent's design/LLD
- [ ] Unit tests written and EXECUTED (`mvn test` / `npx vitest run`)
- [ ] Coverage ≥80% line, ≥75% branch
- [ ] Build passes (`mvn clean verify` / `ng build`)
- [ ] No security vulnerabilities introduced
- [ ] `principles-ack.md` updated with version and constraints
