# Brainstormed System Role Management Capability Areas

**Track:** R09 Roles Management
**Status:** Draft
**Date:** 2026-03-17
**Purpose:** Capture brainstormed capability areas for system role management without treating them as approved requested scope.

---

## 1. Scope Statement

R09 is a roles-management track under exploration.

This document does **not** define approved requested features. It records a brainstormed capability set only. It also does **not** assume a final implementation pattern yet for:

- JWT authority source
- Neo4j graph changes
- seat-to-role mapping design
- licensing synchronization mechanics
- Keycloak or other identity-provider synchronization

Those implementation decisions must follow the eventual agreed scope and the as-is evidence baseline.

---

## 2. Brainstormed Capability Areas

The following capability areas were discussed during brainstorming. They are **not yet approved as requested features** for R09:

1. view seeded and custom system roles
2. create custom system roles
3. edit custom system roles
4. delete custom system roles
5. configure inheritance between system roles
6. configure how tenant tiers map to system roles
7. preview effective access from inheritance
8. audit changes to system-role configuration

---

## 3. Capability Meanings

### 3.1 View Seeded and Custom System Roles

The platform must show:

- seeded system roles that are part of the platform baseline
- custom system roles created for tenant-level use
- clear distinction between immutable seeded roles and mutable custom roles

### 3.2 Create Custom System Roles

Authorized administrators must be able to create a new custom system role with:

- runtime key / name
- display name
- description
- inheritance configuration

### 3.3 Edit Custom System Roles

Authorized administrators must be able to update mutable properties of custom system roles, including:

- display name
- description
- inheritance definition
- tier mapping impact where applicable

### 3.4 Delete Custom System Roles

Authorized administrators must be able to delete custom system roles safely, with:

- dependency checks
- impact warning
- protection for seeded roles

### 3.5 Configure Inheritance Between System Roles

The platform must support configuring role inheritance so that:

- custom system roles can inherit from approved parent system roles
- effective access is resolved transitively
- invalid inheritance structures are blocked

### 3.6 Configure How Tenant Tiers Map to System Roles

The platform must support tenant-level configuration of how tenant capability tiers map to system roles.

This feature is about **tier-to-system-role configuration**, not user invitation, seat allocation, or seat assignment workflows.

### 3.7 Preview Effective Access from Inheritance

Before saving or changing a role definition, the platform must show the effective access outcome of inheritance so administrators can understand:

- which inherited system roles become effective
- whether the resulting access expands or contracts
- what changes for affected tier mappings

### 3.8 Audit Changes to System-Role Configuration

The platform must record and expose an audit trail for:

- role creation
- role update
- role deletion
- inheritance changes
- tier-to-role mapping changes

---

## 4. Explicitly Out of Scope for This Brainstorm Record

This brainstorm record does not by itself define:

- user invitation flows
- seat allocation workflows
- tenant registry management
- tenant configuration outside role management
- object-definition roles
- object-instance roles

Those may interact with R09, but they are not established by this document.

---

## 5. Rule for Follow-On Design

Any implementation plan, LLD, or UX journey written for R09 must preserve this order:

1. approved scope
2. current-state evidence
3. canonical role and tier model decision
4. implementation design

Implementation proposals must not treat these brainstormed items as approved scope without an explicit decision record.
