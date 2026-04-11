-- ============================================================================
-- Seed official UAE palette packs for Brand Studio and rename the current
-- default house palette to a tenant-facing name.
-- Source: https://designsystem.gov.ae/guidelines/colour-system
-- ============================================================================

UPDATE platform_palette_pack
SET
    name = 'Terra',
    description = 'Current live Terra house palette and default tenant baseline.'
WHERE palette_pack_id = 'palette-thinkplus-default';

INSERT INTO platform_palette_pack (
    palette_pack_id,
    name,
    description,
    primary_color,
    secondary_color,
    accent_color,
    surface_color,
    surface_raised_color,
    text_color,
    text_muted_color,
    border_color,
    success_color,
    warning_color,
    error_color,
    info_color,
    is_default,
    status
)
SELECT
    'palette-uae-gold',
    'Gold',
    'Official UAE core palette adapted into the semantic brand pack using AEGold 600.',
    '#92722A',
    '#CBA344',
    '#6C4527',
    '#F2EFE9',
    '#FAF8F4',
    '#3d3a3b',
    '#7A7672',
    '#E0DDDA',
    '#428177',
    '#988561',
    '#ef4444',
    '#054239',
    FALSE,
    'ACTIVE'
WHERE NOT EXISTS (
    SELECT 1 FROM platform_palette_pack WHERE palette_pack_id = 'palette-uae-gold'
);

INSERT INTO platform_palette_pack (
    palette_pack_id,
    name,
    description,
    primary_color,
    secondary_color,
    accent_color,
    surface_color,
    surface_raised_color,
    text_color,
    text_muted_color,
    border_color,
    success_color,
    warning_color,
    error_color,
    info_color,
    is_default,
    status
)
SELECT
    'palette-uae-red',
    'Red',
    'Official UAE core palette adapted into the semantic brand pack using AERed 600.',
    '#D83731',
    '#F47A75',
    '#95231F',
    '#F2EFE9',
    '#FAF8F4',
    '#3d3a3b',
    '#7A7672',
    '#E0DDDA',
    '#428177',
    '#988561',
    '#ef4444',
    '#054239',
    FALSE,
    'ACTIVE'
WHERE NOT EXISTS (
    SELECT 1 FROM platform_palette_pack WHERE palette_pack_id = 'palette-uae-red'
);

INSERT INTO platform_palette_pack (
    palette_pack_id,
    name,
    description,
    primary_color,
    secondary_color,
    accent_color,
    surface_color,
    surface_raised_color,
    text_color,
    text_muted_color,
    border_color,
    success_color,
    warning_color,
    error_color,
    info_color,
    is_default,
    status
)
SELECT
    'palette-uae-green',
    'Green',
    'Official UAE core palette adapted into the semantic brand pack using AEGreen 600.',
    '#3F8E50',
    '#6FB97F',
    '#2A5133',
    '#F2EFE9',
    '#FAF8F4',
    '#3d3a3b',
    '#7A7672',
    '#E0DDDA',
    '#428177',
    '#988561',
    '#ef4444',
    '#054239',
    FALSE,
    'ACTIVE'
WHERE NOT EXISTS (
    SELECT 1 FROM platform_palette_pack WHERE palette_pack_id = 'palette-uae-green'
);

INSERT INTO platform_palette_pack (
    palette_pack_id,
    name,
    description,
    primary_color,
    secondary_color,
    accent_color,
    surface_color,
    surface_raised_color,
    text_color,
    text_muted_color,
    border_color,
    success_color,
    warning_color,
    error_color,
    info_color,
    is_default,
    status
)
SELECT
    'palette-uae-black',
    'Black',
    'Official UAE core palette adapted into the semantic brand pack using AEBlack 600.',
    '#4B4F58',
    '#797E86',
    '#232528',
    '#F2EFE9',
    '#FAF8F4',
    '#3d3a3b',
    '#7A7672',
    '#E0DDDA',
    '#428177',
    '#988561',
    '#ef4444',
    '#054239',
    FALSE,
    'ACTIVE'
WHERE NOT EXISTS (
    SELECT 1 FROM platform_palette_pack WHERE palette_pack_id = 'palette-uae-black'
);
