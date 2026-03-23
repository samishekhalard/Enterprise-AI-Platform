-- =====================================================
-- V1__create_bpmn_element_types.sql
-- BPMN Element Types - Single source of truth for BPMN element definitions
-- =====================================================

CREATE TABLE IF NOT EXISTS bpmn_element_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Tenant support (null = system default)
    tenant_id VARCHAR(50),

    -- Element identification
    code VARCHAR(100) NOT NULL,
    name VARCHAR(100) NOT NULL,

    -- Categorization
    category VARCHAR(50) NOT NULL,
    sub_category VARCHAR(50),

    -- Visual styling
    stroke_color VARCHAR(7) NOT NULL DEFAULT '#585858',
    fill_color VARCHAR(7) NOT NULL DEFAULT '#FFFFFF',
    stroke_width NUMERIC(4,2) NOT NULL DEFAULT 2.0,

    -- Default dimensions (null = use bpmn-js defaults)
    default_width INTEGER,
    default_height INTEGER,

    -- Icon SVG (optional, for palette display)
    icon_svg TEXT,

    -- Display ordering
    sort_order INTEGER DEFAULT 0,

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Ensure unique code per tenant (or null for system)
    CONSTRAINT uk_bpmn_element_types_tenant_code UNIQUE (tenant_id, code)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_bpmn_element_types_tenant ON bpmn_element_types(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bpmn_element_types_category ON bpmn_element_types(category);
CREATE INDEX IF NOT EXISTS idx_bpmn_element_types_active ON bpmn_element_types(is_active) WHERE is_active = true;

-- Comments
COMMENT ON TABLE bpmn_element_types IS 'BPMN element type definitions - single source of truth for colors, sizes, and styling';
COMMENT ON COLUMN bpmn_element_types.tenant_id IS 'Tenant ID for tenant-specific overrides, NULL for system defaults';
COMMENT ON COLUMN bpmn_element_types.code IS 'BPMN element type code, e.g., bpmn:Task, bpmn:StartEvent';
COMMENT ON COLUMN bpmn_element_types.category IS 'Element category: task, event, gateway, data, artifact, flow';
COMMENT ON COLUMN bpmn_element_types.stroke_color IS 'Stroke/border color in hex format (e.g., #1E88E5)';
COMMENT ON COLUMN bpmn_element_types.fill_color IS 'Fill/background color in hex format (e.g., #FFFFFF)';
COMMENT ON COLUMN bpmn_element_types.icon_svg IS 'SVG content for palette icon display';
