# G01. Business Architecture

## Purpose

This folder is the active business-requirements baseline for the current tenant-management scope.

The artifacts here are organized by business context:

- `G01.01 Access to System Services`
- `G01.02 Settings Shell`
- `G01.03 Tenant Fact Sheet`

## Modeling Rule

Screen-level artifacts that have been migrated to the `G02.01 System Graphs` baseline use this business-to-structure modeling chain:

- `persona`
- `journey`
- `journey step`
- `screen`
- `section`
- `element`
- `validation rule set`
- `validation rule`

Definitions:

- `journey step` = the ordered workflow step that activates a screen and the starting structural region for that step
- `screen` = the top structural host context and validation-rule-set scope
- `section` = the structural grouping object inside a screen or another section
- `element` = the terminal visible or interactive object and must always remain a leaf
- `validation rule set` = the screen-scoped rule-set definition for runtime UI behavior
- `validation rule` = the declarative rule that targets a screen, section, or element

Migration note:

- `G01.01.01 Login Scenarios` currently uses this normalized chain
- other active `G01` artifacts that have not yet been migrated still use the legacy `persona -> journey -> touchpoint -> variant` baseline until their structure is rewritten

Element authoring rules:

- where applicable, document the element against PrimeNG as the source component baseline
- style and token references must align to:
  - `frontend/src/styles.scss`
  - `frontend/src/app/core/theme/default-preset.scss`
  - `Documentation/design-system/technical/primeng-token-integration.md`
- if an element is not PrimeNG-backed, mark it as `Custom`

## Graph Baseline

The system graph baseline for this package now lives under:

- `../G02. Data architecture/G02.01. System Graphs/00-System-Graph-Model.md`

## Downstream Data Architecture Alignment

- `G01.01 Access to System Services` is supported by:
  - `../G02. Data architecture/G02.03 Access and System Shell Support.md`
- `G01.02 Tenant Registry` is supported by:
  - `../G02. Data architecture/G02.02 Tenant registry database/Tenant Registry Database.md`
- `G01.02 Master License Management` is supported by:
  - `../G02. Data architecture/G02.04 Master License Management Database.md`
- `G01.03 Tenant Fact Sheet` is supported by:
  - `../G02. Data architecture/Tenant Manager Database/Tenant Manager PostgreSQL Database.md`
  - `../G02. Data architecture/Tenant Manager Database/Tenant Manager Neo4j Database.md`

For `G01.03`, the tenant-specific data scope includes:

- tenant users
- integrations register
- dictionary
- messages
- branding
- agents
- studio and master definitions
- audit
- health
- tenant-specific PostgreSQL data
- tenant definition graph
- tenant instance graph

## Folder Structure

### `G01.01 Access to System Services`

- `G01.01.01 Login Scenarios`
- `G01.01.02 System Shell`

### `G01.02 Settings Shell`

- `G01.02.01 Tenant Registry`
  - `G01.02.01.01 View Tenant List`
  - `G01.02.01.02 Create Tenant`
- `G01.02.02 Master License Management`
  - `G01.02.02.01 Manage Master License Management`

### `G01.03 Tenant Fact Sheet`

- `G01.03.01 View Tenant Fact Sheet`
- `G01.03.02 Manage Tenant Users`
- `G01.03.03 Manage Tenant Branding`
- `G01.03.04 Manage Tenant Integrations`
- `G01.03.05 Manage Tenant Dictionary` includes message translation management
- `G01.03.06 Manage Tenant Agents`
- `G01.03.07 View Tenant Audit Log`
- `G01.03.08 View Tenant Health Checks`
- `G01.03.09 Manage Tenant Master Definitions`
- `G01.03.10 Manage Tenant Landing Page`

## Source of Truth

- Active normalized business requirements live in this `G01` package.
- Upstream, historical, cross-cutting, and dependency material lives under:
  - `Documentation/.Requirements/.references/`

## Notes

- Detailed downstream artifacts such as data models, stories, business rules, validation rules, and prototypes may still be under development.
- Until those are sealed, `.references` remains a valid support area but not the active business-baseline source of truth.
