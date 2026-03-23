-- V3__drop_saas_licensing_tables.sql
-- Description: Drop legacy SaaS licensing tables replaced by on-premise cryptographic model (ADR-015)
-- Author: DBA Agent
-- Date: 2026-02-27
-- Reason: EMSIST reclassified from cloud SaaS to on-premise enterprise. The SaaS tables
--         (license_products, license_features, tenant_licenses, user_license_assignments)
--         with monthly/annual pricing, billing cycles, and auto-renew are incompatible with
--         the new Ed25519-signed license file model. See ADR-015 for full rationale.
-- Source: docs/adr/ADR-015-on-premise-license-architecture.md

-- Drop in reverse dependency order to respect foreign key constraints
DROP TABLE IF EXISTS user_license_assignments CASCADE;
DROP TABLE IF EXISTS license_features CASCADE;
DROP TABLE IF EXISTS tenant_licenses CASCADE;
DROP TABLE IF EXISTS license_products CASCADE;
