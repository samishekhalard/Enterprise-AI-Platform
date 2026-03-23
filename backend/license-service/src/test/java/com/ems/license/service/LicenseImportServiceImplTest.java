package com.ems.license.service;

import com.ems.common.exception.BusinessException;
import com.ems.license.dto.LicenseImportResponse;
import com.ems.license.entity.*;
import com.ems.license.repository.ApplicationLicenseRepository;
import com.ems.license.repository.LicenseFileRepository;
import com.ems.license.repository.RevocationEntryRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("LicenseImportServiceImpl")
class LicenseImportServiceImplTest {

    @Mock
    private LicenseFileRepository licenseFileRepository;

    @Mock
    private ApplicationLicenseRepository applicationLicenseRepository;

    @Mock
    private RevocationEntryRepository revocationEntryRepository;

    private TestLicenseSignatureVerifier signatureVerifier;

    private ObjectMapper objectMapper = new ObjectMapper();

    private TestLicenseStateHolder licenseStateHolder;
    private LicenseImportServiceImpl licenseImportService;

    private static final UUID IMPORTER_ID = UUID.randomUUID();
    private static final String VALID_KID = "key-2026-001";
    private static final Instant FUTURE_EXPIRY = Instant.now().plus(365, ChronoUnit.DAYS);

    @BeforeEach
    void setUp() {
        signatureVerifier = new TestLicenseSignatureVerifier(true);
        licenseStateHolder = new TestLicenseStateHolder(LicenseState.UNLICENSED);
        licenseImportService = new LicenseImportServiceImpl(
                licenseFileRepository,
                applicationLicenseRepository,
                revocationEntryRepository,
                signatureVerifier,
                licenseStateHolder,
                objectMapper
        );
    }

    /**
     * Build a valid license file string in the expected format: header---payload---signature.
     */
    private byte[] buildLicenseFile(String kid, String payloadJson) {
        String header = "kid: " + kid;
        String signatureBase64 = Base64.getEncoder().encodeToString("test-signature".getBytes());
        String content = header + "---" + payloadJson + "---" + signatureBase64;
        return content.getBytes(StandardCharsets.UTF_8);
    }

    private String buildValidPayloadJson() {
        return buildPayloadJson("EMSIST", FUTURE_EXPIRY, 5, List.of("basic_workflows", "advanced_reports"));
    }

    private String buildPayloadJson(String product, Instant expiresAt, int maxTenants, List<String> features) {
        Instant tenantExpiry = expiresAt.minus(30, ChronoUnit.DAYS).isBefore(Instant.now())
                ? expiresAt : expiresAt.minus(30, ChronoUnit.DAYS);

        return """
            {
              "licenseId": "LIC-2026-0001",
              "formatVersion": "1.0",
              "issuer": "EMS Corp",
              "issuedAt": "%s",
              "customerId": "CUST-001",
              "customerName": "Test Customer",
              "customerCountry": "DE",
              "product": "%s",
              "versionMin": "1.0.0",
              "versionMax": "2.99.99",
              "instanceId": null,
              "maxTenants": %d,
              "expiresAt": "%s",
              "features": %s,
              "gracePeriodDays": 30,
              "degradedFeatures": ["advanced_reports"],
              "tenants": [
                {
                  "tenantId": "tenant-1",
                  "displayName": "Tenant One",
                  "expiresAt": "%s",
                  "features": %s,
                  "seats": {
                    "TENANT_ADMIN": 2,
                    "POWER_USER": 5,
                    "CONTRIBUTOR": 10,
                    "VIEWER": -1
                  }
                }
              ]
            }
            """.formatted(
                Instant.now().minus(1, ChronoUnit.DAYS).toString(),
                product,
                maxTenants,
                expiresAt.toString(),
                toJsonArray(features),
                tenantExpiry.toString(),
                toJsonArray(features)
        );
    }

    private String toJsonArray(List<String> list) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < list.size(); i++) {
            if (i > 0) sb.append(", ");
            sb.append("\"").append(list.get(i)).append("\"");
        }
        sb.append("]");
        return sb.toString();
    }

    @Nested
    @DisplayName("importLicense - happy path")
    class HappyPath {

        @Test
        @DisplayName("Should import valid license file and return response with correct details")
        void shouldImportValidLicense_whenAllChecksPass() {
            // Arrange
            String payloadJson = buildValidPayloadJson();
            byte[] fileBytes = buildLicenseFile(VALID_KID, payloadJson);

            // signatureVerifier stub defaults to true (set in setUp)
            given(revocationEntryRepository.existsByRevokedLicenseId("LIC-2026-0001"))
                    .willReturn(false);
            given(licenseFileRepository.findByImportStatus(LicenseImportStatus.ACTIVE))
                    .willReturn(Collections.emptyList());
            given(licenseFileRepository.save(any(LicenseFileEntity.class)))
                    .willAnswer(inv -> {
                        LicenseFileEntity entity = inv.getArgument(0);
                        entity.setId(UUID.randomUUID());
                        entity.setCreatedAt(Instant.now());
                        return entity;
                    });
            given(applicationLicenseRepository.save(any(ApplicationLicenseEntity.class)))
                    .willAnswer(inv -> {
                        ApplicationLicenseEntity entity = inv.getArgument(0);
                        entity.setId(UUID.randomUUID());
                        return entity;
                    });

            // Act
            LicenseImportResponse response = licenseImportService.importLicense(fileBytes, IMPORTER_ID);

            // Assert
            assertThat(response).isNotNull();
            assertThat(response.licenseId()).isEqualTo("LIC-2026-0001");
            assertThat(response.product()).isEqualTo("EMSIST");
            assertThat(response.versionRange()).isEqualTo("1.0.0 - 2.99.99");
            assertThat(response.maxTenants()).isEqualTo(5);
            assertThat(response.features()).contains("basic_workflows", "advanced_reports");
            assertThat(response.gracePeriodDays()).isEqualTo(30);
            assertThat(response.tenantCount()).isEqualTo(1);

            assertThat(licenseStateHolder.getRecomputeCallCount()).isEqualTo(1);
            verify(licenseFileRepository).save(any(LicenseFileEntity.class));
            verify(applicationLicenseRepository, times(2)).save(any(ApplicationLicenseEntity.class));
        }
    }

    @Nested
    @DisplayName("importLicense - signature verification")
    class SignatureVerification {

        @Test
        @DisplayName("Should reject license when signature verification fails")
        void shouldRejectLicense_whenSignatureIsInvalid() {
            // Arrange
            String payloadJson = buildValidPayloadJson();
            byte[] fileBytes = buildLicenseFile(VALID_KID, payloadJson);

            signatureVerifier.setVerifyResult(false);

            // Act & Assert
            assertThatThrownBy(() -> licenseImportService.importLicense(fileBytes, IMPORTER_ID))
                    .isInstanceOf(BusinessException.class)
                    .extracting("code")
                    .isEqualTo("signature_invalid");

            verify(licenseFileRepository, never()).save(any());
            assertThat(licenseStateHolder.getRecomputeCallCount()).isZero();
        }
    }

    @Nested
    @DisplayName("importLicense - file format validation")
    class FileFormatValidation {

        @Test
        @DisplayName("Should reject file with missing KID in header")
        void shouldRejectFile_whenKidIsMissing() {
            // Arrange
            String header = "no-kid-here";
            String signatureBase64 = Base64.getEncoder().encodeToString("sig".getBytes());
            String content = header + "---{\"licenseId\":\"x\"}---" + signatureBase64;
            byte[] fileBytes = content.getBytes(StandardCharsets.UTF_8);

            // Act & Assert
            assertThatThrownBy(() -> licenseImportService.importLicense(fileBytes, IMPORTER_ID))
                    .isInstanceOf(BusinessException.class)
                    .extracting("code")
                    .isEqualTo("missing_kid");
        }

        @Test
        @DisplayName("Should reject file with invalid format (less than 3 sections)")
        void shouldRejectFile_whenFormatIsInvalid() {
            // Arrange
            byte[] fileBytes = "no-separators-here".getBytes(StandardCharsets.UTF_8);

            // Act & Assert
            assertThatThrownBy(() -> licenseImportService.importLicense(fileBytes, IMPORTER_ID))
                    .isInstanceOf(BusinessException.class)
                    .extracting("code")
                    .isEqualTo("invalid_format");
        }

        @Test
        @DisplayName("Should reject file with invalid Base64 signature")
        void shouldRejectFile_whenSignatureIsNotBase64() {
            // Arrange
            String content = "kid: test-key---{\"valid\":\"json\"}---not!!valid!!base64@@";
            byte[] fileBytes = content.getBytes(StandardCharsets.UTF_8);

            // Act & Assert
            assertThatThrownBy(() -> licenseImportService.importLicense(fileBytes, IMPORTER_ID))
                    .isInstanceOf(BusinessException.class)
                    .extracting("code")
                    .isEqualTo("invalid_signature_encoding");
        }
    }

    @Nested
    @DisplayName("importLicense - payload validation")
    class PayloadValidation {

        @Test
        @DisplayName("Should reject license when product does not match EMSIST")
        void shouldRejectLicense_whenProductMismatches() {
            // Arrange
            String payloadJson = buildPayloadJson("OTHER_PRODUCT", FUTURE_EXPIRY, 5,
                    List.of("basic_workflows"));
            byte[] fileBytes = buildLicenseFile(VALID_KID, payloadJson);

            // signatureVerifier stub defaults to true (set in setUp)

            // Act & Assert
            assertThatThrownBy(() -> licenseImportService.importLicense(fileBytes, IMPORTER_ID))
                    .isInstanceOf(BusinessException.class)
                    .extracting("code")
                    .isEqualTo("product_mismatch");
        }

        @Test
        @DisplayName("Should reject license when expiry date is in the past")
        void shouldRejectLicense_whenExpired() {
            // Arrange
            Instant pastExpiry = Instant.now().minus(10, ChronoUnit.DAYS);
            Instant tenantExpiry = pastExpiry.minus(30, ChronoUnit.DAYS);

            String payloadJson = """
                {
                  "licenseId": "LIC-2026-0001",
                  "formatVersion": "1.0",
                  "issuer": "EMS Corp",
                  "issuedAt": "%s",
                  "customerId": "CUST-001",
                  "customerName": "Test Customer",
                  "product": "EMSIST",
                  "versionMin": "1.0.0",
                  "versionMax": "2.99.99",
                  "maxTenants": 5,
                  "expiresAt": "%s",
                  "features": ["basic_workflows"],
                  "tenants": [
                    {
                      "tenantId": "tenant-1",
                      "displayName": "Tenant One",
                      "expiresAt": "%s",
                      "features": ["basic_workflows"],
                      "seats": { "TENANT_ADMIN": 1, "POWER_USER": 1, "CONTRIBUTOR": 1, "VIEWER": 1 }
                    }
                  ]
                }
                """.formatted(
                    Instant.now().minus(60, ChronoUnit.DAYS).toString(),
                    pastExpiry.toString(),
                    tenantExpiry.toString()
            );
            byte[] fileBytes = buildLicenseFile(VALID_KID, payloadJson);

            // signatureVerifier stub defaults to true (set in setUp)

            // Act & Assert
            assertThatThrownBy(() -> licenseImportService.importLicense(fileBytes, IMPORTER_ID))
                    .isInstanceOf(BusinessException.class)
                    .extracting("code")
                    .isEqualTo("license_expired");
        }

        @Test
        @DisplayName("Should reject license when license ID is on revocation list")
        void shouldRejectLicense_whenRevoked() {
            // Arrange
            String payloadJson = buildValidPayloadJson();
            byte[] fileBytes = buildLicenseFile(VALID_KID, payloadJson);

            // signatureVerifier stub defaults to true (set in setUp)
            given(revocationEntryRepository.existsByRevokedLicenseId("LIC-2026-0001"))
                    .willReturn(true);

            // Act & Assert
            assertThatThrownBy(() -> licenseImportService.importLicense(fileBytes, IMPORTER_ID))
                    .isInstanceOf(BusinessException.class)
                    .extracting("code")
                    .isEqualTo("license_revoked");
        }

        @Test
        @DisplayName("Should reject license when tenant count exceeds maxTenants")
        void shouldRejectLicense_whenTooManyTenants() {
            // Arrange
            String payloadJson = buildPayloadJson("EMSIST", FUTURE_EXPIRY, 0,
                    List.of("basic_workflows"));
            byte[] fileBytes = buildLicenseFile(VALID_KID, payloadJson);

            // signatureVerifier stub defaults to true (set in setUp)
            given(revocationEntryRepository.existsByRevokedLicenseId("LIC-2026-0001"))
                    .willReturn(false);

            // Act & Assert
            assertThatThrownBy(() -> licenseImportService.importLicense(fileBytes, IMPORTER_ID))
                    .isInstanceOf(BusinessException.class)
                    .extracting("code")
                    .isEqualTo("too_many_tenants");
        }

        @Test
        @DisplayName("Should reject license when required field is missing")
        void shouldRejectLicense_whenRequiredFieldMissing() {
            // Arrange
            String payloadJson = """
                {
                  "formatVersion": "1.0",
                  "issuer": "EMS Corp",
                  "issuedAt": "%s"
                }
                """.formatted(Instant.now().toString());
            byte[] fileBytes = buildLicenseFile(VALID_KID, payloadJson);

            // signatureVerifier stub defaults to true (set in setUp)

            // Act & Assert
            assertThatThrownBy(() -> licenseImportService.importLicense(fileBytes, IMPORTER_ID))
                    .isInstanceOf(BusinessException.class)
                    .extracting("code")
                    .isEqualTo("missing_field");
        }

        @Test
        @DisplayName("Should reject license when payload is not valid JSON")
        void shouldRejectLicense_whenPayloadIsInvalidJson() {
            // Arrange
            byte[] fileBytes = buildLicenseFile(VALID_KID, "not-valid-json{{{");

            // signatureVerifier stub defaults to true (set in setUp)

            // Act & Assert
            assertThatThrownBy(() -> licenseImportService.importLicense(fileBytes, IMPORTER_ID))
                    .isInstanceOf(BusinessException.class)
                    .extracting("code")
                    .isEqualTo("invalid_payload");
        }
    }

    @Nested
    @DisplayName("importLicense - tenant license validation")
    class TenantLicenseValidation {

        @Test
        @DisplayName("Should reject license when tenant expiry exceeds application expiry")
        void shouldRejectLicense_whenTenantExpiryExceedsAppExpiry() {
            // Arrange
            Instant appExpiry = Instant.now().plus(100, ChronoUnit.DAYS);
            Instant tenantExpiry = appExpiry.plus(30, ChronoUnit.DAYS);

            String payloadJson = """
                {
                  "licenseId": "LIC-2026-0001",
                  "formatVersion": "1.0",
                  "issuer": "EMS Corp",
                  "issuedAt": "%s",
                  "customerId": "CUST-001",
                  "customerName": "Test Customer",
                  "product": "EMSIST",
                  "versionMin": "1.0.0",
                  "versionMax": "2.99.99",
                  "maxTenants": 5,
                  "expiresAt": "%s",
                  "features": ["basic_workflows"],
                  "tenants": [
                    {
                      "tenantId": "tenant-1",
                      "displayName": "Tenant One",
                      "expiresAt": "%s",
                      "features": ["basic_workflows"],
                      "seats": { "TENANT_ADMIN": 1, "POWER_USER": 1, "CONTRIBUTOR": 1, "VIEWER": 1 }
                    }
                  ]
                }
                """.formatted(
                    Instant.now().minus(1, ChronoUnit.DAYS).toString(),
                    appExpiry.toString(),
                    tenantExpiry.toString()
            );
            byte[] fileBytes = buildLicenseFile(VALID_KID, payloadJson);

            // signatureVerifier stub defaults to true (set in setUp)
            given(revocationEntryRepository.existsByRevokedLicenseId("LIC-2026-0001"))
                    .willReturn(false);
            given(licenseFileRepository.findByImportStatus(LicenseImportStatus.ACTIVE))
                    .willReturn(Collections.emptyList());
            given(licenseFileRepository.save(any(LicenseFileEntity.class)))
                    .willAnswer(inv -> {
                        LicenseFileEntity entity = inv.getArgument(0);
                        entity.setId(UUID.randomUUID());
                        entity.setCreatedAt(Instant.now());
                        return entity;
                    });
            given(applicationLicenseRepository.save(any(ApplicationLicenseEntity.class)))
                    .willAnswer(inv -> {
                        ApplicationLicenseEntity entity = inv.getArgument(0);
                        entity.setId(UUID.randomUUID());
                        return entity;
                    });

            // Act & Assert
            assertThatThrownBy(() -> licenseImportService.importLicense(fileBytes, IMPORTER_ID))
                    .isInstanceOf(BusinessException.class)
                    .extracting("code")
                    .isEqualTo("tenant_expiry_exceeds");
        }

        @Test
        @DisplayName("Should reject license when tenant has feature not in application feature set")
        void shouldRejectLicense_whenTenantFeatureNotInAppSet() {
            // Arrange
            Instant appExpiry = Instant.now().plus(100, ChronoUnit.DAYS);
            Instant tenantExpiry = appExpiry.minus(30, ChronoUnit.DAYS);

            String payloadJson = """
                {
                  "licenseId": "LIC-2026-0001",
                  "formatVersion": "1.0",
                  "issuer": "EMS Corp",
                  "issuedAt": "%s",
                  "customerId": "CUST-001",
                  "customerName": "Test Customer",
                  "product": "EMSIST",
                  "versionMin": "1.0.0",
                  "versionMax": "2.99.99",
                  "maxTenants": 5,
                  "expiresAt": "%s",
                  "features": ["basic_workflows"],
                  "tenants": [
                    {
                      "tenantId": "tenant-1",
                      "displayName": "Tenant One",
                      "expiresAt": "%s",
                      "features": ["basic_workflows", "unlicensed_feature"],
                      "seats": { "TENANT_ADMIN": 1, "POWER_USER": 1, "CONTRIBUTOR": 1, "VIEWER": 1 }
                    }
                  ]
                }
                """.formatted(
                    Instant.now().minus(1, ChronoUnit.DAYS).toString(),
                    appExpiry.toString(),
                    tenantExpiry.toString()
            );
            byte[] fileBytes = buildLicenseFile(VALID_KID, payloadJson);

            // signatureVerifier stub defaults to true (set in setUp)
            given(revocationEntryRepository.existsByRevokedLicenseId("LIC-2026-0001"))
                    .willReturn(false);
            given(licenseFileRepository.findByImportStatus(LicenseImportStatus.ACTIVE))
                    .willReturn(Collections.emptyList());
            given(licenseFileRepository.save(any(LicenseFileEntity.class)))
                    .willAnswer(inv -> {
                        LicenseFileEntity entity = inv.getArgument(0);
                        entity.setId(UUID.randomUUID());
                        entity.setCreatedAt(Instant.now());
                        return entity;
                    });
            given(applicationLicenseRepository.save(any(ApplicationLicenseEntity.class)))
                    .willAnswer(inv -> {
                        ApplicationLicenseEntity entity = inv.getArgument(0);
                        entity.setId(UUID.randomUUID());
                        return entity;
                    });

            // Act & Assert
            assertThatThrownBy(() -> licenseImportService.importLicense(fileBytes, IMPORTER_ID))
                    .isInstanceOf(BusinessException.class)
                    .extracting("code")
                    .isEqualTo("tenant_feature_not_in_app");
        }

        @Test
        @DisplayName("Should reject license when no tenants array present")
        void shouldRejectLicense_whenNoTenantsArray() {
            // Arrange
            String payloadJson = """
                {
                  "licenseId": "LIC-2026-0001",
                  "formatVersion": "1.0",
                  "issuer": "EMS Corp",
                  "issuedAt": "%s",
                  "customerId": "CUST-001",
                  "customerName": "Test Customer",
                  "product": "EMSIST",
                  "versionMin": "1.0.0",
                  "versionMax": "2.99.99",
                  "maxTenants": 5,
                  "expiresAt": "%s",
                  "features": ["basic_workflows"]
                }
                """.formatted(
                    Instant.now().minus(1, ChronoUnit.DAYS).toString(),
                    FUTURE_EXPIRY.toString()
            );
            byte[] fileBytes = buildLicenseFile(VALID_KID, payloadJson);

            // signatureVerifier stub defaults to true (set in setUp)
            given(revocationEntryRepository.existsByRevokedLicenseId("LIC-2026-0001"))
                    .willReturn(false);

            // Act & Assert
            assertThatThrownBy(() -> licenseImportService.importLicense(fileBytes, IMPORTER_ID))
                    .isInstanceOf(BusinessException.class)
                    .extracting("code")
                    .isEqualTo("no_tenants");
        }

        @Test
        @DisplayName("Should reject license when tenant TENANT_ADMIN seat count is 0")
        void shouldRejectLicense_whenTenantAdminSeatIsZero() {
            // Arrange
            Instant appExpiry = Instant.now().plus(100, ChronoUnit.DAYS);
            Instant tenantExpiry = appExpiry.minus(30, ChronoUnit.DAYS);

            String payloadJson = """
                {
                  "licenseId": "LIC-2026-0001",
                  "formatVersion": "1.0",
                  "issuer": "EMS Corp",
                  "issuedAt": "%s",
                  "customerId": "CUST-001",
                  "customerName": "Test Customer",
                  "product": "EMSIST",
                  "versionMin": "1.0.0",
                  "versionMax": "2.99.99",
                  "maxTenants": 5,
                  "expiresAt": "%s",
                  "features": ["basic_workflows"],
                  "tenants": [
                    {
                      "tenantId": "tenant-1",
                      "displayName": "Tenant One",
                      "expiresAt": "%s",
                      "features": ["basic_workflows"],
                      "seats": { "TENANT_ADMIN": 0, "POWER_USER": 5, "CONTRIBUTOR": 10, "VIEWER": -1 }
                    }
                  ]
                }
                """.formatted(
                    Instant.now().minus(1, ChronoUnit.DAYS).toString(),
                    appExpiry.toString(),
                    tenantExpiry.toString()
            );
            byte[] fileBytes = buildLicenseFile(VALID_KID, payloadJson);

            // signatureVerifier stub defaults to true (set in setUp)
            given(revocationEntryRepository.existsByRevokedLicenseId("LIC-2026-0001"))
                    .willReturn(false);
            given(licenseFileRepository.findByImportStatus(LicenseImportStatus.ACTIVE))
                    .willReturn(Collections.emptyList());
            given(licenseFileRepository.save(any(LicenseFileEntity.class)))
                    .willAnswer(inv -> {
                        LicenseFileEntity entity = inv.getArgument(0);
                        entity.setId(UUID.randomUUID());
                        entity.setCreatedAt(Instant.now());
                        return entity;
                    });
            given(applicationLicenseRepository.save(any(ApplicationLicenseEntity.class)))
                    .willAnswer(inv -> {
                        ApplicationLicenseEntity entity = inv.getArgument(0);
                        entity.setId(UUID.randomUUID());
                        return entity;
                    });

            // Act & Assert
            assertThatThrownBy(() -> licenseImportService.importLicense(fileBytes, IMPORTER_ID))
                    .isInstanceOf(BusinessException.class)
                    .extracting("code")
                    .isEqualTo("tenant_admin_required");
        }
    }

    @Nested
    @DisplayName("importLicense - superseding behavior")
    class SupersedingBehavior {

        @Test
        @DisplayName("Should supersede previous active license on new import")
        void shouldSupersedePreviousLicense_whenNewImported() {
            // Arrange
            LicenseFileEntity previousActive = LicenseFileEntity.builder()
                    .id(UUID.randomUUID())
                    .licenseId("LIC-OLD-0001")
                    .importStatus(LicenseImportStatus.ACTIVE)
                    .build();

            String payloadJson = buildValidPayloadJson();
            byte[] fileBytes = buildLicenseFile(VALID_KID, payloadJson);

            // signatureVerifier stub defaults to true (set in setUp)
            given(revocationEntryRepository.existsByRevokedLicenseId("LIC-2026-0001"))
                    .willReturn(false);
            given(licenseFileRepository.findByImportStatus(LicenseImportStatus.ACTIVE))
                    .willReturn(List.of(previousActive));
            given(licenseFileRepository.save(any(LicenseFileEntity.class)))
                    .willAnswer(inv -> {
                        LicenseFileEntity entity = inv.getArgument(0);
                        if (entity.getId() == null) {
                            entity.setId(UUID.randomUUID());
                            entity.setCreatedAt(Instant.now());
                        }
                        return entity;
                    });
            given(applicationLicenseRepository.save(any(ApplicationLicenseEntity.class)))
                    .willAnswer(inv -> {
                        ApplicationLicenseEntity entity = inv.getArgument(0);
                        entity.setId(UUID.randomUUID());
                        return entity;
                    });

            // Act
            licenseImportService.importLicense(fileBytes, IMPORTER_ID);

            // Assert
            assertThat(previousActive.getImportStatus()).isEqualTo(LicenseImportStatus.SUPERSEDED);
            verify(licenseFileRepository, atLeast(2)).save(any(LicenseFileEntity.class));
        }
    }

    @Nested
    @DisplayName("reimportFromStorage")
    class ReimportFromStorage {

        @Test
        @DisplayName("Should recompute license state on startup")
        void shouldRecomputeState_onStartup() {
            // Act
            licenseImportService.reimportFromStorage();

            // Assert
            assertThat(licenseStateHolder.getRecomputeCallCount()).isEqualTo(1);
        }
    }
}
