package com.ems.tenant.service.brandstudio;

import com.ems.common.exception.ResourceNotFoundException;
import com.ems.common.exception.TenantNotFoundException;
import com.ems.tenant.entity.BrandAssetEntity;
import com.ems.tenant.entity.BrandAssetKind;
import com.ems.tenant.entity.BrandAuditEventEntity;
import com.ems.tenant.entity.BrandAuditEventType;
import com.ems.tenant.entity.BrandCatalogStatus;
import com.ems.tenant.entity.BrandDraftEntity;
import com.ems.tenant.entity.BrandProfileEntity;
import com.ems.tenant.entity.BrandStarterKitEntity;
import com.ems.tenant.entity.IconLibraryEntity;
import com.ems.tenant.entity.PalettePackEntity;
import com.ems.tenant.entity.TenantBrandingEntity;
import com.ems.tenant.entity.TenantEntity;
import com.ems.tenant.entity.TypographyPackEntity;
import com.ems.tenant.repository.BrandAssetRepository;
import com.ems.tenant.repository.BrandAuditEventRepository;
import com.ems.tenant.repository.BrandDraftRepository;
import com.ems.tenant.repository.BrandProfileRepository;
import com.ems.tenant.repository.BrandStarterKitRepository;
import com.ems.tenant.repository.IconLibraryRepository;
import com.ems.tenant.repository.PalettePackRepository;
import com.ems.tenant.repository.TenantRepository;
import com.ems.tenant.repository.TypographyPackRepository;
import com.ems.tenant.service.branding.BrandingPolicyEnforcer;
import com.ems.tenant.service.branding.BrandingValidationResult;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class BrandStudioServiceImpl implements BrandStudioService {

    private static final String DEFAULT_PRIMARY = "#428177";
    private static final String DEFAULT_PRIMARY_DARK = "#054239";
    private static final String DEFAULT_SECONDARY = "#b9a779";
    private static final String DEFAULT_SURFACE = "#edebe0";
    private static final String DEFAULT_SURFACE_RAISED = "#f2efe9";
    private static final String DEFAULT_TEXT = "#3d3a3b";
    private static final String DEFAULT_TEXT_MUTED = "#7a7672";
    private static final String DEFAULT_BORDER = "#e0ddda";
    private static final String DEFAULT_SUCCESS = "#428177";
    private static final String DEFAULT_WARNING = "#988561";
    private static final String DEFAULT_ERROR = "#ef4444";
    private static final String DEFAULT_INFO = "#054239";
    private static final String DEFAULT_SHADOW_DARK = "#988561";
    private static final String DEFAULT_SHADOW_LIGHT = "#ffffff";
    private static final String DEFAULT_FONT = "'Gotham Rounded', 'Nunito', sans-serif";
    private static final String DEFAULT_MONO = "'SFMono-Regular', 'Consolas', 'Liberation Mono', monospace'";
    private static final String DEFAULT_LOGO = "/assets/images/logo.svg";
    private static final String DEFAULT_FAVICON = "/favicon.ico";

    private final TenantRepository tenantRepository;
    private final BrandDraftRepository brandDraftRepository;
    private final BrandProfileRepository brandProfileRepository;
    private final BrandStarterKitRepository brandStarterKitRepository;
    private final PalettePackRepository palettePackRepository;
    private final TypographyPackRepository typographyPackRepository;
    private final BrandAssetRepository brandAssetRepository;
    private final IconLibraryRepository iconLibraryRepository;
    private final BrandAuditEventRepository brandAuditEventRepository;
    private final BrandingPolicyEnforcer brandingPolicyEnforcer;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getLegacyBranding(String tenantId) {
        TenantEntity tenant = requireTenant(tenantId);
        return buildLegacyBrandingResponse(tenant, getActiveProfileEntity(tenant.getId()).orElse(null));
    }

    @Override
    public Map<String, Object> saveLegacyBranding(String tenantId, Map<String, Object> request, String actorId) {
        TenantEntity tenant = requireTenant(tenantId);
        BrandingValidationResult validation = brandingPolicyEnforcer.validateAndNormalize(request);
        if (!validation.valid()) {
            throw new IllegalArgumentException("Branding policy violations: " + String.join(" | ", validation.violations()));
        }

        BrandDraftEntity draft = getOrCreateDraftEntity(tenant);
        Map<String, Object> draftPayload = parseDraftPayload(draft);
        Map<String, Object> branding = new LinkedHashMap<>(extractBrandingOverrides(draftPayload));
        branding.putAll(validation.normalized());

        draftPayload.put("branding", branding);
        if (branding.containsKey("componentTokens")) {
            draftPayload.put("components", branding.get("componentTokens"));
        }

        persistDraft(draft, draftPayload, actorId, true);
        recordAuditEvent(
                tenant.getId(),
                BrandAuditEventType.DRAFT_SAVED,
                actorId,
                null,
                null,
                null,
                "Legacy branding updated and staged",
                Map.of("source", "legacy-branding-endpoint")
        );

        publishDraft(tenant.getId(), actorId);
        return getLegacyBranding(tenant.getId());
    }

    @Override
    @Transactional(readOnly = true)
    public BrandingValidationResult validateLegacyBranding(String tenantId, Map<String, Object> request) {
        requireTenant(tenantId);
        return brandingPolicyEnforcer.validateAndNormalize(request);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getActiveBrand(String tenantId) {
        TenantEntity tenant = requireTenant(tenantId);
        return buildActiveBrandResponse(tenant, getActiveProfileEntity(tenant.getId()).orElse(null));
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getDraft(String tenantId) {
        TenantEntity tenant = requireTenant(tenantId);
        BrandDraftEntity draft = getOrCreateDraftEntity(tenant);
        Map<String, Object> draftPayload = parseDraftPayload(draft);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("tenantId", tenant.getId());
        response.put("selectedStarterKitId", draft.getSelectedStarterKitId());
        response.put("selectedPalettePackId", draft.getSelectedPalettePackId());
        response.put("selectedTypographyPackId", draft.getSelectedTypographyPackId());
        response.put("selectedIconLibraryId", draft.getSelectedIconLibraryId());
        response.put("manifestOverrides", draftPayload);
        response.put("updatedAt", draft.getUpdatedAt() != null ? draft.getUpdatedAt().toString() : "");
        response.put("updatedBy", safeString(draft.getUpdatedBy()));
        response.put("lastValidatedAt", draft.getLastValidatedAt() != null ? draft.getLastValidatedAt().toString() : "");
        response.put("previewManifest", assembleManifest(tenant, draft, null, currentProfileVersion(tenant.getId())));
        return response;
    }

    @Override
    public Map<String, Object> saveDraft(
            String tenantId,
            String selectedStarterKitId,
            String selectedPalettePackId,
            String selectedTypographyPackId,
            String selectedIconLibraryId,
            Map<String, Object> manifestOverrides,
            String actorId
    ) {
        TenantEntity tenant = requireTenant(tenantId);
        BrandDraftEntity draft = getOrCreateDraftEntity(tenant);
        validateSelections(selectedStarterKitId, selectedPalettePackId, selectedTypographyPackId, selectedIconLibraryId, tenant.getId());
        Map<String, Object> normalizedOverrides = normalizeDraftOverrides(manifestOverrides);
        persistDraft(draft, normalizedOverrides, actorId, false);

        draft.setSelectedStarterKitId(normalizeNullableId(selectedStarterKitId));
        draft.setSelectedPalettePackId(normalizeNullableId(selectedPalettePackId));
        draft.setSelectedTypographyPackId(normalizeNullableId(selectedTypographyPackId));
        draft.setSelectedIconLibraryId(normalizeNullableId(selectedIconLibraryId));
        brandDraftRepository.save(draft);

        recordAuditEvent(
                tenant.getId(),
                BrandAuditEventType.DRAFT_SAVED,
                actorId,
                null,
                null,
                selectedIconLibraryId,
                "Brand draft saved",
                Map.of(
                        "selectedStarterKitId", safeString(draft.getSelectedStarterKitId()),
                        "selectedPalettePackId", safeString(draft.getSelectedPalettePackId()),
                        "selectedTypographyPackId", safeString(draft.getSelectedTypographyPackId()),
                        "selectedIconLibraryId", safeString(draft.getSelectedIconLibraryId())
                )
        );
        return getDraft(tenant.getId());
    }

    @Override
    public BrandingValidationResult validateDraft(String tenantId) {
        TenantEntity tenant = requireTenant(tenantId);
        BrandDraftEntity draft = getOrCreateDraftEntity(tenant);
        Map<String, Object> draftPayload = parseDraftPayload(draft);
        Map<String, Object> branding = extractBrandingOverrides(draftPayload);
        BrandingValidationResult validation = brandingPolicyEnforcer.validateAndNormalize(branding);
        if (validation.valid()) {
            draft.setLastValidatedAt(Instant.now());
            brandDraftRepository.save(draft);
            recordAuditEvent(
                    tenant.getId(),
                    BrandAuditEventType.DRAFT_VALIDATED,
                    draft.getUpdatedBy(),
                    null,
                    null,
                    draft.getSelectedIconLibraryId(),
                    "Brand draft validated",
                    Map.of("tenantId", tenant.getId())
            );
        }

        Map<String, Object> normalized = new LinkedHashMap<>();
        normalized.put("manifest", assembleManifest(tenant, draft, null, currentProfileVersion(tenant.getId())));
        normalized.put("manifestOverrides", draftPayload);
        return new BrandingValidationResult(
                validation.valid(),
                validation.violations(),
                validation.warnings(),
                normalized
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getHistory(String tenantId) {
        requireTenant(tenantId);
        return brandProfileRepository.findByTenantIdOrderByProfileVersionDesc(tenantId).stream()
                .map(this::toHistoryItem)
                .toList();
    }

    @Override
    public Map<String, Object> publishDraft(String tenantId, String actorId) {
        TenantEntity tenant = requireTenant(tenantId);
        BrandDraftEntity draft = getOrCreateDraftEntity(tenant);
        BrandingValidationResult validation = validateDraft(tenantId);
        if (!validation.valid()) {
            throw new IllegalArgumentException("Brand draft validation failed: " + String.join(" | ", validation.violations()));
        }

        int nextVersion = currentProfileVersion(tenant.getId()) + 1;
        BrandProfileEntity profile = BrandProfileEntity.builder()
                .tenantId(tenant.getId())
                .profileVersion(nextVersion)
                .publishedBy(actorId)
                .manifestJson(writeJson(assembleManifest(tenant, draft, null, nextVersion)))
                .build();
        profile = brandProfileRepository.save(profile);

        Map<String, Object> manifest = assembleManifest(tenant, draft, profile.getBrandProfileId(), profile.getProfileVersion());
        profile.setManifestJson(writeJson(manifest));
        profile = brandProfileRepository.save(profile);

        syncLegacyMirror(tenant, manifest);
        recordAuditEvent(
                tenant.getId(),
                BrandAuditEventType.BRAND_PUBLISHED,
                actorId,
                profile.getBrandProfileId(),
                null,
                draft.getSelectedIconLibraryId(),
                "Brand profile published",
                Map.of("profileVersion", profile.getProfileVersion())
        );
        return buildActiveBrandResponse(tenant, profile);
    }

    @Override
    public Map<String, Object> rollback(String tenantId, String targetBrandProfileId, String actorId) {
        TenantEntity tenant = requireTenant(tenantId);
        BrandProfileEntity target = brandProfileRepository.findById(targetBrandProfileId)
                .filter(profile -> tenant.getId().equals(profile.getTenantId()))
                .orElseThrow(() -> new ResourceNotFoundException("Brand profile not found for tenant: " + targetBrandProfileId));

        int nextVersion = currentProfileVersion(tenant.getId()) + 1;
        Map<String, Object> manifest = parseJsonObject(target.getManifestJson());
        manifest.put("brandProfileId", null);
        manifest.put("version", nextVersion);

        BrandProfileEntity rollbackProfile = BrandProfileEntity.builder()
                .tenantId(tenant.getId())
                .profileVersion(nextVersion)
                .publishedBy(actorId)
                .rolledBackFromProfileId(target.getBrandProfileId())
                .manifestJson(writeJson(manifest))
                .build();
        rollbackProfile = brandProfileRepository.save(rollbackProfile);

        manifest.put("brandProfileId", rollbackProfile.getBrandProfileId());
        rollbackProfile.setManifestJson(writeJson(manifest));
        rollbackProfile = brandProfileRepository.save(rollbackProfile);

        syncLegacyMirror(tenant, manifest);
        syncDraftToProfile(tenant, rollbackProfile);
        recordAuditEvent(
                tenant.getId(),
                BrandAuditEventType.BRAND_ROLLED_BACK,
                actorId,
                rollbackProfile.getBrandProfileId(),
                null,
                null,
                "Brand profile rolled back",
                Map.of("rolledBackFromProfileId", target.getBrandProfileId())
        );
        return buildActiveBrandResponse(tenant, rollbackProfile);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> listStarterKits() {
        return brandStarterKitRepository.findByStatusOrderByNameAsc(BrandCatalogStatus.ACTIVE).stream()
                .map(this::toStarterKitSummary)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> listPalettePacks() {
        return palettePackRepository.findByStatusOrderByNameAsc(BrandCatalogStatus.ACTIVE).stream()
                .map(this::toPaletteSummary)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> listTypographyPacks() {
        return typographyPackRepository.findByStatusOrderByNameAsc(BrandCatalogStatus.ACTIVE).stream()
                .map(this::toTypographySummary)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> listAssets(String tenantId) {
        requireTenant(tenantId);
        return brandAssetRepository.findByTenantIdOrderByCreatedAtDesc(tenantId).stream()
                .map(this::toAssetSummary)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> listIconLibraries(String tenantId) {
        requireTenant(tenantId);
        return iconLibraryRepository.findByTenantIdOrderByCreatedAtDesc(tenantId).stream()
                .map(this::toIconLibrarySummary)
                .toList();
    }

    private TenantEntity requireTenant(String tenantIdentifier) {
        if (tenantIdentifier == null || tenantIdentifier.isBlank()) {
            throw new TenantNotFoundException("Tenant identifier is required");
        }
        return tenantRepository.findById(tenantIdentifier)
                .or(() -> tryFindByUuid(tenantIdentifier))
                .orElseThrow(() -> new TenantNotFoundException("Tenant not found: " + tenantIdentifier));
    }

    private Optional<TenantEntity> tryFindByUuid(String tenantIdentifier) {
        try {
            return tenantRepository.findByUuid(UUID.fromString(tenantIdentifier));
        } catch (IllegalArgumentException ignored) {
            return Optional.empty();
        }
    }

    private Optional<BrandProfileEntity> getActiveProfileEntity(String tenantId) {
        return brandProfileRepository.findTopByTenantIdOrderByProfileVersionDesc(tenantId);
    }

    private BrandDraftEntity getOrCreateDraftEntity(TenantEntity tenant) {
        return brandDraftRepository.findById(tenant.getId()).orElseGet(() -> {
            BrandStarterKitEntity defaultStarter = getDefaultStarterKit();
            BrandDraftEntity draft = BrandDraftEntity.builder()
                    .tenantId(tenant.getId())
                    .selectedStarterKitId(defaultStarter.getStarterKitId())
                    .selectedPalettePackId(defaultStarter.getBasePalettePackId())
                    .selectedTypographyPackId(defaultStarter.getBaseTypographyPackId())
                    .draftManifestJson(writeJson(Map.of("branding", buildLegacyBrandingFromTenantBranding(tenant.getBranding()))))
                    .build();
            return brandDraftRepository.save(draft);
        });
    }

    private void validateSelections(
            String starterKitId,
            String palettePackId,
            String typographyPackId,
            String iconLibraryId,
            String tenantId
    ) {
        if (hasText(starterKitId) && brandStarterKitRepository.findById(starterKitId).isEmpty()) {
            throw new ResourceNotFoundException("Starter kit not found: " + starterKitId);
        }
        if (hasText(palettePackId) && palettePackRepository.findById(palettePackId).isEmpty()) {
            throw new ResourceNotFoundException("Palette pack not found: " + palettePackId);
        }
        if (hasText(typographyPackId) && typographyPackRepository.findById(typographyPackId).isEmpty()) {
            throw new ResourceNotFoundException("Typography pack not found: " + typographyPackId);
        }
        if (hasText(iconLibraryId)) {
            IconLibraryEntity iconLibrary = iconLibraryRepository.findById(iconLibraryId)
                    .orElseThrow(() -> new ResourceNotFoundException("Icon library not found: " + iconLibraryId));
            if (!tenantId.equals(iconLibrary.getTenantId())) {
                throw new IllegalArgumentException("Icon library does not belong to tenant");
            }
        }
    }

    private void persistDraft(BrandDraftEntity draft, Map<String, Object> payload, String actorId, boolean touchValidatedAt) {
        draft.setDraftManifestJson(writeJson(payload));
        draft.setUpdatedBy(actorId);
        if (touchValidatedAt) {
            draft.setLastValidatedAt(Instant.now());
        }
        brandDraftRepository.save(draft);
    }

    private Map<String, Object> normalizeDraftOverrides(Map<String, Object> manifestOverrides) {
        Map<String, Object> root = new LinkedHashMap<>();
        Map<String, Object> input = copyMap(manifestOverrides);
        Map<String, Object> brandingCandidate = extractBrandingCandidate(input);

        if (input.get("components") instanceof Map<?, ?> components && !brandingCandidate.containsKey("componentTokens")) {
            brandingCandidate.put("componentTokens", copyMap(components));
        }

        BrandingValidationResult validation = brandingPolicyEnforcer.validateAndNormalize(brandingCandidate);
        if (!validation.valid()) {
            throw new IllegalArgumentException("Brand draft validation failed: " + String.join(" | ", validation.violations()));
        }

        root.put("branding", validation.normalized());
        copyNestedIfMap(input, root, "metadata");
        copyNestedIfMap(input, root, "surfaces");
        copyNestedIfMap(input, root, "assets");
        copyNestedIfMap(input, root, "objectDefinitions");
        if (input.get("components") instanceof Map<?, ?> components) {
            root.put("components", copyMap(components));
        } else if (validation.normalized().get("componentTokens") instanceof Map<?, ?> tokens) {
            root.put("components", copyMap(tokens));
        }
        return root;
    }

    private Map<String, Object> extractBrandingCandidate(Map<String, Object> input) {
        Object branding = input.get("branding");
        if (branding instanceof Map<?, ?> map) {
            return copyMap(map);
        }

        Map<String, Object> flat = new LinkedHashMap<>();
        for (Map.Entry<String, Object> entry : input.entrySet()) {
            String key = entry.getKey();
            if (!List.of("metadata", "surfaces", "assets", "components", "objectDefinitions").contains(key)) {
                flat.put(key, entry.getValue());
            }
        }
        return flat;
    }

    private Map<String, Object> assembleManifest(TenantEntity tenant, BrandDraftEntity draft, String brandProfileId, int version) {
        Map<String, Object> draftPayload = parseDraftPayload(draft);
        Map<String, Object> branding = extractBrandingOverrides(draftPayload);
        Map<String, Object> metadataOverrides = nestedMap(draftPayload, "metadata");
        Map<String, Object> surfacesOverrides = nestedMap(draftPayload, "surfaces");
        Map<String, Object> componentOverrides = nestedMap(draftPayload, "components");

        BrandStarterKitEntity starterKit = resolveStarterKit(draft.getSelectedStarterKitId());
        PalettePackEntity palettePack = resolvePalettePack(draft.getSelectedPalettePackId(), starterKit);
        TypographyPackEntity typographyPack = resolveTypographyPack(draft.getSelectedTypographyPackId(), starterKit);

        Map<BrandAssetKind, BrandAssetEntity> latestAssets = latestAssetsByKind(tenant.getId());
        String logoLightUrl = resolveAssetUrl(BrandAssetKind.LOGO_LIGHT, latestAssets, branding, "logoUrl", DEFAULT_LOGO);
        String logoDarkUrl = resolveAssetUrl(BrandAssetKind.LOGO_DARK, latestAssets, branding, "logoUrlDark", logoLightUrl);
        String faviconUrl = resolveAssetUrl(BrandAssetKind.FAVICON, latestAssets, branding, "faviconUrl", DEFAULT_FAVICON);
        String loginBackgroundUrl = resolveAssetUrl(BrandAssetKind.LOGIN_BACKGROUND, latestAssets, branding, "loginBackgroundUrl", "");

        Map<String, Object> legacy = buildEffectiveLegacyBranding(
                tenant.getBranding(),
                palettePack,
                typographyPack,
                branding,
                logoLightUrl,
                logoDarkUrl,
                faviconUrl,
                loginBackgroundUrl
        );

        Map<String, Object> foundation = new LinkedHashMap<>();
        foundation.put("palette", buildFoundationPalette(legacy, palettePack));
        foundation.put("typography", buildFoundationTypography(legacy, typographyPack));
        foundation.put("motion", buildFoundationMotion(legacy));
        foundation.put("shape", buildFoundationShape(legacy));

        Map<String, Object> components = deepMergeMaps(
                parseJsonObject(starterKit.getBaseComponentRecipeJson()),
                componentOverrides.isEmpty() ? mapFromObject(legacy.get("componentTokens")) : componentOverrides
        );

        Map<String, Object> loginSurface = new LinkedHashMap<>();
        loginSurface.put("logoUrl", logoLightUrl);
        loginSurface.put("logoDarkUrl", logoDarkUrl);
        loginSurface.put("backgroundUrl", loginBackgroundUrl);

        Map<String, Object> shellSurface = new LinkedHashMap<>();
        shellSurface.put("logoUrl", logoLightUrl);
        shellSurface.put("logoDarkUrl", logoDarkUrl);

        Map<String, Object> splashSurface = new LinkedHashMap<>();
        splashSurface.put("logoUrl", logoLightUrl);

        Map<String, Object> surfaces = new LinkedHashMap<>();
        surfaces.put("login", loginSurface);
        surfaces.put("shell", shellSurface);
        surfaces.put("splash", splashSurface);
        deepMergeInto(surfaces, surfacesOverrides);

        Map<String, Object> assets = new LinkedHashMap<>();
        assets.put("logoLight", assetPayload(latestAssets.get(BrandAssetKind.LOGO_LIGHT), BrandAssetKind.LOGO_LIGHT, logoLightUrl));
        assets.put("logoDark", assetPayload(latestAssets.get(BrandAssetKind.LOGO_DARK), BrandAssetKind.LOGO_DARK, logoDarkUrl));
        assets.put("favicon", assetPayload(latestAssets.get(BrandAssetKind.FAVICON), BrandAssetKind.FAVICON, faviconUrl));
        assets.put("loginBackground", assetPayload(latestAssets.get(BrandAssetKind.LOGIN_BACKGROUND), BrandAssetKind.LOGIN_BACKGROUND, loginBackgroundUrl));

        Map<String, Object> manifest = new LinkedHashMap<>();
        manifest.put("brandProfileId", brandProfileId);
        manifest.put("tenantId", tenant.getId());
        manifest.put("version", version);
        manifest.put("starterKitId", starterKit.getStarterKitId());
        manifest.put("palettePackId", palettePack.getPalettePackId());
        manifest.put("typographyPackId", typographyPack.getTypographyPackId());
        manifest.put("iconLibraryId", draft.getSelectedIconLibraryId());
        manifest.put("foundation", foundation);
        manifest.put("assets", assets);
        manifest.put("surfaces", surfaces);
        manifest.put("components", components);
        manifest.put("objectDefinitions", Map.of("iconLibraryId", safeString(draft.getSelectedIconLibraryId())));
        manifest.put("metadata", buildMetadata(tenant, legacy, metadataOverrides));
        manifest.put("legacy", legacy);
        return manifest;
    }

    private Map<String, Object> buildFoundationPalette(Map<String, Object> legacy, PalettePackEntity palettePack) {
        Map<String, Object> palette = new LinkedHashMap<>();
        palette.put("primary", legacy.get("primaryColor"));
        palette.put("primaryDark", legacy.get("primaryColorDark"));
        palette.put("secondary", legacy.get("secondaryColor"));
        palette.put("accent", palettePack.getAccent());
        palette.put("surface", legacy.get("surfaceColor"));
        palette.put("surfaceRaised", palettePack.getSurfaceRaised());
        palette.put("text", legacy.get("textColor"));
        palette.put("textMuted", palettePack.getTextMuted());
        palette.put("border", palettePack.getBorder());
        palette.put("success", palettePack.getSuccess());
        palette.put("warning", palettePack.getWarning());
        palette.put("error", palettePack.getError());
        palette.put("info", palettePack.getInfo());
        palette.put("shadowDark", legacy.get("shadowDarkColor"));
        palette.put("shadowLight", legacy.get("shadowLightColor"));
        return palette;
    }

    private Map<String, Object> buildFoundationTypography(Map<String, Object> legacy, TypographyPackEntity typographyPack) {
        Map<String, Object> typography = new LinkedHashMap<>();
        typography.put("headingFontFamily", typographyPack.getHeadingFontFamily());
        typography.put("bodyFontFamily", legacy.get("fontFamily"));
        typography.put("monoFontFamily", typographyPack.getMonoFontFamily());
        typography.put("headingWeights", parseJsonObject(typographyPack.getHeadingWeightScaleJson()));
        typography.put("bodyWeights", parseJsonObject(typographyPack.getBodyWeightScaleJson()));
        typography.put("fontSourceType", typographyPack.getFontSourceType().name());
        typography.put("preloadManifest", parseJsonValue(typographyPack.getPreloadManifestJson()));
        return typography;
    }

    private Map<String, Object> buildFoundationMotion(Map<String, Object> legacy) {
        Map<String, Object> motion = new LinkedHashMap<>();
        motion.put("hoverButton", legacy.get("hoverButton"));
        motion.put("hoverCard", legacy.get("hoverCard"));
        motion.put("hoverInput", legacy.get("hoverInput"));
        motion.put("hoverNav", legacy.get("hoverNav"));
        motion.put("hoverTableRow", legacy.get("hoverTableRow"));
        return motion;
    }

    private Map<String, Object> buildFoundationShape(Map<String, Object> legacy) {
        Map<String, Object> shape = new LinkedHashMap<>();
        shape.put("cornerRadius", legacy.get("cornerRadius"));
        shape.put("buttonDepth", legacy.get("buttonDepth"));
        shape.put("shadowIntensity", legacy.get("shadowIntensity"));
        shape.put("softShadows", legacy.get("softShadows"));
        shape.put("compactNav", legacy.get("compactNav"));
        return shape;
    }

    private Map<String, Object> buildMetadata(TenantEntity tenant, Map<String, Object> legacy, Map<String, Object> metadataOverrides) {
        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("appTitle", tenant.getShortName() + " EMSIST");
        metadata.put("themeColor", legacy.get("primaryColor"));
        metadata.put("faviconUrl", legacy.get("faviconUrl"));
        deepMergeInto(metadata, metadataOverrides);
        return metadata;
    }

    private Map<String, Object> buildEffectiveLegacyBranding(
            TenantBrandingEntity currentBranding,
            PalettePackEntity palettePack,
            TypographyPackEntity typographyPack,
            Map<String, Object> brandingOverrides,
            String logoLightUrl,
            String logoDarkUrl,
            String faviconUrl,
            String loginBackgroundUrl
    ) {
        Map<String, Object> legacy = new LinkedHashMap<>(buildLegacyBrandingFromTenantBranding(currentBranding));

        legacy.put("primaryColor", palettePack.getPrimary());
        legacy.put("secondaryColor", palettePack.getSecondary());
        legacy.put("surfaceColor", palettePack.getSurface());
        legacy.put("textColor", palettePack.getText());
        legacy.put("fontFamily", typographyPack.getBodyFontFamily());
        legacy.put("logoUrl", logoLightUrl);
        legacy.put("logoUrlDark", logoDarkUrl);
        legacy.put("faviconUrl", faviconUrl);
        legacy.put("loginBackgroundUrl", loginBackgroundUrl);

        legacy.putAll(brandingOverrides);
        if (!legacy.containsKey("componentTokens")) {
            legacy.put("componentTokens", Map.of());
        }
        return legacy;
    }

    private Map<String, Object> buildActiveBrandResponse(TenantEntity tenant, BrandProfileEntity activeProfile) {
        Map<String, Object> response = new LinkedHashMap<>();
        if (activeProfile == null) {
            BrandDraftEntity draft = getOrCreateDraftEntity(tenant);
            response.put("brandProfileId", null);
            response.put("manifestVersion", 1);
            response.put("profileVersion", 0);
            response.put("manifest", assembleManifest(tenant, draft, null, 0));
            response.put("publishedAt", "");
            response.put("publishedBy", "");
            return response;
        }

        response.put("brandProfileId", activeProfile.getBrandProfileId());
        response.put("manifestVersion", 1);
        response.put("profileVersion", activeProfile.getProfileVersion());
        response.put("manifest", parseJsonObject(activeProfile.getManifestJson()));
        response.put("publishedAt", activeProfile.getPublishedAt() != null ? activeProfile.getPublishedAt().toString() : "");
        response.put("publishedBy", safeString(activeProfile.getPublishedBy()));
        return response;
    }

    private Map<String, Object> buildLegacyBrandingResponse(TenantEntity tenant, BrandProfileEntity activeProfile) {
        if (activeProfile != null) {
            Map<String, Object> manifest = parseJsonObject(activeProfile.getManifestJson());
            Object legacy = manifest.get("legacy");
            if (legacy instanceof Map<?, ?> legacyMap) {
                return copyMap(legacyMap);
            }
        }
        return buildLegacyBrandingFromTenantBranding(tenant.getBranding());
    }

    private Map<String, Object> buildLegacyBrandingFromTenantBranding(TenantBrandingEntity branding) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("primaryColor", branding != null && branding.getPrimaryColor() != null ? branding.getPrimaryColor() : DEFAULT_PRIMARY);
        map.put("primaryColorDark", branding != null && branding.getPrimaryColorDark() != null ? branding.getPrimaryColorDark() : DEFAULT_PRIMARY_DARK);
        map.put("secondaryColor", branding != null && branding.getSecondaryColor() != null ? branding.getSecondaryColor() : DEFAULT_SECONDARY);
        map.put("surfaceColor", branding != null && branding.getSurfaceColor() != null ? branding.getSurfaceColor() : DEFAULT_SURFACE);
        map.put("textColor", branding != null && branding.getTextColor() != null ? branding.getTextColor() : DEFAULT_TEXT);
        map.put("shadowDarkColor", branding != null && branding.getShadowDarkColor() != null ? branding.getShadowDarkColor() : DEFAULT_SHADOW_DARK);
        map.put("shadowLightColor", branding != null && branding.getShadowLightColor() != null ? branding.getShadowLightColor() : DEFAULT_SHADOW_LIGHT);
        map.put("logoUrl", branding != null && hasText(branding.getLogoUrl()) ? branding.getLogoUrl() : DEFAULT_LOGO);
        map.put("logoUrlDark", branding != null && hasText(branding.getLogoUrlDark()) ? branding.getLogoUrlDark() : (branding != null && hasText(branding.getLogoUrl()) ? branding.getLogoUrl() : DEFAULT_LOGO));
        map.put("faviconUrl", branding != null && hasText(branding.getFaviconUrl()) ? branding.getFaviconUrl() : DEFAULT_FAVICON);
        map.put("loginBackgroundUrl", branding != null && branding.getLoginBackgroundUrl() != null ? branding.getLoginBackgroundUrl() : "");
        map.put("fontFamily", branding != null && branding.getFontFamily() != null ? branding.getFontFamily() : DEFAULT_FONT);
        map.put("customCss", branding != null && branding.getCustomCss() != null ? branding.getCustomCss() : "");
        map.put("cornerRadius", branding != null && branding.getCornerRadius() != null ? branding.getCornerRadius() : 16);
        map.put("buttonDepth", branding != null && branding.getButtonDepth() != null ? branding.getButtonDepth() : 12);
        map.put("shadowIntensity", branding != null && branding.getShadowIntensity() != null ? branding.getShadowIntensity() : 50);
        map.put("softShadows", branding == null || branding.getSoftShadows() == null ? true : branding.getSoftShadows());
        map.put("compactNav", branding != null && Boolean.TRUE.equals(branding.getCompactNav()));
        map.put("hoverButton", branding != null && branding.getHoverButton() != null ? branding.getHoverButton() : "lift");
        map.put("hoverCard", branding != null && branding.getHoverCard() != null ? branding.getHoverCard() : "lift");
        map.put("hoverInput", branding != null && branding.getHoverInput() != null ? branding.getHoverInput() : "press");
        map.put("hoverNav", branding != null && branding.getHoverNav() != null ? branding.getHoverNav() : "slide");
        map.put("hoverTableRow", branding != null && branding.getHoverTableRow() != null ? branding.getHoverTableRow() : "highlight");
        map.put("componentTokens", parseJsonObject(branding != null ? branding.getComponentTokens() : null));
        map.put("updatedAt", branding != null && branding.getUpdatedAt() != null ? branding.getUpdatedAt().toString() : "");
        return map;
    }

    private void syncLegacyMirror(TenantEntity tenant, Map<String, Object> manifest) {
        Map<String, Object> legacy = manifest.get("legacy") instanceof Map<?, ?> legacyMap
                ? copyMap(legacyMap)
                : buildLegacyBrandingFromTenantBranding(tenant.getBranding());

        TenantBrandingEntity branding = tenant.getBranding();
        if (branding == null) {
            branding = TenantBrandingEntity.builder().tenant(tenant).build();
            tenant.setBranding(branding);
        }

        branding.setPrimaryColor(stringValue(legacy, "primaryColor", DEFAULT_PRIMARY));
        branding.setPrimaryColorDark(stringValue(legacy, "primaryColorDark", DEFAULT_PRIMARY_DARK));
        branding.setSecondaryColor(stringValue(legacy, "secondaryColor", DEFAULT_SECONDARY));
        branding.setSurfaceColor(stringValue(legacy, "surfaceColor", DEFAULT_SURFACE));
        branding.setTextColor(stringValue(legacy, "textColor", DEFAULT_TEXT));
        branding.setShadowDarkColor(stringValue(legacy, "shadowDarkColor", DEFAULT_SHADOW_DARK));
        branding.setShadowLightColor(stringValue(legacy, "shadowLightColor", DEFAULT_SHADOW_LIGHT));
        branding.setLogoUrl(stringValue(legacy, "logoUrl", DEFAULT_LOGO));
        branding.setLogoUrlDark(stringValue(legacy, "logoUrlDark", DEFAULT_LOGO));
        branding.setFaviconUrl(stringValue(legacy, "faviconUrl", DEFAULT_FAVICON));
        branding.setLoginBackgroundUrl(stringValue(legacy, "loginBackgroundUrl", ""));
        branding.setFontFamily(stringValue(legacy, "fontFamily", DEFAULT_FONT));
        branding.setCustomCss(stringValue(legacy, "customCss", ""));
        branding.setCornerRadius(intValue(legacy, "cornerRadius", 16));
        branding.setButtonDepth(intValue(legacy, "buttonDepth", 12));
        branding.setShadowIntensity(intValue(legacy, "shadowIntensity", 50));
        branding.setSoftShadows(booleanValue(legacy, "softShadows", true));
        branding.setCompactNav(booleanValue(legacy, "compactNav", false));
        branding.setHoverButton(stringValue(legacy, "hoverButton", "lift"));
        branding.setHoverCard(stringValue(legacy, "hoverCard", "lift"));
        branding.setHoverInput(stringValue(legacy, "hoverInput", "press"));
        branding.setHoverNav(stringValue(legacy, "hoverNav", "slide"));
        branding.setHoverTableRow(stringValue(legacy, "hoverTableRow", "highlight"));
        branding.setComponentTokens(writeJson(mapFromObject(legacy.get("componentTokens"))));

        tenantRepository.save(tenant);
    }

    private void syncDraftToProfile(TenantEntity tenant, BrandProfileEntity profile) {
        BrandDraftEntity draft = getOrCreateDraftEntity(tenant);
        Map<String, Object> manifest = parseJsonObject(profile.getManifestJson());
        Object legacy = manifest.get("legacy");
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("branding", legacy instanceof Map<?, ?> map ? copyMap(map) : Map.of());
        Object metadata = manifest.get("metadata");
        if (metadata instanceof Map<?, ?> map) {
            payload.put("metadata", copyMap(map));
        }
        Object surfaces = manifest.get("surfaces");
        if (surfaces instanceof Map<?, ?> map) {
            payload.put("surfaces", copyMap(map));
        }
        Object components = manifest.get("components");
        if (components instanceof Map<?, ?> map) {
            payload.put("components", copyMap(map));
        }
        draft.setSelectedStarterKitId(normalizeNullableId(stringValue(manifest, "starterKitId", null)));
        draft.setSelectedPalettePackId(normalizeNullableId(stringValue(manifest, "palettePackId", null)));
        draft.setSelectedTypographyPackId(normalizeNullableId(stringValue(manifest, "typographyPackId", null)));
        draft.setSelectedIconLibraryId(normalizeNullableId(stringValue(manifest, "iconLibraryId", null)));
        persistDraft(draft, payload, profile.getPublishedBy(), true);
    }

    private int currentProfileVersion(String tenantId) {
        return brandProfileRepository.findTopByTenantIdOrderByProfileVersionDesc(tenantId)
                .map(BrandProfileEntity::getProfileVersion)
                .orElse(0);
    }

    private BrandStarterKitEntity resolveStarterKit(String starterKitId) {
        if (hasText(starterKitId)) {
            return brandStarterKitRepository.findById(starterKitId)
                    .orElseThrow(() -> new ResourceNotFoundException("Starter kit not found: " + starterKitId));
        }
        return getDefaultStarterKit();
    }

    private BrandStarterKitEntity getDefaultStarterKit() {
        return brandStarterKitRepository.findByStatusOrderByNameAsc(BrandCatalogStatus.ACTIVE).stream()
                .filter(kit -> Boolean.TRUE.equals(kit.getIsDefault()))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("No default starter kit configured"));
    }

    private PalettePackEntity resolvePalettePack(String palettePackId, BrandStarterKitEntity starterKit) {
        String resolvedId = hasText(palettePackId) ? palettePackId : starterKit.getBasePalettePackId();
        return palettePackRepository.findById(resolvedId)
                .orElseGet(this::getDefaultPalettePack);
    }

    private PalettePackEntity getDefaultPalettePack() {
        return palettePackRepository.findByStatusOrderByNameAsc(BrandCatalogStatus.ACTIVE).stream()
                .filter(pack -> Boolean.TRUE.equals(pack.getIsDefault()))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("No default palette pack configured"));
    }

    private TypographyPackEntity resolveTypographyPack(String typographyPackId, BrandStarterKitEntity starterKit) {
        String resolvedId = hasText(typographyPackId) ? typographyPackId : starterKit.getBaseTypographyPackId();
        return typographyPackRepository.findById(resolvedId)
                .orElseGet(this::getDefaultTypographyPack);
    }

    private TypographyPackEntity getDefaultTypographyPack() {
        return typographyPackRepository.findByStatusOrderByNameAsc(BrandCatalogStatus.ACTIVE).stream()
                .filter(pack -> Boolean.TRUE.equals(pack.getIsDefault()))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("No default typography pack configured"));
    }

    private Map<BrandAssetKind, BrandAssetEntity> latestAssetsByKind(String tenantId) {
        Map<String, BrandAssetEntity> assets = new LinkedHashMap<>();
        for (BrandAssetEntity asset : brandAssetRepository.findByTenantIdOrderByCreatedAtDesc(tenantId)) {
            assets.putIfAbsent(asset.getKind().name(), asset);
        }
        Map<String, BrandAssetEntity> resolved = new LinkedHashMap<>();
        for (Map.Entry<String, BrandAssetEntity> entry : assets.entrySet()) {
            resolved.put(entry.getKey(), entry.getValue());
        }
        Map<BrandAssetKind, BrandAssetEntity> byKind = new LinkedHashMap<>();
        for (BrandAssetKind kind : BrandAssetKind.values()) {
            BrandAssetEntity asset = resolved.get(kind.name());
            if (asset != null) {
                byKind.put(kind, asset);
            }
        }
        return byKind;
    }

    private String resolveAssetUrl(
            BrandAssetKind kind,
            Map<BrandAssetKind, BrandAssetEntity> latestAssets,
            Map<String, Object> branding,
            String legacyKey,
            String fallback
    ) {
        BrandAssetEntity asset = latestAssets.get(kind);
        if (asset != null && hasText(asset.getDeliveryUrl())) {
            return asset.getDeliveryUrl();
        }
        Object override = branding.get(legacyKey);
        if (override instanceof String value && !value.isBlank()) {
            return value;
        }
        return fallback;
    }

    private Map<String, Object> assetPayload(BrandAssetEntity asset, BrandAssetKind kind, String resolvedUrl) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("assetId", asset != null ? asset.getAssetId() : null);
        payload.put("kind", kind.name());
        payload.put("deliveryUrl", resolvedUrl);
        payload.put("displayName", asset != null ? asset.getDisplayName() : "");
        payload.put("mimeType", asset != null ? asset.getMimeType() : "");
        payload.put("width", asset != null ? asset.getWidth() : null);
        payload.put("height", asset != null ? asset.getHeight() : null);
        return payload;
    }

    private Map<String, Object> toHistoryItem(BrandProfileEntity profile) {
        Map<String, Object> manifest = parseJsonObject(profile.getManifestJson());
        Map<String, Object> metadata = nestedMap(manifest, "metadata");
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("brandProfileId", profile.getBrandProfileId());
        summary.put("profileVersion", profile.getProfileVersion());
        summary.put("publishedAt", profile.getPublishedAt() != null ? profile.getPublishedAt().toString() : "");
        summary.put("publishedBy", safeString(profile.getPublishedBy()));
        summary.put("rolledBackFromProfileId", safeString(profile.getRolledBackFromProfileId()));
        summary.put("appTitle", stringValue(metadata, "appTitle", ""));
        summary.put("themeColor", stringValue(metadata, "themeColor", DEFAULT_PRIMARY));
        summary.put("starterKitId", stringValue(manifest, "starterKitId", ""));
        summary.put("palettePackId", stringValue(manifest, "palettePackId", ""));
        summary.put("typographyPackId", stringValue(manifest, "typographyPackId", ""));
        return summary;
    }

    private Map<String, Object> toStarterKitSummary(BrandStarterKitEntity starterKit) {
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("starterKitId", starterKit.getStarterKitId());
        summary.put("name", starterKit.getName());
        summary.put("description", safeString(starterKit.getDescription()));
        summary.put("previewThumbnailAssetId", safeString(starterKit.getPreviewThumbnailAssetId()));
        summary.put("basePalettePackId", starterKit.getBasePalettePackId());
        summary.put("baseTypographyPackId", starterKit.getBaseTypographyPackId());
        summary.put("isDefault", starterKit.getIsDefault());
        summary.put("status", starterKit.getStatus().name());
        return summary;
    }

    private Map<String, Object> toPaletteSummary(PalettePackEntity palettePack) {
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("palettePackId", palettePack.getPalettePackId());
        summary.put("name", palettePack.getName());
        summary.put("description", safeString(palettePack.getDescription()));
        summary.put("primary", palettePack.getPrimary());
        summary.put("secondary", palettePack.getSecondary());
        summary.put("accent", palettePack.getAccent());
        summary.put("surface", palettePack.getSurface());
        summary.put("surfaceRaised", palettePack.getSurfaceRaised());
        summary.put("text", palettePack.getText());
        summary.put("textMuted", palettePack.getTextMuted());
        summary.put("border", palettePack.getBorder());
        summary.put("success", palettePack.getSuccess());
        summary.put("warning", palettePack.getWarning());
        summary.put("error", palettePack.getError());
        summary.put("info", palettePack.getInfo());
        summary.put("isDefault", palettePack.getIsDefault());
        summary.put("status", palettePack.getStatus().name());
        return summary;
    }

    private Map<String, Object> toTypographySummary(TypographyPackEntity typographyPack) {
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("typographyPackId", typographyPack.getTypographyPackId());
        summary.put("name", typographyPack.getName());
        summary.put("description", safeString(typographyPack.getDescription()));
        summary.put("headingFontFamily", typographyPack.getHeadingFontFamily());
        summary.put("bodyFontFamily", typographyPack.getBodyFontFamily());
        summary.put("monoFontFamily", typographyPack.getMonoFontFamily());
        summary.put("fontSourceType", typographyPack.getFontSourceType().name());
        summary.put("isDefault", typographyPack.getIsDefault());
        summary.put("status", typographyPack.getStatus().name());
        return summary;
    }

    private Map<String, Object> toAssetSummary(BrandAssetEntity asset) {
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("assetId", asset.getAssetId());
        summary.put("tenantId", asset.getTenantId());
        summary.put("kind", asset.getKind().name());
        summary.put("displayName", asset.getDisplayName());
        summary.put("deliveryUrl", asset.getDeliveryUrl());
        summary.put("mimeType", asset.getMimeType());
        summary.put("fileSize", asset.getFileSize());
        summary.put("width", asset.getWidth());
        summary.put("height", asset.getHeight());
        summary.put("createdAt", asset.getCreatedAt() != null ? asset.getCreatedAt().toString() : "");
        summary.put("createdBy", safeString(asset.getCreatedBy()));
        return summary;
    }

    private Map<String, Object> toIconLibrarySummary(IconLibraryEntity iconLibrary) {
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("iconLibraryId", iconLibrary.getIconLibraryId());
        summary.put("tenantId", iconLibrary.getTenantId());
        summary.put("name", iconLibrary.getName());
        summary.put("description", safeString(iconLibrary.getDescription()));
        summary.put("sourceType", iconLibrary.getSourceType().name());
        summary.put("version", iconLibrary.getVersion());
        summary.put("manifest", parseJsonObject(iconLibrary.getManifestJson()));
        summary.put("createdAt", iconLibrary.getCreatedAt() != null ? iconLibrary.getCreatedAt().toString() : "");
        summary.put("createdBy", safeString(iconLibrary.getCreatedBy()));
        return summary;
    }

    private void recordAuditEvent(
            String tenantId,
            BrandAuditEventType eventType,
            String actorId,
            String brandProfileId,
            String assetId,
            String iconLibraryId,
            String summary,
            Map<String, Object> details
    ) {
        BrandAuditEventEntity event = BrandAuditEventEntity.builder()
                .tenantId(tenantId)
                .eventType(eventType)
                .actorId(normalizeNullableId(actorId))
                .targetBrandProfileId(normalizeNullableId(brandProfileId))
                .targetAssetId(normalizeNullableId(assetId))
                .targetIconLibraryId(normalizeNullableId(iconLibraryId))
                .summary(summary)
                .detailsJson(writeJson(details))
                .build();
        brandAuditEventRepository.save(event);
    }

    private Map<String, Object> parseDraftPayload(BrandDraftEntity draft) {
        return parseJsonObject(draft.getDraftManifestJson());
    }

    private Map<String, Object> parseJsonObject(String json) {
        Object parsed = parseJsonValue(json);
        return parsed instanceof Map<?, ?> map ? copyMap(map) : new LinkedHashMap<>();
    }

    private Object parseJsonValue(String json) {
        if (!hasText(json)) {
            return new LinkedHashMap<>();
        }
        try {
            return objectMapper.readValue(json, Object.class);
        } catch (JsonProcessingException e) {
            log.warn("Failed to parse brand JSON payload: {}", e.getMessage());
            return new LinkedHashMap<>();
        }
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value == null ? Map.of() : value);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize brand payload", e);
        }
    }

    private Map<String, Object> extractBrandingOverrides(Map<String, Object> draftPayload) {
        Object branding = draftPayload.get("branding");
        if (branding instanceof Map<?, ?> map) {
            return copyMap(map);
        }
        return new LinkedHashMap<>();
    }

    private Map<String, Object> nestedMap(Map<String, Object> source, String key) {
        Object value = source.get(key);
        return value instanceof Map<?, ?> map ? copyMap(map) : new LinkedHashMap<>();
    }

    private Map<String, Object> mapFromObject(Object value) {
        return value instanceof Map<?, ?> map ? copyMap(map) : new LinkedHashMap<>();
    }

    private void copyNestedIfMap(Map<String, Object> source, Map<String, Object> target, String key) {
        Object value = source.get(key);
        if (value instanceof Map<?, ?> map) {
            target.put(key, copyMap(map));
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> copyMap(Map<?, ?> source) {
        Map<String, Object> copy = new LinkedHashMap<>();
        if (source == null) {
            return copy;
        }
        for (Map.Entry<?, ?> entry : source.entrySet()) {
            if (entry.getKey() instanceof String key) {
                Object value = entry.getValue();
                if (value instanceof Map<?, ?> nested) {
                    copy.put(key, copyMap(nested));
                } else if (value instanceof List<?> list) {
                    copy.put(key, copyList(list));
                } else {
                    copy.put(key, value);
                }
            }
        }
        return copy;
    }

    private List<Object> copyList(List<?> source) {
        List<Object> copy = new ArrayList<>();
        for (Object item : source) {
            if (item instanceof Map<?, ?> map) {
                copy.add(copyMap(map));
            } else if (item instanceof List<?> list) {
                copy.add(copyList(list));
            } else {
                copy.add(item);
            }
        }
        return copy;
    }

    private Map<String, Object> deepMergeMaps(Map<String, Object> base, Map<String, Object> overrides) {
        Map<String, Object> merged = copyMap(base);
        deepMergeInto(merged, overrides);
        return merged;
    }

    private void deepMergeInto(Map<String, Object> target, Map<String, Object> overrides) {
        for (Map.Entry<String, Object> entry : overrides.entrySet()) {
            Object existing = target.get(entry.getKey());
            Object incoming = entry.getValue();
            if (existing instanceof Map<?, ?> existingMap && incoming instanceof Map<?, ?> incomingMap) {
                target.put(entry.getKey(), deepMergeMaps(copyMap(existingMap), copyMap(incomingMap)));
            } else {
                target.put(entry.getKey(), incoming);
            }
        }
    }

    private String safeString(String value) {
        return value == null ? "" : value;
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private String normalizeNullableId(String value) {
        return hasText(value) ? value : null;
    }

    private String stringValue(Map<String, Object> source, String key, String fallback) {
        Object value = source.get(key);
        return value instanceof String string && !string.isBlank() ? string : fallback;
    }

    private Integer intValue(Map<String, Object> source, String key, Integer fallback) {
        Object value = source.get(key);
        return value instanceof Number number ? number.intValue() : fallback;
    }

    private Boolean booleanValue(Map<String, Object> source, String key, Boolean fallback) {
        Object value = source.get(key);
        return value instanceof Boolean bool ? bool : fallback;
    }
}
