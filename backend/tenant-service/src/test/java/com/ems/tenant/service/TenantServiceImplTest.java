package com.ems.tenant.service;

import com.ems.common.enums.TenantStatus;
import com.ems.common.enums.TenantTier;
import com.ems.common.enums.TenantType;
import com.ems.common.exception.TenantNotFoundException;
import com.ems.tenant.entity.TenantBrandingEntity;
import com.ems.tenant.entity.TenantEntity;
import com.ems.tenant.mapper.TenantMapper;
import com.ems.tenant.repository.TenantDomainRepository;
import com.ems.tenant.repository.TenantRepository;
import com.ems.tenant.service.branding.BrandingPolicyEnforcer;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for TenantServiceImpl -- Tenant Theme Builder feature.
 *
 * Covers:
 * - getBranding() -- returns all 24 fields with null-coalescing defaults
 * - getBranding() -- throws TenantNotFoundException when tenant not found
 * - updateBranding() -- correctly sets all 14 new neumorphic fields
 * - updateBranding() -- null values in request do NOT overwrite existing non-null values
 * - createTenant() -- new tenant's branding entity has correct @Builder.Default values
 *
 * NOTE: DnsVerificationService is a concrete class that Mockito cannot mock on
 * Java 25 (ByteBuddy limitation). A test stub (TestDnsVerificationService) is
 * used instead, following the project pattern from license-service tests.
 * TenantServiceImpl is constructed manually rather than using @InjectMocks.
 */
@ExtendWith(MockitoExtension.class)
class TenantServiceImplTest {

    @Mock
    private TenantRepository tenantRepository;

    @Mock
    private TenantDomainRepository domainRepository;

    @Mock
    private TenantMapper tenantMapper;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    private TestDnsVerificationService dnsVerificationService;
    private BrandingPolicyEnforcer brandingPolicyEnforcer;
    private ObjectMapper objectMapper;

    private TenantServiceImpl tenantService;

    private TenantEntity testTenant;
    private TenantBrandingEntity testBranding;

    @BeforeEach
    void setUp() {
        dnsVerificationService = new TestDnsVerificationService();
        brandingPolicyEnforcer = new BrandingPolicyEnforcer();
        objectMapper = new ObjectMapper();
        tenantService = new TenantServiceImpl(
                tenantRepository, domainRepository, tenantMapper,
                eventPublisher, dnsVerificationService, brandingPolicyEnforcer, objectMapper);

        testTenant = TenantEntity.builder()
                .id("tenant-test1")
                .fullName("Test Corp")
                .shortName("TestCo")
                .slug("testco")
                .tenantType(TenantType.REGULAR)
                .tier(TenantTier.PROFESSIONAL)
                .status(TenantStatus.ACTIVE)
                .build();

        testBranding = TenantBrandingEntity.builder()
                .tenant(testTenant)
                .build();
        testTenant.setBranding(testBranding);
    }

    // =========================================================================
    // getBranding()
    // =========================================================================

    @Nested
    @DisplayName("getBranding()")
    class GetBrandingTests {

        @Test
        @DisplayName("getBranding_whenTenantExists_shouldReturnAllFieldsWithDefaults")
        void getBranding_whenTenantExists_shouldReturnAllFieldsWithDefaults() {
            // Arrange
            when(tenantRepository.findById("tenant-test1"))
                    .thenReturn(Optional.of(testTenant));

            // Act
            Map<String, Object> result = tenantService.getBranding("tenant-test1");

            // Assert -- all 24 fields present
            assertThat(result).hasSize(24);

            // Original fields with @Builder.Default values
            assertThat(result.get("primaryColor")).isEqualTo("#428177");
            assertThat(result.get("primaryColorDark")).isEqualTo("#054239");
            assertThat(result.get("secondaryColor")).isEqualTo("#b9a779");
            assertThat(result.get("fontFamily")).isEqualTo("'Gotham Rounded', 'Nunito', sans-serif");

            // Nullable fields with null-coalesce defaults (logoUrl etc. are null on builder default)
            assertThat(result.get("logoUrl")).isEqualTo("");
            assertThat(result.get("logoUrlDark")).isEqualTo("");
            assertThat(result.get("faviconUrl")).isEqualTo("");
            assertThat(result.get("loginBackgroundUrl")).isEqualTo("");
            assertThat(result.get("customCss")).isEqualTo("");

            // New neumorphic color controls
            assertThat(result.get("surfaceColor")).isEqualTo("#edebe0");
            assertThat(result.get("textColor")).isEqualTo("#3d3a3b");
            assertThat(result.get("shadowDarkColor")).isEqualTo("#988561");
            assertThat(result.get("shadowLightColor")).isEqualTo("#ffffff");

            // New neumorphic shape controls
            assertThat(result.get("cornerRadius")).isEqualTo(16);
            assertThat(result.get("buttonDepth")).isEqualTo(12);
            assertThat(result.get("shadowIntensity")).isEqualTo(50);
            assertThat(result.get("softShadows")).isEqualTo(true);
            assertThat(result.get("compactNav")).isEqualTo(false);

            // New hover behaviour fields
            assertThat(result.get("hoverButton")).isEqualTo("lift");
            assertThat(result.get("hoverCard")).isEqualTo("lift");
            assertThat(result.get("hoverInput")).isEqualTo("press");
            assertThat(result.get("hoverNav")).isEqualTo("slide");
            assertThat(result.get("hoverTableRow")).isEqualTo("highlight");

            // updatedAt -- present (may be null initially, coalesced to "")
            assertThat(result).containsKey("updatedAt");
        }

        @Test
        @DisplayName("getBranding_whenBrandingHasNullFields_shouldReturnNullCoalescedDefaults")
        void getBranding_whenBrandingHasNullFields_shouldReturnNullCoalescedDefaults() {
            // Arrange -- create a branding entity with all fields explicitly null
            // (simulates an existing row created before V9 migration)
            TenantBrandingEntity legacyBranding = new TenantBrandingEntity();
            legacyBranding.setTenant(testTenant);
            // All fields are null (no @Builder.Default applied with no-arg constructor)
            testTenant.setBranding(legacyBranding);

            when(tenantRepository.findById("tenant-test1"))
                    .thenReturn(Optional.of(testTenant));

            // Act
            Map<String, Object> result = tenantService.getBranding("tenant-test1");

            // Assert -- null-coalescing defaults applied
            assertThat(result.get("primaryColor")).isEqualTo("#428177");
            assertThat(result.get("primaryColorDark")).isEqualTo("#054239");
            assertThat(result.get("secondaryColor")).isEqualTo("#b9a779");
            assertThat(result.get("surfaceColor")).isEqualTo("#edebe0");
            assertThat(result.get("textColor")).isEqualTo("#3d3a3b");
            assertThat(result.get("shadowDarkColor")).isEqualTo("#988561");
            assertThat(result.get("shadowLightColor")).isEqualTo("#ffffff");
            assertThat(result.get("cornerRadius")).isEqualTo(16);
            assertThat(result.get("buttonDepth")).isEqualTo(12);
            assertThat(result.get("shadowIntensity")).isEqualTo(50);
            assertThat(result.get("softShadows")).isEqualTo(true);
            assertThat(result.get("compactNav")).isEqualTo(false);
            assertThat(result.get("hoverButton")).isEqualTo("lift");
            assertThat(result.get("hoverCard")).isEqualTo("lift");
            assertThat(result.get("hoverInput")).isEqualTo("press");
            assertThat(result.get("hoverNav")).isEqualTo("slide");
            assertThat(result.get("hoverTableRow")).isEqualTo("highlight");
            assertThat(result.get("fontFamily")).isEqualTo("'Gotham Rounded', 'Nunito', sans-serif");
            assertThat(result.get("logoUrl")).isEqualTo("");
            assertThat(result.get("customCss")).isEqualTo("");
        }

        @Test
        @DisplayName("getBranding_whenBrandingIsNull_shouldReturnDefaultBrandingResponse")
        void getBranding_whenBrandingIsNull_shouldReturnDefaultBrandingResponse() {
            // Arrange -- tenant with no branding entity at all
            testTenant.setBranding(null);
            when(tenantRepository.findById("tenant-test1"))
                    .thenReturn(Optional.of(testTenant));

            // Act
            Map<String, Object> result = tenantService.getBranding("tenant-test1");

            // Assert -- falls back to TenantBrandingEntity.builder().build() defaults
            assertThat(result).hasSize(24);
            assertThat(result.get("primaryColor")).isEqualTo("#428177");
            assertThat(result.get("surfaceColor")).isEqualTo("#edebe0");
            assertThat(result.get("hoverButton")).isEqualTo("lift");
        }

        @Test
        @DisplayName("getBranding_whenTenantNotFound_shouldThrowTenantNotFoundException")
        void getBranding_whenTenantNotFound_shouldThrowTenantNotFoundException() {
            // Arrange
            when(tenantRepository.findById("nonexistent"))
                    .thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> tenantService.getBranding("nonexistent"))
                    .isInstanceOf(TenantNotFoundException.class)
                    .hasMessageContaining("nonexistent");
        }

        @Test
        @DisplayName("getBranding_whenBrandingHasCustomValues_shouldReturnStoredValues")
        void getBranding_whenBrandingHasCustomValues_shouldReturnStoredValues() {
            // Arrange
            testBranding.setPrimaryColor("#ff0000");
            testBranding.setSurfaceColor("#000000");
            testBranding.setCornerRadius(24);
            testBranding.setHoverButton("glow");
            testBranding.setSoftShadows(false);
            testBranding.setUpdatedAt(Instant.parse("2026-03-01T10:00:00Z"));

            when(tenantRepository.findById("tenant-test1"))
                    .thenReturn(Optional.of(testTenant));

            // Act
            Map<String, Object> result = tenantService.getBranding("tenant-test1");

            // Assert -- stored values used instead of defaults
            assertThat(result.get("primaryColor")).isEqualTo("#ff0000");
            assertThat(result.get("surfaceColor")).isEqualTo("#000000");
            assertThat(result.get("cornerRadius")).isEqualTo(24);
            assertThat(result.get("hoverButton")).isEqualTo("glow");
            assertThat(result.get("softShadows")).isEqualTo(false);
            assertThat(result.get("updatedAt")).isEqualTo("2026-03-01T10:00:00Z");
        }
    }

    // =========================================================================
    // updateBranding()
    // =========================================================================

    @Nested
    @DisplayName("updateBranding()")
    class UpdateBrandingTests {

        @Test
        @DisplayName("updateBranding_withAllNewFields_shouldSetAllNeumorphicFields")
        void updateBranding_withAllNewFields_shouldSetAllNeumorphicFields() {
            // Arrange
            when(tenantRepository.findById("tenant-test1"))
                    .thenReturn(Optional.of(testTenant));
            when(tenantRepository.save(any(TenantEntity.class)))
                    .thenReturn(testTenant);

            Map<String, Object> request = Map.ofEntries(
                    Map.entry("surfaceColor", "#edebe0"),
                    Map.entry("textColor", "#3d3a3b"),
                    Map.entry("shadowDarkColor", "#988561"),
                    Map.entry("shadowLightColor", "#ffffff"),
                    Map.entry("cornerRadius", 20),
                    Map.entry("buttonDepth", 8),
                    Map.entry("shadowIntensity", 75),
                    Map.entry("softShadows", false),
                    Map.entry("compactNav", true),
                    Map.entry("hoverButton", "glow"),
                    Map.entry("hoverCard", "glow"),
                    Map.entry("hoverInput", "highlight"),
                    Map.entry("hoverNav", "lift"),
                    Map.entry("hoverTableRow", "lift")
            );

            // Act
            tenantService.updateBranding("tenant-test1", request);

            // Assert -- verify all fields were set on the branding entity
            TenantBrandingEntity branding = testTenant.getBranding();
            assertThat(branding.getSurfaceColor()).isEqualTo("#edebe0");
            assertThat(branding.getTextColor()).isEqualTo("#3d3a3b");
            assertThat(branding.getShadowDarkColor()).isEqualTo("#988561");
            assertThat(branding.getShadowLightColor()).isEqualTo("#ffffff");
            assertThat(branding.getCornerRadius()).isEqualTo(20);
            assertThat(branding.getButtonDepth()).isEqualTo(8);
            assertThat(branding.getShadowIntensity()).isEqualTo(75);
            assertThat(branding.getSoftShadows()).isFalse();
            assertThat(branding.getCompactNav()).isTrue();
            assertThat(branding.getHoverButton()).isEqualTo("glow");
            assertThat(branding.getHoverCard()).isEqualTo("glow");
            assertThat(branding.getHoverInput()).isEqualTo("highlight");
            assertThat(branding.getHoverNav()).isEqualTo("lift");
            assertThat(branding.getHoverTableRow()).isEqualTo("lift");

            verify(tenantRepository).save(testTenant);
        }

        @Test
        @DisplayName("updateBranding_withNullRequestValues_shouldNotOverwriteExistingValues")
        void updateBranding_withNullRequestValues_shouldNotOverwriteExistingValues() {
            // Arrange -- set existing values first
            testBranding.setSurfaceColor("#custom1");
            testBranding.setCornerRadius(24);
            testBranding.setHoverButton("press");

            when(tenantRepository.findById("tenant-test1"))
                    .thenReturn(Optional.of(testTenant));
            when(tenantRepository.save(any(TenantEntity.class)))
                    .thenReturn(testTenant);

            // Send a request with only primaryColor -- all other fields are absent (null)
            Map<String, Object> request = Map.of("primaryColor", "#054239");

            // Act
            tenantService.updateBranding("tenant-test1", request);

            // Assert -- existing values preserved (not overwritten by nulls)
            TenantBrandingEntity branding = testTenant.getBranding();
            assertThat(branding.getPrimaryColor()).isEqualTo("#054239");
            assertThat(branding.getSurfaceColor()).isEqualTo("#custom1");
            assertThat(branding.getCornerRadius()).isEqualTo(24);
            assertThat(branding.getHoverButton()).isEqualTo("press");
        }

        @Test
        @DisplayName("updateBranding_withOriginalAndNewFields_shouldSetBothCategories")
        void updateBranding_withOriginalAndNewFields_shouldSetBothCategories() {
            // Arrange
            when(tenantRepository.findById("tenant-test1"))
                    .thenReturn(Optional.of(testTenant));
            when(tenantRepository.save(any(TenantEntity.class)))
                    .thenReturn(testTenant);

            Map<String, Object> request = Map.of(
                    "primaryColor", "#054239",
                    "fontFamily", "'Nunito', sans-serif",
                    "surfaceColor", "#edebe0",
                    "hoverButton", "none"
            );

            // Act
            tenantService.updateBranding("tenant-test1", request);

            // Assert -- both old and new fields updated
            TenantBrandingEntity branding = testTenant.getBranding();
            assertThat(branding.getPrimaryColor()).isEqualTo("#054239");
            assertThat(branding.getFontFamily()).isEqualTo("'Nunito', sans-serif");
            assertThat(branding.getSurfaceColor()).isEqualTo("#edebe0");
            assertThat(branding.getHoverButton()).isEqualTo("none");
        }

        @Test
        @DisplayName("updateBranding_whenNoBrandingExists_shouldCreateNewBrandingEntity")
        void updateBranding_whenNoBrandingExists_shouldCreateNewBrandingEntity() {
            // Arrange -- tenant with no branding
            testTenant.setBranding(null);
            when(tenantRepository.findById("tenant-test1"))
                    .thenReturn(Optional.of(testTenant));
            when(tenantRepository.save(any(TenantEntity.class)))
                    .thenReturn(testTenant);

            Map<String, Object> request = Map.of(
                    "primaryColor", "#054239",
                    "cornerRadius", 10
            );

            // Act
            tenantService.updateBranding("tenant-test1", request);

            // Assert -- branding entity was created
            assertThat(testTenant.getBranding()).isNotNull();
            assertThat(testTenant.getBranding().getPrimaryColor()).isEqualTo("#054239");
            assertThat(testTenant.getBranding().getCornerRadius()).isEqualTo(10);
        }

        @Test
        @DisplayName("updateBranding_whenTenantNotFound_shouldThrowTenantNotFoundException")
        void updateBranding_whenTenantNotFound_shouldThrowTenantNotFoundException() {
            // Arrange
            when(tenantRepository.findById("nonexistent"))
                    .thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> tenantService.updateBranding("nonexistent", Map.of()))
                    .isInstanceOf(TenantNotFoundException.class);
        }
    }

    // =========================================================================
    // createTenant() -- @Builder.Default verification
    // =========================================================================

    @Nested
    @DisplayName("createTenant() -- branding defaults")
    class CreateTenantBrandingDefaultsTests {

        @Test
        @DisplayName("createTenant_newTenantBranding_shouldHaveCorrectBuilderDefaultValues")
        void createTenant_newTenantBranding_shouldHaveCorrectBuilderDefaultValues() {
            // Arrange -- verify that TenantBrandingEntity.builder().build() produces
            // the correct Neumorph Classic defaults

            // Act
            TenantBrandingEntity branding = TenantBrandingEntity.builder().build();

            // Assert -- original fields with changed defaults
            assertThat(branding.getPrimaryColor()).isEqualTo("#428177");
            assertThat(branding.getPrimaryColorDark()).isEqualTo("#054239");
            assertThat(branding.getSecondaryColor()).isEqualTo("#b9a779");
            assertThat(branding.getFontFamily()).isEqualTo("'Gotham Rounded', 'Nunito', sans-serif");

            // New neumorphic color controls
            assertThat(branding.getSurfaceColor()).isEqualTo("#edebe0");
            assertThat(branding.getTextColor()).isEqualTo("#3d3a3b");
            assertThat(branding.getShadowDarkColor()).isEqualTo("#988561");
            assertThat(branding.getShadowLightColor()).isEqualTo("#ffffff");

            // New neumorphic shape controls
            assertThat(branding.getCornerRadius()).isEqualTo(16);
            assertThat(branding.getButtonDepth()).isEqualTo(12);
            assertThat(branding.getShadowIntensity()).isEqualTo(50);
            assertThat(branding.getSoftShadows()).isTrue();
            assertThat(branding.getCompactNav()).isFalse();

            // New hover behaviour fields
            assertThat(branding.getHoverButton()).isEqualTo("lift");
            assertThat(branding.getHoverCard()).isEqualTo("lift");
            assertThat(branding.getHoverInput()).isEqualTo("press");
            assertThat(branding.getHoverNav()).isEqualTo("slide");
            assertThat(branding.getHoverTableRow()).isEqualTo("highlight");

            // Nullable asset fields should be null (not defaults) until explicitly set
            assertThat(branding.getLogoUrl()).isNull();
            assertThat(branding.getLogoUrlDark()).isNull();
            assertThat(branding.getFaviconUrl()).isNull();
            assertThat(branding.getLoginBackgroundUrl()).isNull();
            assertThat(branding.getCustomCss()).isNull();
        }
    }
}
