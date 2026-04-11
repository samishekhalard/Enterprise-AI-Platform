# Pending Questions Tracker

## Version

- **Version:** 1.0.0
- **Last Updated:** 2026-02-25
- **Purpose:** Track unanswered questions that block agent work

---

## Pending Questions (Must Answer Before Proceeding)

| ID | Question | Context | Agent | Asked On | Status | Blocking |
|----|----------|---------|-------|----------|--------|----------|
| - | No pending questions | - | - | - | - | - |

---

## Question Status Legend

| Status | Meaning |
|--------|---------|
| PENDING | Awaiting answer from user/stakeholder |
| ANSWERED | Response received, can proceed |
| ESCALATED | Sent to higher authority for decision |
| DEFERRED | Postponed to future sprint |
| RESOLVED | Question no longer relevant |

---

## Question Lifecycle

```
Asked --> PENDING --> ANSWERED --> Work proceeds
                  |
                  +--> ESCALATED --> Human decision --> ANSWERED
                  |
                  +--> DEFERRED --> Tracked for future
```

---

## Rules

1. **Track All Questions** - Every question asked must be logged here
2. **Persist Until Answered** - Questions remain until explicitly answered
3. **Re-prompt on Session Start** - Agents must check this file first
4. **Block Dependent Work** - Tasks requiring answers cannot proceed
5. **Clear on Answer** - Update status to ANSWERED when resolved

---

## Answered Questions Archive

| ID | Question | Answer | Agent | Answered By | Date |
|----|----------|--------|-------|-------------|------|
| - | No archived questions | - | - | - | - |

---

## Adding a New Question

When an agent needs to ask a question:

1. Generate next ID (Q001, Q002, etc.)
2. Add row to Pending Questions table
3. Set status to PENDING
4. Indicate if blocking current work
5. Present question to user via wizard-style interaction

---

## Resolving a Question

When an answer is received:

1. Update status to ANSWERED
2. Move row to Answered Questions Archive
3. Include who answered and date
4. Resume blocked work

---

**Last Checked:** 2026-02-25
**Checked By:** Governance Framework
