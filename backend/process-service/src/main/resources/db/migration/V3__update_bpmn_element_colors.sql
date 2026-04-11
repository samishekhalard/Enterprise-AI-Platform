-- =====================================================
-- V3__update_bpmn_element_colors.sql
-- Update BPMN Element Types with ThinkPLUS color scheme
-- =====================================================
-- Updated color scheme:
--   Start Events:        #52B415 (green)    fill: #E8F5E9 (unchanged)
--   End Events:          #C02520 (red)      fill: #FFEBEE (unchanged)
--   Intermediate Events: #F97316 (orange)   fill: #FFF7ED (was gray)
--   Boundary Events:     #8B5CF6 (purple)   fill: #F5F3FF (was gray)
--   Tasks:               #047481 (teal)     fill: #FFFFFF (was blue)
--   Gateways:            #b9a779 (gold)     fill: #FFF8E1 (was orange)
-- =====================================================

-- Update Intermediate Events to Orange
UPDATE bpmn_element_types
SET stroke_color = '#F97316', fill_color = '#FFF7ED', updated_at = CURRENT_TIMESTAMP
WHERE tenant_id IS NULL
  AND category = 'event'
  AND sub_category = 'intermediate';

-- Update Boundary Events to Purple
UPDATE bpmn_element_types
SET stroke_color = '#8B5CF6', fill_color = '#F5F3FF', updated_at = CURRENT_TIMESTAMP
WHERE tenant_id IS NULL
  AND category = 'event'
  AND sub_category = 'boundary';

-- Update Tasks to Teal
UPDATE bpmn_element_types
SET stroke_color = '#047481', updated_at = CURRENT_TIMESTAMP
WHERE tenant_id IS NULL
  AND category = 'task';

-- Update Gateways to Gold
UPDATE bpmn_element_types
SET stroke_color = '#b9a779', updated_at = CURRENT_TIMESTAMP
WHERE tenant_id IS NULL
  AND category = 'gateway';

-- Log success
DO $$
BEGIN
    RAISE NOTICE 'BPMN Element Types colors updated successfully.';
    RAISE NOTICE '  Intermediate Events: %', (SELECT COUNT(*) FROM bpmn_element_types WHERE tenant_id IS NULL AND sub_category = 'intermediate' AND stroke_color = '#F97316');
    RAISE NOTICE '  Boundary Events: %', (SELECT COUNT(*) FROM bpmn_element_types WHERE tenant_id IS NULL AND sub_category = 'boundary' AND stroke_color = '#8B5CF6');
    RAISE NOTICE '  Tasks: %', (SELECT COUNT(*) FROM bpmn_element_types WHERE tenant_id IS NULL AND category = 'task' AND stroke_color = '#047481');
    RAISE NOTICE '  Gateways: %', (SELECT COUNT(*) FROM bpmn_element_types WHERE tenant_id IS NULL AND category = 'gateway' AND stroke_color = '#b9a779');
END $$;
