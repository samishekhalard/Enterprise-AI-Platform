# EMSIST — Way of Working

## Project

| Layer | Stack | Path |
|-------|-------|------|
| Backend | Java 23, Spring Boot 3.4.1, Spring Cloud 2024.0.0 | `backend/` |
| Frontend | Angular 21, PrimeNG 21, Vitest, Playwright | `frontend/` |
| Infrastructure | Docker Compose, Keycloak, Neo4j, PostgreSQL, Valkey | `infrastructure/docker/` |
| Documentation | Arc42, ADRs, LLDs, data models, governance | `Documentation/` |

## Interaction Style

- Always use `AskUserQuestion` with structured choices — never open-ended questions
- Mark the best option with "(Recommended)", always include "Other"
- Show a progress table (✅ 🔄 ⏳ ❌ ⚠️) after every completed action
- Track unanswered questions in `Documentation/governance/PENDING-QUESTIONS.md`

## Agent Routing

The orchestrator does NOT implement features directly. Spawn the right agent:

| Task | Agent |
|------|-------|
| Architecture, HLD, ADRs | `arch` |
| Requirements, domain model, user stories | `ba` |
| LLD, API contracts, canonical data model | `sa` |
| Database schema, migrations, optimization | `dba` |
| Backend + frontend implementation | `dev` |
| Unit tests (JUnit 5 / Vitest) | `qa-unit` |
| Integration, E2E, contract, a11y tests | `qa-int` |
| Regression, smoke, BVT | `qa-reg` |
| Load, stress, performance | `qa-perf` |
| Test strategy, QA coordination, triage | `qa` |
| Docker, CI/CD, linting, monitoring | `devops` |
| Security scanning, threat modeling | `sec` |
| UX, wireframes, accessibility specs | `ux` |
| Documentation | `doc` |
| Release planning, deployment | `rel` |
| UAT coordination | `uat` |
| Process analysis, BPMN | `pa` |
| Cross-cutting coordination | `pm` |

## Agent Collaboration Mode

When BA or SA agents need to work on design/requirements tasks that require user input:

1. **Orchestrator runs brainstorming skill first** — gathers requirements/design decisions interactively with the user
2. **Then dispatches BA/SA** with the validated decisions as input — agents execute, not decide
3. **If BA/SA encounter ambiguity** — they must document questions in `Documentation/governance/PENDING-QUESTIONS.md` and stop, not assume

**Agents that must consult the user during work** (via orchestrator relay):
- `ba` — requirements gathering, user story validation, acceptance criteria review
- `sa` — design decisions, API contract review, data model validation
- `ux` — wireframe review, accessibility decisions
- `arch` — architecture decisions, ADR review

**Agents that work autonomously** (no user consultation needed):
- `dev`, `dba`, `qa-unit`, `qa-int`, `qa-reg`, `qa-perf`, `devops`, `sec`, `doc`, `rel`

When spawning a consulting agent, the orchestrator must:
- Run the `superpowers:brainstorming` skill for the relevant scope BEFORE dispatching
- Pass the brainstorming output (validated decisions) to the agent as context
- Review agent output and present key decisions back to the user for approval

## Workflow Chains

**Data model:** BA (business objects) → SA (technical model) → DBA (physical schema) → DEV (entities). Never skip steps.

**Feature implementation:** BA (validate requirements) → SA (validate design) → DEV (implement + unit tests) → QA (execute all tests). Each step blocks the next.

**Documentation changes:** Verify with arch + sa + qa agents before writing.

## Worktree Safety

1. **Current worktree is the baseline** — when a file is dirty, treat the current working tree as the source of truth for analysis and proposals, not `HEAD`.
2. **Capture baseline before editing** — before changing any non-trivial file, inspect:
   - current file contents
   - `git diff -- <file>`
   - `git diff --cached -- <file>`
   - whether the file already contains unrelated local changes
3. **Never erase unapproved changes** — if a file contains local edits not made in the current approved scope, preserve them unless the user explicitly authorizes reverting them.
4. **No destructive file resets without approval** — do not run `git checkout -- <file>`, `git restore <file>`, `git restore --source`, `git reset --hard`, or equivalent destructive revert commands unless the user explicitly approves that exact action.
5. **Use minimal corrective patches** — if you exceed approved scope, revert only the exact out-of-scope lines with a minimal patch. Do not revert the whole file.
6. **Dirty-file ambiguity blocks edits** — if the file is dirty and you cannot confidently separate pre-existing edits from planned edits, stop and ask the user how to proceed.

## Manual Approval Mode

When the user says work must proceed under manual approval:

1. Show the per-file proposal before editing.
2. Implement only the approved scope for that file.
3. Stop after each file and show:
   - the exact diff
   - file-scoped verification results
   - pre-existing baseline debt already in that file
   - confirmation that the edit did not worsen baseline debt
4. Do not commit until the user explicitly approves the commit.
5. Do not pull later-step work into the current file. For example, a spacing-only file must not include typography, color, radius, or unrelated cleanup unless the user explicitly expands scope.

## Command Discipline

When working in a dirty worktree or under manual approval, command order is mandatory.

1. **Before any command that touches a target file, re-read this span of instructions:** `## Worktree Safety` through `## Manual Approval Mode`.
2. **Baseline commands come first** — before any write command on a target file, run and inspect:
   - `git status --short <file>`
   - `git diff -- <file>`
   - `git diff --cached -- <file>`
   - current file contents
3. **Proposal before write** — do not run write commands until the user has approved the current-file proposal built from the current worktree baseline.
4. **One file, one concern, one step** — when a file is approved for a spacing step, do not include typography, color, radius, z-index, refactors, or unrelated cleanup in the same write sequence unless the user explicitly expands scope.
5. **If file state changes, stop** — if `git diff`, file contents, or command output shows the target file differs from the approved proposal, stop and regenerate the proposal from the current worktree before any further write command.
6. **No memory-based verification** — summaries must be derived from the current file contents and current `git diff`, not from earlier reads, prior sessions, or assumptions about `HEAD`.
7. **No unverified PASS claims** — only report `PASS` or `FAIL` for a check that was actually executed against the current file state in the current session. Otherwise label it `expected` or `unverified`.
8. **Commit commands come last** — only after diff review, file-scoped verification, non-regression review, and explicit user approval.

## Forbidden Without Approval

The following are forbidden unless the user explicitly approves the exact action:

1. `git checkout -- <file>`
2. `git restore <file>`
3. `git restore --source ...`
4. `git reset --hard`
5. any full-file revert
6. any batch edit spanning multiple files when approval was file-specific
7. any scope expansion beyond the approved file or approved step

## Enforcement Layers

| Layer | Mechanism | What it blocks |
|-------|-----------|---------------|
| Plan-mode | `EnterPlanMode` required for non-trivial features | Unplanned work |
| Hook | `.claude/hooks/check-agent-evidence.sh` | Source code edits without `ba-signoff.md` + `principles-ack.md` |
| Pre-commit | `.githooks/pre-commit` | Commits without `ba-signoff.md` + `qa-report.md` |

Evidence files live in `Documentation/sdlc-evidence/`. Bypass: `echo "reason" > Documentation/sdlc-evidence/.bypass` (single-use).

Setup: `git config core.hooksPath .githooks`

## Documentation Rules

1. **Evidence first** — never claim "implemented" without file path + code evidence
2. **Three-state tags** — `[IMPLEMENTED]`, `[IN-PROGRESS]`, `[PLANNED]`
3. **Present tense = proof** — "The system does X" must cite a source file
4. **No aspirational docs** — document what IS, not what SHOULD BE
5. **Mermaid only** — no ASCII box diagrams in markdown
6. **ADRs describe decisions, not status** — don't add implementation percentages to ADRs

## Definition of Done

| Artifact | Gates |
|----------|-------|
| Backend feature | Code + unit tests =100% + integration tests (Testcontainers) + security tests + `mvn clean verify` green |
| Frontend feature | Code + unit tests =100 (Vitest) + E2E (Playwright) + responsive (desktop/tablet/mobile) + a11y (WCAG AAA) + `ng build` green |
| Bug fix | Root cause documented + regression test + all tests pass |
| Docs | Evidence-based + cross-verified by 2+ agents |

Tests must be **executed**, not just written. No "done" without a QA report.
