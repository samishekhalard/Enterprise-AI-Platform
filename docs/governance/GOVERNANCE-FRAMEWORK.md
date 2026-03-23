# SDLC Agent Governance Framework v2.1

## Version

- **Version:** 2.1.0
- **Last Updated:** 2026-02-26
- **Owner:** Architecture Team (ARCH Agent)
- **Review Cycle:** Quarterly
- **Status:** Active

---

## Table of Contents

1. [Purpose](#1-purpose)
2. [Agent Roles and Responsibilities](#2-agent-roles-and-responsibilities)
3. [Principles Files](#3-principles-files)
4. [Enforcement Protocol](#4-enforcement-protocol)
5. [Continuous Improvement Process](#5-continuous-improvement-process)
6. [Metrics Tracked](#6-metrics-tracked)
7. [Cross-Agent Workflows](#7-cross-agent-workflows)
8. [Definition of Done (Quality Gate)](#8-definition-of-done-quality-gate)
9. [Checklists](#9-checklists)
10. [Documentation Traceability](#10-documentation-traceability)
11. [Quick Reference](#11-quick-reference)
12. [References](#12-references)
13. [Changelog](#13-changelog)

---

## 1. Purpose

### 1.1 Why This Framework Exists

The SDLC Agent Governance Framework establishes the rules, standards, and enforcement mechanisms that govern all AI agents operating within the EMSIST platform development lifecycle. It exists to solve critical problems:

| Problem | Solution |
|---------|----------|
| **Documentation drift** | Evidence-based documentation rules requiring code verification |
| **Inconsistent outputs** | Standardized principles files for each agent |
| **Quality variations** | Mandatory checklists before task completion |
| **Unclear ownership** | RACI matrix defining who does what |
| **No accountability** | Enforcement protocol with violation tracking |
| **Static processes** | Continuous improvement through feedback loops |

### 1.2 Goals

1. **Consistency** - Every agent produces outputs in standardized formats
2. **Quality** - All deliverables meet defined quality gates
3. **Traceability** - Clear chain from requirements to deployment
4. **Accountability** - Every decision has an owner
5. **Improvement** - Framework evolves based on feedback
6. **Transparency** - Clear metrics and status visibility

### 1.3 Scope

This framework governs:
- All SDLC agent behaviors and outputs
- Documentation standards across the project
- Cross-agent collaboration protocols
- Quality gates and enforcement mechanisms
- Continuous improvement processes

### 1.4 Non-Goals

This framework does NOT:
- Replace human judgment for critical decisions
- Define business requirements (BA agent responsibility)
- Specify implementation details (DEV agent responsibility)
- Manage project timelines (PM agent responsibility)

---

## 2. Agent Roles and Responsibilities

### 2.1 Agent Registry

| Agent | Code | Domain | Principles File |
|-------|------|--------|-----------------|
| Architecture | ARCH | Architecture decisions, HLD, ADRs, tech governance | [ARCH-PRINCIPLES.md](./agents/ARCH-PRINCIPLES.md) |
| Solution Architecture | SA | LLD, API contracts, canonical data model | [SA-PRINCIPLES.md](./agents/SA-PRINCIPLES.md) |
| Business Analysis | BA | Requirements, user stories, domain model | [BA-PRINCIPLES.md](./agents/BA-PRINCIPLES.md) |
| Development | DEV | Backend/frontend implementation | [DEV-PRINCIPLES.md](./agents/DEV-PRINCIPLES.md) |
| Database Administration | DBA | Database design, optimization, migrations | [DBA-PRINCIPLES.md](./agents/DBA-PRINCIPLES.md) |
| Quality Assurance | QA | Test strategy, quality gates | [QA-PRINCIPLES.md](./agents/QA-PRINCIPLES.md) |
| Security | SEC | Security review, threat modeling | [SEC-PRINCIPLES.md](./agents/SEC-PRINCIPLES.md) |
| DevOps | DEVOPS | CI/CD, infrastructure, deployment | [DEVOPS-PRINCIPLES.md](./agents/DEVOPS-PRINCIPLES.md) |
| Documentation | DOC | API docs, user guides, arc42 | [DOC-PRINCIPLES.md](./agents/DOC-PRINCIPLES.md) |
| Project Management | PM | Backlog, coordination, planning | (Orchestrator) |
| Release | REL | Release planning, deployment coordination | (Orchestrator) |
| User Acceptance Testing | UAT | UAT coordination, user feedback | (Orchestrator) |

### 2.2 RACI Matrix

**Legend:**
- **R** = Responsible (Does the work)
- **A** = Accountable (Final decision maker)
- **C** = Consulted (Provides input)
- **I** = Informed (Notified of outcome)

| Activity | ARCH | SA | BA | DEV | DBA | QA | SEC | DEVOPS | DOC |
|----------|------|----|----|-----|-----|----|-----|--------|-----|
| **Architecture Decisions** | A/R | C | I | I | C | I | C | C | I |
| **ADR Creation** | A/R | C | C | I | C | I | C | I | I |
| **HLD (C4 L1-L2)** | A/R | C | C | I | I | I | C | C | I |
| **LLD (C4 L3)** | C | A/R | I | C | C | I | C | I | I |
| **API Contract Design** | C | A/R | C | C | I | I | C | I | C |
| **Domain Model** | I | C | A/R | I | I | I | I | I | I |
| **Canonical Data Model** | C | A/R | C | I | C | I | I | I | I |
| **Database Schema** | I | C | I | I | A/R | I | I | I | I |
| **Backend Implementation** | I | C | I | A/R | C | C | C | I | I |
| **Frontend Implementation** | I | C | I | A/R | I | C | C | I | I |
| **Test Strategy** | I | I | I | C | I | A/R | C | I | I |
| **Unit Tests** | I | I | I | R | I | A | I | I | I |
| **Integration Tests** | I | I | I | C | I | A/R | C | C | I |
| **Security Review** | C | C | I | C | C | C | A/R | C | I |
| **Infrastructure** | C | I | I | I | I | I | C | A/R | I |
| **CI/CD Pipeline** | I | I | I | C | I | C | C | A/R | I |
| **API Documentation** | I | C | I | C | I | I | I | I | A/R |
| **User Documentation** | I | I | C | I | I | I | I | I | A/R |
| **Release Notes** | I | I | C | C | I | C | I | C | A/R |

### 2.3 Decision Authority Matrix

| Decision Type | Primary Authority | Escalation Path |
|---------------|-------------------|-----------------|
| Technology stack selection | ARCH | CTO / ARB |
| Architecture patterns | ARCH | None |
| API design choices | SA | ARCH |
| Database technology | ARCH + DBA | CTO |
| Security requirements | SEC | CISO |
| Quality gates | QA | ARCH |
| Release timing | REL + PM | Product Owner |
| Breaking changes | ARCH | ARB |
| Vendor selection | ARCH | CTO + Procurement |
| Budget impact >$10K | ARCH | Finance + CTO |

### 2.4 Escalation Matrix

| Situation | From Agent | Escalate To |
|-----------|------------|-------------|
| Architecture conflict | Any | ARCH |
| Security concern | Any | SEC |
| Implementation blocker | DEV | SA |
| Quality gate failure | DEV | QA |
| Database issue | DEV/SA | DBA |
| Infrastructure issue | Any | DEVOPS |
| Documentation outdated | Any | DOC |
| Cross-agent conflict | Any | PM (Orchestrator) |
| Strategic decision | ARCH | Human (CTO/ARB) |

---

## 3. Principles Files

### 3.1 Purpose

Each agent has a dedicated principles file that defines its behavioral contract. These files are the authoritative source for agent behavior and MUST be read before any work begins.

### 3.2 Location

```
docs/governance/agents/
├── ARCH-PRINCIPLES.md    # Architecture agent rules
├── SA-PRINCIPLES.md      # Solution architecture rules
├── BA-PRINCIPLES.md      # Business analysis rules
├── DEV-PRINCIPLES.md     # Development rules
├── DBA-PRINCIPLES.md     # Database rules
├── QA-PRINCIPLES.md      # Quality assurance rules
├── SEC-PRINCIPLES.md     # Security rules
├── DEVOPS-PRINCIPLES.md  # DevOps rules
└── DOC-PRINCIPLES.md     # Documentation rules
```

### 3.3 Required Structure

Every principles file MUST contain these sections:

| Section | Purpose | Required Content |
|---------|---------|------------------|
| **Version** | Track changes | Semantic version (vX.Y.Z), last updated date, changelog reference |
| **MANDATORY** | Non-negotiable rules | Rules that MUST be followed; read BEFORE any work |
| **Standards** | Domain-specific rules | Patterns, conventions, and technical standards |
| **Forbidden** | Prohibited actions | Explicit list of what agent must NEVER do |
| **Checklist** | Quality gate | Items to verify before completing ANY task |
| **Continuous Improvement** | Feedback mechanism | How to suggest changes + feedback log |
| **Changelog** | Version history | Table of version, date, and changes |
| **References** | Related documents | Links to governance framework, templates, etc. |

### 3.4 How Principles Files Work

```
Agent Spawn
    |
    v
┌─────────────────────────────────────────────────┐
│ Step 1: READ PRINCIPLES FILE                     │
│   - Load docs/governance/agents/{AGENT}-PRINCIPLES.md │
│   - Parse MANDATORY section                      │
│   - Parse Forbidden section                      │
│   - Parse Standards section                      │
└─────────────────────────────────────────────────┘
    |
    v
┌─────────────────────────────────────────────────┐
│ Step 2: ACKNOWLEDGE CONSTRAINTS                  │
│   - First response must confirm key rules        │
│   - State any limitations or conflicts           │
│   - Request clarification if needed              │
└─────────────────────────────────────────────────┘
    |
    v
┌─────────────────────────────────────────────────┐
│ Step 3: EXECUTE TASK                             │
│   - Follow Standards section patterns            │
│   - Avoid all Forbidden actions                  │
│   - Apply MANDATORY rules throughout             │
└─────────────────────────────────────────────────┘
    |
    v
┌─────────────────────────────────────────────────┐
│ Step 4: VALIDATE OUTPUT                          │
│   - Run through Checklist section                │
│   - Mark each item passed/failed                 │
│   - Document any violations                      │
└─────────────────────────────────────────────────┘
    |
    v
┌─────────────────────────────────────────────────┐
│ Step 5: COMPLETE WITH HANDOFF                    │
│   - Report completion status                     │
│   - Note any improvement suggestions             │
│   - Hand off to downstream agents if needed      │
└─────────────────────────────────────────────────┘
```

### 3.5 Principles File Updates

Updates follow a controlled process:

1. **Propose** - Log suggestion in the Feedback Log section
2. **Review** - ARCH agent reviews with affected agents
3. **Approve** - Human approval for significant changes
4. **Update** - Edit file with version bump
5. **Communicate** - All agents notified of changes

Version numbering:
- **Major (X.0.0)** - Breaking changes to agent behavior
- **Minor (0.X.0)** - New rules or standards added
- **Patch (0.0.X)** - Clarifications or corrections

---

## 4. Enforcement Protocol

### 4.1 Pre-Execution Enforcement

When an agent is spawned:

```
1. MUST read docs/governance/agents/{AGENT}-PRINCIPLES.md
2. MUST acknowledge key constraints in first response
3. MUST check docs/governance/PENDING-QUESTIONS.md for blockers
4. MUST verify current project state before changes
5. SHOULD check docs/governance/DISCREPANCY-LOG.md for known issues
```

### 4.2 During-Execution Enforcement

During task execution:

```
1. MUST follow standards from principles file
2. MUST avoid all forbidden practices
3. MUST document any principle deviations
4. SHOULD log improvement suggestions
5. MUST halt and escalate if blocker encountered
```

### 4.3 Post-Execution Enforcement

Before completing a task:

```
1. MUST run completion checklist from principles file
2. MUST report any violations encountered
3. MUST update relevant documentation
4. MUST handoff to downstream agents if applicable
5. MUST update progress tracking if applicable
```

### 4.4 Violation Categories

| Category | Severity | Example | Response |
|----------|----------|---------|----------|
| **Critical** | Immediate halt | Security bypass, data loss risk | Stop work, escalate to SEC/ARCH |
| **Major** | Fix before completion | Missing tests, aspirational docs | Remediate before task complete |
| **Minor** | Log and continue | Style violation, missing comment | Log in violation report |
| **Warning** | Note and proceed | Suboptimal pattern | Note for improvement |

### 4.5 Violation Handling Process

```
Violation Detected
    |
    v
┌─────────────────────────────────────────────────┐
│ Step 1: DOCUMENT                                 │
│   - Record what rule was violated                │
│   - Record where (file, line, task)              │
│   - Record when (timestamp)                      │
│   - Record severity level                        │
└─────────────────────────────────────────────────┘
    |
    v
┌─────────────────────────────────────────────────┐
│ Step 2: CLASSIFY                                 │
│   - Critical → HALT and ESCALATE                 │
│   - Major → REMEDIATE before continue            │
│   - Minor → LOG and CONTINUE                     │
│   - Warning → NOTE and CONTINUE                  │
└─────────────────────────────────────────────────┘
    |
    v
┌─────────────────────────────────────────────────┐
│ Step 3: REMEDIATE                                │
│   - Fix the violation if possible                │
│   - If cannot fix, document why                  │
│   - Request assistance if needed                 │
└─────────────────────────────────────────────────┘
    |
    v
┌─────────────────────────────────────────────────┐
│ Step 4: LOG                                      │
│   - Add to Lessons Learned in CLAUDE.md          │
│   - Update DISCREPANCY-LOG.md if docs affected   │
│   - Suggest principles update if systemic        │
└─────────────────────────────────────────────────┘
```

### 4.6 Automated Validation

The validation script checks governance compliance:

```bash
./docs/governance/validation/validate-principles.sh
```

Checks performed:
- Principle file structure (all required sections present)
- Version format compliance (semantic versioning)
- Checklist completeness (no empty sections)
- Cross-references valid (linked files exist)
- No prohibited patterns in output

### 4.7 Hourly Audit Protocol

Every 60 minutes of active work:

1. **Spawn audit agents**
   - `arch` agent: Check ADRs vs implementation
   - `sa` agent: Check data models vs entities
   - `doc` agent: Check arc42 vs codebase

2. **Report discrepancies**
   - Add to `docs/governance/DISCREPANCY-LOG.md`
   - Categorize by severity
   - Assign owner for resolution

3. **User notification**
   - Present findings to user
   - Request decision on resolution priority

---

## 5. Continuous Improvement Process

### 5.1 Philosophy

The governance framework is a living document that evolves based on:
- **Experience** - Lessons learned from actual usage
- **Feedback** - Suggestions from agents and humans
- **Incidents** - Failures that reveal gaps
- **Technology** - Changes in tools and platforms

### 5.2 Improvement Sources

| Source | Description | Frequency |
|--------|-------------|-----------|
| **Agent Feedback** | Suggestions logged in principles files | Continuous |
| **Violation Analysis** | Patterns from violation logs | Sprint review |
| **Retrospectives** | Team review of process effectiveness | Sprint end |
| **Incident Post-mortems** | Root cause analysis of failures | Per incident |
| **Metric Analysis** | Trends from governance metrics | Monthly |
| **External Input** | Industry best practices, tool updates | Quarterly |

### 5.3 Feedback Collection

Each agent logs suggestions in their principles file:

```markdown
### Feedback Log

| Date | Suggestion | Rationale | Status |
|------|------------|-----------|--------|
| 2026-02-25 | Add XYZ rule | Prevents ABC issue | PENDING |
```

Orchestrator collects feedback during:
- Task completion (optional improvement notes)
- Violation remediation (suggested preventions)
- Cross-agent handoffs (process friction points)

### 5.4 Review Cadence

| Review Type | Frequency | Participants | Output |
|-------------|-----------|--------------|--------|
| **Metrics Review** | Monthly | ARCH + PM | Dashboard update |
| **Principles Review** | Quarterly | All agents | Version updates |
| **Incident Review** | Per incident | Affected agents | Lessons learned |
| **Framework Update** | Bi-annually | ARCH + Human | Major version |

### 5.5 Change Process

```
┌─────────────────────────────────────────────────┐
│ Step 1: PROPOSE                                  │
│   - Log in appropriate feedback log              │
│   - Include rationale and impact                 │
│   - Identify affected agents                     │
└─────────────────────────────────────────────────┘
    |
    v
┌─────────────────────────────────────────────────┐
│ Step 2: REVIEW                                   │
│   - ARCH reviews for architectural impact        │
│   - Affected agents provide input                │
│   - Conflicts identified and resolved            │
└─────────────────────────────────────────────────┘
    |
    v
┌─────────────────────────────────────────────────┐
│ Step 3: APPROVE                                  │
│   - Minor changes: ARCH approval                 │
│   - Major changes: Human approval required       │
│   - Rejection with rationale if not approved     │
└─────────────────────────────────────────────────┘
    |
    v
┌─────────────────────────────────────────────────┐
│ Step 4: IMPLEMENT                                │
│   - Update principles file(s)                    │
│   - Bump version number appropriately            │
│   - Update changelog                             │
└─────────────────────────────────────────────────┘
    |
    v
┌─────────────────────────────────────────────────┐
│ Step 5: COMMUNICATE                              │
│   - Notify all agents of changes                 │
│   - Update GOVERNANCE-FRAMEWORK.md if needed     │
│   - Archive previous version                     │
└─────────────────────────────────────────────────┘
```

### 5.6 Self-Correction Protocol

When a breach or glitch is discovered:

1. **Immediate** - Update CLAUDE.md with new rule
2. **Document** - Add to Lessons Learned Log
3. **Analyze** - Determine if systemic
4. **Update** - Modify principles file if needed
5. **Prevent** - Add validation check if possible

---

## 6. Metrics Tracked

### 6.1 Primary Metrics

| Metric | Definition | Target | Measurement |
|--------|------------|--------|-------------|
| **Principle Compliance** | % of agent outputs following rules | >95% | Checklist pass rate |
| **Violation Rate** | Principle breaches per sprint | <5 | Violation log count |
| **Improvement Rate** | % of suggestions implemented | >50% | Feedback log tracking |
| **Governance Health** | Overall framework effectiveness | Green | Composite score |

### 6.2 Secondary Metrics

| Metric | Definition | Target | Measurement |
|--------|------------|--------|-------------|
| **Documentation Currency** | % of docs updated within 30 days | >80% | Last modified dates |
| **ADR Accuracy** | % of ADRs with correct status | 100% | Code verification |
| **Discrepancy Count** | Open documentation discrepancies | <10 | DISCREPANCY-LOG.md |
| **Escalation Rate** | Issues escalated per sprint | <3 | Escalation tracking |
| **Handoff Success** | Clean handoffs between agents | >90% | Handoff completion |

### 6.3 Agent-Specific Metrics

| Agent | Key Metrics |
|-------|-------------|
| ARCH | ADR quality, arc42 currency, decision latency |
| SA | API spec completeness, LLD accuracy |
| BA | Story completeness, acceptance criteria quality |
| DEV | Code coverage, build success rate |
| DBA | Migration success, query performance |
| QA | Test coverage, defect escape rate |
| SEC | Vulnerability count, scan compliance |
| DEVOPS | Deployment frequency, MTTR |
| DOC | Documentation accuracy, update frequency |

### 6.4 Health Score Calculation

| Factor | Weight | Score Range | Weighted |
|--------|--------|-------------|----------|
| Principle Compliance | 30% | 0-100% | 0-30 |
| Violation Rate | 25% | 0-100% | 0-25 |
| Improvement Rate | 15% | 0-100% | 0-15 |
| Documentation Currency | 15% | 0-100% | 0-15 |
| Checklist Completion | 15% | 0-100% | 0-15 |
| **Total** | **100%** | | **0-100** |

### 6.5 Health Status Thresholds

| Score | Status | Meaning | Action |
|-------|--------|---------|--------|
| 90-100% | Green | Healthy | Continue monitoring |
| 70-89% | Yellow | Attention needed | Review problem areas |
| 50-69% | Orange | Significant issues | Action plan required |
| <50% | Red | Critical | Immediate intervention |

### 6.6 Metrics Dashboard

Full metrics are tracked in [METRICS-DASHBOARD.md](./metrics/METRICS-DASHBOARD.md).

Data is stored in [governance-metrics.json](./metrics/governance-metrics.json).

---

## 7. Cross-Agent Workflows

### 7.1 Data Model Workflow

The canonical data model follows a strict agent chain:

```
BA Agent (Business Domain Model)
    |
    | Output: docs/data-models/domain-model.md
    v
SA Agent (Canonical Data Model)
    |
    | Output: docs/data-models/CANONICAL-DATA-MODEL.md
    v
DBA Agent (Physical Schema)
    |
    | Output: backend/*/migrations/
    v
DEV Agent (Implementation)
    |
    | Output: backend/*/src/main/java/**/domain/
```

**Rule:** Never skip steps. BA defines business objects BEFORE SA creates technical model.

### 7.2 Feature Development Workflow

```
BA Agent (User Stories + Acceptance Criteria)
    |
    v
ARCH Agent (HLD if architectural impact)
    |
    v
SA Agent (LLD + API Contracts)
    |
    v
SEC Agent (Security Review)
    |
    v
DEV Agent (Implementation)
    |
    v
QA Agent (Test Strategy + Execution)
    |
    v
DOC Agent (Documentation)
    |
    v
DEVOPS Agent (Deployment)
```

### 7.3 Architecture Change Workflow

```
ARCH Agent (ADR + HLD Update)
    |
    +-- SA Agent (LLD Impact Analysis)
    +-- SEC Agent (Security Impact)
    +-- DBA Agent (Database Impact)
    |
    v
Human Review (ARB)
    |
    v
DEV/DEVOPS Agents (Implementation)
```

### 7.4 Documentation Workflow

For documentation tasks, always verify against code first:

```
DOC Agent receives task
    |
    v
Spawn verification agents in parallel:
    +-- arch (verify ADRs vs code)
    +-- sa (verify data models vs code)
    +-- qa (verify test coverage)
    |
    v
DOC Agent creates documentation based on verified state
```

---

## 8. Definition of Done (Quality Gate)

**Added:** 2026-02-26

### 8.0 Purpose

The Definition of Done (DoD) is the mandatory quality gate that prevents features from being marked "complete" without verified testing. It is enforced at the CLAUDE.md level, the DEV-PRINCIPLES level, and the QA-PRINCIPLES level.

### 8.0.1 DoD Chain of Responsibility

```
DEV Agent (writes code + tests)
    |
    | Delivers: source code + test files
    | Self-checks: build passes, unit tests pass
    v
QA Agent (executes full test suite)
    |
    | Executes: unit + integration + E2E + responsive + a11y + security
    | Produces: Test Execution Report
    v
Orchestrator (verifies DoD gates)
    |
    | Checks: all gates pass in DoD table
    | Only then: marks feature as DONE
    v
User (reviews and accepts)
```

### 8.0.2 DoD Gate Summary

| Gate | Who Enforces | Evidence |
|------|-------------|----------|
| Code compiles | DEV | Build output |
| Unit tests pass (>=80% coverage) | DEV → QA | Test + coverage report |
| Integration tests pass | QA-INT | Testcontainers output |
| E2E tests pass (if UI) | QA-INT | Playwright output |
| Responsive tests pass (if UI) | QA-INT | Viewport test results |
| Accessibility passes (if UI) | QA-INT | axe-core output |
| Security tests pass (if auth) | SEC | Security test output |
| Smoke test passes | QA | Critical path verification |
| No CRITICAL/HIGH defects | QA | Defect log |
| Documentation accurate | DOC | EBD verification |

### 8.0.3 References

- Full DoD tables: [CLAUDE.md](../../CLAUDE.md) → "Definition of Done" section
- DEV gate: [DEV-PRINCIPLES.md](./agents/DEV-PRINCIPLES.md) → "Definition of Done — DEV Gate"
- QA gate: [QA-PRINCIPLES.md](./agents/QA-PRINCIPLES.md) → "Definition of Done — QA Gate"

---

## 9. Checklists

### 9.1 Available Checklists

| Checklist | Purpose | Location |
|-----------|---------|----------|
| **Definition of Done** | Before marking feature complete | [CLAUDE.md](../../CLAUDE.md) |
| **Pre-Commit** | Before code commit | [pre-commit-checklist.md](./checklists/pre-commit-checklist.md) |
| **Design Review** | Before implementation | [design-review-checklist.md](./checklists/design-review-checklist.md) |
| **Release** | Before deployment | [release-checklist.md](./checklists/release-checklist.md) |

### 9.2 When to Use

| Situation | Checklist |
|-----------|-----------|
| Feature implementation complete | **Definition of Done** |
| Developer ready to commit code | Pre-Commit |
| Design ready for implementation | Design Review |
| Release candidate ready | Release |
| Each agent task completion | Agent-specific (in principles file) |

---

## 10. Documentation Traceability

### 9.1 Traceability Chain

```
Business Requirements (BA)
    |
    v
ADRs (ARCH) --> arc42 sections
    |
    v
LLD (SA) --> API Contracts
    |
    v
Implementation (DEV) --> Source Code
    |
    v
Tests (QA) --> Coverage Reports
    |
    v
Documentation (DOC) --> User Guides
```

### 9.2 ADR-to-Arc42 Mapping

| ADR Category | Arc42 Section(s) |
|--------------|------------------|
| Platform/Infrastructure | 07-deployment-view.md |
| Technology Stack | 04-solution-strategy.md, 09-architecture-decisions.md |
| Service Architecture | 05-building-blocks.md |
| Authentication/Security | 08-crosscutting.md |
| Data Architecture | 05-building-blocks.md, 08-crosscutting.md |
| Integration Patterns | 06-runtime-view.md |
| Quality Attributes | 10-quality-requirements.md |

### 9.3 Documentation Status Tags

Every feature in documentation must use:

| Tag | Meaning | Proof Required |
|-----|---------|----------------|
| `[IMPLEMENTED]` | Code exists, verified | File path + code snippet |
| `[IN-PROGRESS]` | Partial implementation | What exists vs what's missing |
| `[PLANNED]` | Design only, no code | Explicitly state "not yet built" |

---

## 11. Quick Reference

### 11.1 Agent Spawn Protocol

1. Read `docs/governance/agents/{AGENT}-PRINCIPLES.md`
2. Acknowledge key constraints
3. Check `docs/governance/PENDING-QUESTIONS.md`
4. Execute task following standards
5. Run completion checklist
6. Report and handoff

### 11.2 Key File Locations

| File | Purpose |
|------|---------|
| `docs/governance/GOVERNANCE-FRAMEWORK.md` | This document (master) |
| `docs/governance/PENDING-QUESTIONS.md` | Unanswered questions queue |
| `docs/governance/DISCREPANCY-LOG.md` | Documentation mismatches |
| `docs/governance/FRONTEND-ADVANCED-CSS-GOVERNANCE.md` | Frontend CSS implementation standards (feature detection, modality, RTL/logical properties, print/accessibility utilities) |
| `docs/governance/agents/*-PRINCIPLES.md` | Agent behavior contracts |
| `docs/governance/checklists/*.md` | Quality gate checklists |
| `docs/governance/metrics/METRICS-DASHBOARD.md` | Governance metrics |
| `CLAUDE.md` | Project instructions + lessons learned |

### 11.3 Common Commands

| Action | Command/Process |
|--------|-----------------|
| Validate principles | `./docs/governance/validation/validate-principles.sh` |
| Check pending questions | Read `PENDING-QUESTIONS.md` |
| Log discrepancy | Edit `DISCREPANCY-LOG.md` |
| Suggest improvement | Edit agent's Feedback Log section |

### 11.4 Severity Quick Guide

| Severity | Action Required |
|----------|-----------------|
| Critical | STOP immediately, escalate |
| Major | Fix before completing task |
| Minor | Log and continue |
| Warning | Note and proceed |

---

## 12. References

### 12.1 Internal Documents

- [CLAUDE.md](/CLAUDE.md) - Project-level instructions and lessons learned
- [arc42 Documentation](../arc42/) - Architecture documentation
- [ADR Index](../adr/) - Architecture Decision Records
- [Data Models](../data-models/) - Domain and canonical data models
- [Validation Rules](./validation/validation-rules.json) - Automated checks

### 12.2 External References

- [MADR Format](https://adr.github.io/madr/) - ADR template
- [arc42 Template](https://arc42.org/) - Architecture documentation
- [C4 Model](https://c4model.com/) - Architecture diagrams
- [Keep a Changelog](https://keepachangelog.com/) - Changelog format

---

## 13. Changelog

| Version | Date | Changes |
|---------|------|---------|
| 2.1.0 | 2026-02-26 | Added Section 8: Definition of Done (Quality Gate) with DoD chain of responsibility, gate summary, and cross-references to agent principles. Renumbered sections 9-13. |
| 2.0.0 | 2026-02-25 | Major revision: expanded purpose, added RACI matrix, detailed principles file structure, enhanced enforcement protocol, comprehensive metrics, quick reference guide |
| 1.0.0 | 2026-02-25 | Initial governance framework |

---

**Next Steps:**
1. Read individual agent principles in [agents/](./agents/)
2. Review checklists in [checklists/](./checklists/)
3. Check metrics dashboard in [metrics/](./metrics/)
