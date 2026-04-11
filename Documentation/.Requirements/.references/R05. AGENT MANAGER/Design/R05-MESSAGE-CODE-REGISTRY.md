# R05 AI Agent Platform -- Message Code Registry

**Product:** EMSIST AI Agent Platform
**Version:** 1.0
**Date:** 2026-03-13
**Author:** BA Agent
**Status:** [PLANNED] -- All codes are design-phase definitions; no implementation exists yet.

**Convention:** `{SERVICE}-{TYPE}-{SEQ}` where SERVICE = `AGT`, TYPE = `E` (Error) / `C` (Confirmation) / `W` (Warning) / `S` (Success), SEQ = 3-digit number.

**ADR-031 Compliance:** All message templates use parameterized placeholders (`{param}`). No hardcoded user-facing text in source code. All messages are resolved from the `message_codes` table at runtime via the Message Registry service (see R04 PRD Section 5.10).

---

## Summary

| Type | Range | Count | Description |
|------|-------|-------|-------------|
| AGT-E-xxx | AGT-E-001 to AGT-E-032 | 32 | Error codes |
| AGT-C-xxx | AGT-C-001 to AGT-C-012 | 12 | Confirmation codes |
| AGT-W-xxx | AGT-W-001 to AGT-W-010 | 10 | Warning codes |
| AGT-S-xxx | AGT-S-001 to AGT-S-016 | 16 | Success codes |
| **Total** | | **70** | |

---

## 1. Error Codes (AGT-E-xxx)

### 1.1 Agent CRUD Errors

| Code | Message Template | HTTP Status | Category | Trigger Context |
|------|-----------------|-------------|----------|-----------------|
| AGT-E-001 | Agent with ID `{agentId}` not found in tenant `{tenantId}` | 404 | AGENT_CRUD | GET/PUT/DELETE agent by ID |
| AGT-E-002 | An agent with name `{agentName}` already exists in tenant `{tenantId}` | 409 | AGENT_CRUD | POST create agent with duplicate name |
| AGT-E-003 | Agent name is required and must not be empty | 400 | AGENT_CRUD | POST/PUT agent with blank name |
| AGT-E-004 | Agent configuration validation failed: `{validationDetails}` | 400 | AGENT_CRUD | POST/PUT agent with invalid config (missing purpose, invalid model ref, etc.) |
| AGT-E-005 | Cannot modify agent `{agentName}` in state `{currentState}`. Allowed states: `{allowedStates}` | 409 | AGENT_CRUD | PUT agent that is Published or soft-deleted |
| AGT-E-006 | Import failed: agent configuration file is malformed. `{parseError}` | 400 | AGENT_IMPORT_EXPORT | POST import with invalid JSON/YAML |
| AGT-E-007 | Import failed: incompatible schema version `{fileVersion}` (expected `{expectedVersion}`) | 400 | AGENT_IMPORT_EXPORT | POST import with version mismatch |
| AGT-E-008 | Agent `{agentId}` is in soft-delete state. Restore or wait for hard deletion after `{expiryDate}` | 410 | AGENT_CRUD | Attempt to use soft-deleted agent |

### 1.2 Skill and Tool Errors

| Code | Message Template | HTTP Status | Category | Trigger Context |
|------|-----------------|-------------|----------|-----------------|
| AGT-E-009 | Skill `{skillName}` not found in tenant `{tenantId}` | 404 | SKILLS | GET/PUT/DELETE skill by name or ID |
| AGT-E-010 | Skill `{skillName}` version `{version}` conflicts with existing version. Use semantic versioning | 409 | SKILLS | POST/PUT skill with duplicate version |
| AGT-E-011 | Skill `{childSkill}` cannot inherit from `{parentSkill}`: circular inheritance detected | 400 | SKILLS | PUT skill inheritance creating a cycle (US-AI-068) |
| AGT-E-012 | Skill test case `{testCaseId}` failed: expected `{expected}`, got `{actual}` | 422 | SKILLS | POST test skill before activation (US-AI-066) |
| AGT-E-013 | Tool `{toolName}` not found in registry for tenant `{tenantId}` | 404 | TOOLS | Agent references unregistered tool |
| AGT-E-014 | Tool `{toolName}` execution timed out after `{timeoutMs}`ms | 504 | TOOLS | Tool call exceeds configured timeout (US-AI-005) |
| AGT-E-015 | Tool `{toolName}` execution failed: `{errorDetail}`. Circuit breaker open -- fallback active | 503 | TOOLS | Tool call triggers circuit breaker (US-AI-005) |
| AGT-E-016 | Custom script upload rejected: file type `{fileType}` not allowed. Accepted: `.py`, `.sh` | 400 | TOOLS | POST upload script with disallowed extension (US-AI-077) |

### 1.3 Pipeline and Execution Errors

| Code | Message Template | HTTP Status | Category | Trigger Context |
|------|-----------------|-------------|----------|-----------------|
| AGT-E-017 | Pipeline run `{runId}` failed at step `{stepName}`: `{errorDetail}` | 500 | PIPELINE | Any pipeline step failure (Section 3.9) |
| AGT-E-018 | Pipeline run `{runId}` timed out at step `{stepName}` after `{timeoutSeconds}`s | 504 | PIPELINE | State timeout exceeded (Section 3.9.3) |
| AGT-E-019 | Pipeline validation failed for run `{runId}`: `{validationRules}` violated | 422 | PIPELINE | Step 5 (Validate) deterministic check failure |
| AGT-E-020 | Maximum retry count (`{maxRetries}`) exceeded for run `{runId}`. Validation loop terminated | 500 | PIPELINE | Validate-to-Execute retry exhausted |
| AGT-E-021 | Pipeline run `{runId}` cannot be retried: current state `{state}` is not a terminal failure state | 409 | PIPELINE | POST retry on non-FAILED run (US-AI-303) |

### 1.4 Training and Knowledge Errors

| Code | Message Template | HTTP Status | Category | Trigger Context |
|------|-----------------|-------------|----------|-----------------|
| AGT-E-022 | Training job `{jobId}` failed: `{errorDetail}` | 500 | TRAINING | SFT/DPO/distillation job failure (US-AI-201, US-AI-202) |
| AGT-E-023 | Training data source `{sourceId}` is empty or contains no valid samples for agent `{agentId}` | 400 | TRAINING | Training triggered with insufficient data |
| AGT-E-024 | Model version rollback failed: version `{targetVersion}` not found for agent `{agentId}` | 404 | TRAINING | POST rollback to non-existent version (US-AI-215) |
| AGT-E-025 | Knowledge source `{sourceId}` upload failed: `{errorDetail}` | 500 | KNOWLEDGE | Document upload/chunking failure (US-AI-220) |
| AGT-E-026 | Knowledge source `{sourceId}` exceeds tenant storage quota (`{usedMb}`MB / `{quotaMb}`MB) | 413 | KNOWLEDGE | Upload exceeds tenant storage limit |

### 1.5 Chat and Conversation Errors

| Code | Message Template | HTTP Status | Category | Trigger Context |
|------|-----------------|-------------|----------|-----------------|
| AGT-E-027 | Conversation `{conversationId}` not found for user `{userId}` in tenant `{tenantId}` | 404 | CHAT | GET/resume conversation by ID (US-AI-052) |
| AGT-E-028 | Token budget exceeded: request consumed `{usedTokens}` of `{budgetTokens}` allowed tokens | 429 | CHAT | Per-request/conversation token limit hit (US-AI-017) |
| AGT-E-029 | Rate limit exceeded for user `{userId}`: `{requestCount}` requests in `{windowSeconds}`s (limit: `{limit}`) | 429 | CHAT | Per-user rate limit within tenant (US-AI-016) |

### 1.6 Security and Governance Errors

| Code | Message Template | HTTP Status | Category | Trigger Context |
|------|-----------------|-------------|----------|-----------------|
| AGT-E-030 | Prompt injection detected and blocked. Request `{requestId}` quarantined for review | 400 | SECURITY | Prompt injection sanitization (US-AI-013) |
| AGT-E-031 | Tool `{toolName}` access denied for agent at maturity level `{maturityLevel}`. Required: `{requiredLevel}` | 403 | SECURITY | Phase-based tool restriction (US-AI-015, Section 3.4.3) |
| AGT-E-032 | Approval for action `{actionType}` on run `{runId}` was rejected by `{reviewerName}` with reason: `{reason}` | 403 | GOVERNANCE | HITL approval rejected (US-AI-019, US-AI-261) |

---

## 2. Confirmation Codes (AGT-C-xxx)

| Code | Message Template | HTTP Status | Category | Trigger Context |
|------|-----------------|-------------|----------|-----------------|
| AGT-C-001 | Delete agent `{agentName}`? `{conversationCount}` active conversations and `{pipelineCount}` scheduled runs will be affected. 30-day recovery window applies | -- | AGENT_CRUD | DELETE agent with impact assessment (Section 3.11) |
| AGT-C-002 | Permanently delete agent `{agentName}`? This action cannot be undone. All conversations, pipeline history, and training data will be removed | -- | AGENT_CRUD | Hard-delete after 30-day soft-delete window |
| AGT-C-003 | Restore agent `{agentName}` from deleted state? | -- | AGENT_CRUD | POST restore soft-deleted agent |
| AGT-C-004 | Submit agent `{agentName}` for gallery publication review? An admin will review your configuration | -- | GALLERY | Submit agent for admin review (Section 3.12) |
| AGT-C-005 | Unpublish agent `{agentName}` from the Template Gallery? Existing forks will retain their configuration | -- | GALLERY | Unpublish from gallery |
| AGT-C-006 | Start training job for agent `{agentName}` using `{dataSourceCount}` data sources (`{sampleCount}` samples)? Estimated duration: `{estimatedMinutes}` minutes | -- | TRAINING | Manual training trigger (US-AI-201) |
| AGT-C-007 | Roll back agent `{agentName}` model to version `{targetVersion}` (from `{currentVersion}`)? Active conversations will use the rolled-back model | -- | TRAINING | Model version rollback (US-AI-215) |
| AGT-C-008 | Delete knowledge source `{sourceName}`? `{chunkCount}` embedded chunks and `{agentCount}` agent scoping references will be removed | -- | KNOWLEDGE | DELETE knowledge source with cascade (US-AI-232) |
| AGT-C-009 | Approve action `{actionType}` for pipeline run `{runId}`? This will allow the agent to proceed with: `{actionSummary}` | -- | GOVERNANCE | HITL approval confirmation (US-AI-263) |
| AGT-C-010 | Cancel pipeline run `{runId}` (currently at step `{currentStep}`)? This cannot be resumed | -- | PIPELINE | User-initiated run cancellation |
| AGT-C-011 | Archive agent `{agentName}`? It will be hidden from the active list but can be restored | -- | AGENT_CRUD | Archive inactive agent (US-AI-151) |
| AGT-C-012 | Revert agent `{agentName}` to version `{targetVersion}`? Current configuration will be overwritten | -- | VERSIONING | Revert config to previous version (US-AI-062) |

---

## 3. Warning Codes (AGT-W-xxx)

| Code | Message Template | HTTP Status | Category | Trigger Context |
|------|-----------------|-------------|----------|-----------------|
| AGT-W-001 | Agent `{agentName}` modified by `{modifiedBy}` at `{modifiedAt}`. Your unsaved changes may conflict. Reload recommended | -- | AGENT_CRUD | Concurrent modification (optimistic lock conflict) |
| AGT-W-002 | Token usage for tenant `{tenantId}` has reached `{usagePercent}`% of monthly budget (`{usedTokens}` / `{budgetTokens}`) | -- | ANALYTICS | Token budget approaching limit (US-AI-141) |
| AGT-W-003 | Skill `{skillName}` version `{version}` is deprecated. Upgrade to `{latestVersion}` recommended | -- | SKILLS | Agent uses deprecated skill version (US-AI-067) |
| AGT-W-004 | Agent `{agentName}` confidence score `{score}`% is below threshold `{threshold}`%. Response may be unreliable | -- | CHAT | Low confidence on agent response (active learning trigger, US-AI-118) |
| AGT-W-005 | Training data budget for tenant `{tenantId}` is `{usagePercent}`% consumed. `{remainingGpu}` GPU-minutes remaining | -- | TRAINING | Training cost approaching budget (US-AI-217) |
| AGT-W-006 | Knowledge source `{sourceName}` has not been refreshed in `{daysSince}` days (threshold: `{threshold}`). Content may be stale | -- | KNOWLEDGE | Stale knowledge source detection (US-AI-235) |
| AGT-W-007 | Duplicate agent detected: `{agentName}` has `{similarityPercent}`% configuration overlap with `{existingAgent}` | -- | AGENT_CRUD | Similar/duplicate agent detection (US-AI-154) |
| AGT-W-008 | Agent `{agentName}` demoted from `{previousLevel}` to `{newLevel}` due to: `{demotionReason}` | -- | GOVERNANCE | ATS maturity demotion (Section 2.3, immediate on critical violation) |
| AGT-W-009 | Pipeline run `{runId}` has been in `AWAITING_APPROVAL` state for `{hoursWaiting}` hours. SLA: `{slaHours}` hours | -- | GOVERNANCE | HITL approval SLA approaching (US-AI-267) |
| AGT-W-010 | Agent `{agentName}` error rate `{errorRate}`% exceeds threshold `{threshold}`% over last `{windowHours}` hours | -- | ANALYTICS | Anomaly detection alert (US-AI-294) |

---

## 4. Success Codes (AGT-S-xxx)

### 4.1 Agent Lifecycle

| Code | Message Template | HTTP Status | Category | Trigger Context |
|------|-----------------|-------------|----------|-----------------|
| AGT-S-001 | Agent `{agentName}` created successfully | -- | AGENT_CRUD | POST create agent (US-AI-058) |
| AGT-S-002 | Agent `{agentName}` updated successfully | -- | AGENT_CRUD | PUT update agent configuration |
| AGT-S-003 | Agent `{agentName}` deleted successfully. Recovery available until `{expiryDate}` | -- | AGENT_CRUD | DELETE agent (soft-delete) |
| AGT-S-004 | Agent `{agentName}` restored successfully | -- | AGENT_CRUD | POST restore from soft-delete |
| AGT-S-005 | Agent `{agentName}` cloned as `{cloneName}` | -- | AGENT_CRUD | POST clone agent (US-AI-064) |
| AGT-S-006 | Agent `{agentName}` archived successfully | -- | AGENT_CRUD | POST archive (US-AI-151) |
| AGT-S-007 | Agent configuration exported as `{fileName}` (`{format}`) | -- | AGENT_IMPORT_EXPORT | GET export (US-AI-061) |
| AGT-S-008 | Agent `{agentName}` imported successfully from `{fileName}` | -- | AGENT_IMPORT_EXPORT | POST import (US-AI-061) |

### 4.2 Gallery and Publishing

| Code | Message Template | HTTP Status | Category | Trigger Context |
|------|-----------------|-------------|----------|-----------------|
| AGT-S-009 | Agent `{agentName}` submitted for gallery review | -- | GALLERY | Submit to gallery (Section 3.12) |
| AGT-S-010 | Agent `{agentName}` published to Template Gallery | -- | GALLERY | Admin approves publication |

### 4.3 Skills and Tools

| Code | Message Template | HTTP Status | Category | Trigger Context |
|------|-----------------|-------------|----------|-----------------|
| AGT-S-011 | Skill `{skillName}` (v`{version}`) added to agent `{agentName}` | -- | SKILLS | Drag-and-drop skill to builder (US-AI-069) |
| AGT-S-012 | Tool `{toolName}` registered successfully in tenant `{tenantId}` | -- | TOOLS | POST register tool via API (US-AI-072) |

### 4.4 Training and Knowledge

| Code | Message Template | HTTP Status | Category | Trigger Context |
|------|-----------------|-------------|----------|-----------------|
| AGT-S-013 | Training job `{jobId}` completed for agent `{agentName}`. Quality score: `{qualityScore}`% | -- | TRAINING | Training pipeline completes with quality gate pass (US-AI-205) |
| AGT-S-014 | Model rolled back to version `{targetVersion}` for agent `{agentName}` | -- | TRAINING | Model version rollback (US-AI-215) |
| AGT-S-015 | Knowledge source `{sourceName}` ingested: `{chunkCount}` chunks, `{vectorCount}` vectors created | -- | KNOWLEDGE | Document upload and embedding (US-AI-220, US-AI-225) |

### 4.5 Governance

| Code | Message Template | HTTP Status | Category | Trigger Context |
|------|-----------------|-------------|----------|-----------------|
| AGT-S-016 | Agent `{agentName}` promoted from `{previousLevel}` to `{newLevel}`. ATS score: `{atsScore}` | -- | GOVERNANCE | ATS maturity promotion (Section 2.3) |

---

## 5. Business Rules for ADR-031 Zero Hardcoded Text Compliance

| Rule ID | Rule Description | Applies To | Priority |
|---------|-----------------|------------|----------|
| BR-AGT-001 | All user-facing error, confirmation, warning, and success messages in the AI Agent Platform frontend and backend MUST be resolved from the `message_codes` table using the AGT-prefixed codes defined in this registry. No hardcoded strings in source code | All R05 components (frontend + backend) | Must Have |
| BR-AGT-002 | Parameterized placeholders in message templates (e.g., `{agentName}`, `{tenantId}`) MUST be resolved at runtime by the Message Registry service. The frontend MUST NOT perform string concatenation for user-facing messages | Frontend + API responses | Must Have |
| BR-AGT-003 | Every API error response from the `ai-service` MUST include a `messageCode` field (e.g., `AGT-E-001`) and a `messageParams` map. The frontend resolves the display text from the message registry, enabling i18n without code changes | Backend API contract | Must Have |
| BR-AGT-004 | Confirmation dialogs triggered by destructive or impactful actions (delete agent, rollback model, cancel pipeline, delete knowledge source, approve/reject HITL action) MUST display the corresponding AGT-C-xxx message from the registry. The user MUST explicitly confirm before the action executes | Frontend UX | Must Have |
| BR-AGT-005 | When a new message code is needed during R05 development, it MUST be added to this registry document FIRST (with BA sign-off), then seeded into the `message_codes` table via migration script. No ad-hoc codes may be introduced outside this registry | Development workflow | Must Have |

---

## 6. Code Allocation Reserves

The following ranges are reserved for future expansion:

| Range | Reserved For |
|-------|-------------|
| AGT-E-033 to AGT-E-050 | Super Agent / Orchestration errors (Phase 6+) |
| AGT-E-051 to AGT-E-070 | Benchmarking / Eval Harness errors (US-AI-320 to US-AI-334) |
| AGT-E-071 to AGT-E-099 | Future feature areas |
| AGT-C-013 to AGT-C-020 | Super Agent approval workflows |
| AGT-W-011 to AGT-W-020 | Super Agent / ATS warnings |
| AGT-S-017 to AGT-S-030 | Super Agent / Orchestration success codes |

---

## 7. Traceability

### Feature Area to Code Mapping

| Feature Area | Error Codes | Confirmation Codes | Warning Codes | Success Codes |
|-------------|-------------|-------------------|---------------|---------------|
| Agent CRUD | AGT-E-001 to AGT-E-008 | AGT-C-001 to AGT-C-003, AGT-C-011, AGT-C-012 | AGT-W-001, AGT-W-007 | AGT-S-001 to AGT-S-008 |
| Skills | AGT-E-009 to AGT-E-012 | -- | AGT-W-003 | AGT-S-011 |
| Tools | AGT-E-013 to AGT-E-016 | -- | -- | AGT-S-012 |
| Pipeline / Execution | AGT-E-017 to AGT-E-021 | AGT-C-010 | AGT-W-009 | -- |
| Training | AGT-E-022 to AGT-E-024 | AGT-C-006, AGT-C-007 | AGT-W-005 | AGT-S-013, AGT-S-014 |
| Knowledge / RAG | AGT-E-025, AGT-E-026 | AGT-C-008 | AGT-W-006 | AGT-S-015 |
| Chat / Conversation | AGT-E-027 to AGT-E-029 | -- | AGT-W-004 | -- |
| Security | AGT-E-030, AGT-E-031 | -- | -- | -- |
| Governance / HITL | AGT-E-032 | AGT-C-009 | AGT-W-008, AGT-W-009 | AGT-S-016 |
| Gallery / Publishing | -- | AGT-C-004, AGT-C-005 | -- | AGT-S-009, AGT-S-010 |
| Analytics | -- | -- | AGT-W-002, AGT-W-010 | -- |

---

**Document prepared by:** BA Agent
**Total codes defined:** 70 (32 errors + 12 confirmations + 10 warnings + 16 success)
**Business rules defined:** 5 (BR-AGT-001 to BR-AGT-005)
**R04 format alignment:** Follows `{SERVICE}-{TYPE}-{SEQ}` convention from R04 PRD Section 5.10
