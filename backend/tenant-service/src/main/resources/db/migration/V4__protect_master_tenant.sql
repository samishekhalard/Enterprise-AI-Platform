-- ============================================================================
-- EMS Tenant Service - Master Tenant Protection
-- Version: 4
-- Description: Enforce master tenant immutability and protection rules
-- ============================================================================

-- ============================================================================
-- 1. ADD IS_PROTECTED COLUMN
-- ============================================================================

-- Add is_protected column to tenants table
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS is_protected BOOLEAN NOT NULL DEFAULT FALSE;

-- ============================================================================
-- 2. UPDATE MASTER TENANT IDENTITY
-- ============================================================================

-- Update master tenant to standardized naming and set protection
UPDATE tenants SET
    full_name = 'Master Tenant',
    short_name = 'master',
    slug = 'master',
    description = 'System master tenant - controls the entire EMS platform',
    keycloak_realm = 'master',
    is_protected = TRUE,
    updated_at = NOW()
WHERE id = 'tenant-master';

-- ============================================================================
-- 3. CREATE PROTECTED TENANT FUNCTIONS
-- ============================================================================

-- Function to prevent protected tenant status changes
CREATE OR REPLACE FUNCTION protect_tenant_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if this tenant is protected
    IF OLD.is_protected = TRUE THEN
        -- Prevent status changes from ACTIVE
        IF NEW.status != 'ACTIVE' THEN
            RAISE EXCEPTION 'Cannot change protected tenant status. Protected tenants must remain ACTIVE.';
        END IF;

        -- Prevent is_protected flag from being cleared
        IF NEW.is_protected = FALSE THEN
            RAISE EXCEPTION 'Cannot remove protection from a protected tenant.';
        END IF;

        -- Prevent tenant_type changes
        IF NEW.tenant_type != OLD.tenant_type THEN
            RAISE EXCEPTION 'Cannot change protected tenant type. This is a system-protected field.';
        END IF;

        -- Prevent name changes for protected tenants
        IF NEW.full_name != OLD.full_name THEN
            RAISE EXCEPTION 'Cannot change protected tenant name. Protected tenant identity is immutable.';
        END IF;

        IF NEW.short_name != OLD.short_name THEN
            RAISE EXCEPTION 'Cannot change protected tenant short name. Protected tenant identity is immutable.';
        END IF;

        IF NEW.slug != OLD.slug THEN
            RAISE EXCEPTION 'Cannot change protected tenant slug. Protected tenant identity is immutable.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to prevent protected tenant deletion
CREATE OR REPLACE FUNCTION prevent_protected_tenant_deletion()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.is_protected = TRUE THEN
        RAISE EXCEPTION 'Cannot delete protected tenant. Protected tenants are required for system operation.';
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 4. CREATE TRIGGERS
-- ============================================================================

-- Drop triggers if they exist (for idempotency)
DROP TRIGGER IF EXISTS trg_protect_master_tenant_status ON tenants;
DROP TRIGGER IF EXISTS trg_prevent_master_tenant_deletion ON tenants;
DROP TRIGGER IF EXISTS trg_protect_tenant_status ON tenants;
DROP TRIGGER IF EXISTS trg_prevent_protected_tenant_deletion ON tenants;

-- Trigger to protect tenants on UPDATE
CREATE TRIGGER trg_protect_tenant_status
    BEFORE UPDATE ON tenants
    FOR EACH ROW
    EXECUTE FUNCTION protect_tenant_status();

-- Trigger to prevent protected tenant deletion
CREATE TRIGGER trg_prevent_protected_tenant_deletion
    BEFORE DELETE ON tenants
    FOR EACH ROW
    EXECUTE FUNCTION prevent_protected_tenant_deletion();

-- ============================================================================
-- 5. ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON COLUMN tenants.is_protected IS
    'When TRUE, tenant cannot be locked, suspended, deleted, or have identity fields modified';

COMMENT ON FUNCTION protect_tenant_status() IS
    'Prevents status, type, and identity changes for protected tenants. Protected tenants must always remain ACTIVE.';

COMMENT ON FUNCTION prevent_protected_tenant_deletion() IS
    'Prevents deletion of protected tenants. Protected tenants are required for system operation.';

COMMENT ON TRIGGER trg_protect_tenant_status ON tenants IS
    'Protects tenants with is_protected=TRUE from status and identity changes';

COMMENT ON TRIGGER trg_prevent_protected_tenant_deletion ON tenants IS
    'Prevents protected tenants from being deleted';

-- ============================================================================
-- 6. VERIFY MASTER TENANT STATE
-- ============================================================================

-- Ensure master tenant exists and is protected
DO $$
DECLARE
    master_count INTEGER;
    protected_master INTEGER;
BEGIN
    SELECT COUNT(*) INTO master_count FROM tenants WHERE tenant_type = 'MASTER';

    IF master_count = 0 THEN
        RAISE EXCEPTION 'No master tenant found. System requires a master tenant.';
    END IF;

    IF master_count > 1 THEN
        RAISE EXCEPTION 'Multiple master tenants found. System allows only one master tenant.';
    END IF;

    SELECT COUNT(*) INTO protected_master FROM tenants WHERE tenant_type = 'MASTER' AND is_protected = TRUE;

    IF protected_master = 0 THEN
        RAISE EXCEPTION 'Master tenant is not protected. This is a critical security requirement.';
    END IF;

    RAISE NOTICE 'Tenant protection migration applied successfully.';
END $$;
