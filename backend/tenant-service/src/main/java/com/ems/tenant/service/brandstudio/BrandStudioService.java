package com.ems.tenant.service.brandstudio;

import com.ems.tenant.service.branding.BrandingValidationResult;

import java.util.List;
import java.util.Map;

public interface BrandStudioService {

    Map<String, Object> getLegacyBranding(String tenantId);

    Map<String, Object> saveLegacyBranding(String tenantId, Map<String, Object> request, String actorId);

    BrandingValidationResult validateLegacyBranding(String tenantId, Map<String, Object> request);

    Map<String, Object> getActiveBrand(String tenantId);

    Map<String, Object> getDraft(String tenantId);

    Map<String, Object> saveDraft(
            String tenantId,
            String selectedStarterKitId,
            String selectedPalettePackId,
            String selectedTypographyPackId,
            String selectedIconLibraryId,
            Map<String, Object> manifestOverrides,
            String actorId
    );

    BrandingValidationResult validateDraft(String tenantId);

    List<Map<String, Object>> getHistory(String tenantId);

    Map<String, Object> publishDraft(String tenantId, String actorId);

    Map<String, Object> rollback(String tenantId, String targetBrandProfileId, String actorId);

    List<Map<String, Object>> listStarterKits();

    List<Map<String, Object>> listPalettePacks();

    List<Map<String, Object>> listTypographyPacks();

    List<Map<String, Object>> listAssets(String tenantId);

    List<Map<String, Object>> listIconLibraries(String tenantId);
}
