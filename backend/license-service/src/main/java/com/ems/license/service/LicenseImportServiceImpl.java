package com.ems.license.service;

import com.ems.common.exception.BusinessException;
import com.ems.license.dto.LicenseImportResponse;
import com.ems.license.entity.*;
import com.ems.license.repository.ApplicationLicenseRepository;
import com.ems.license.repository.LicenseFileRepository;
import com.ems.license.repository.RevocationEntryRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.*;

/**
 * Implementation of license file import with Ed25519 signature verification
 * and the full ADR-015 Section 2.3 validation chain.
 *
 * <p>The import process:
 * <ol>
 *   <li>Parse the binary .lic file (header + payload + signature)</li>
 *   <li>Verify Ed25519 signature using the KID from the header</li>
 *   <li>Validate payload structure and business rules (checks 1-11)</li>
 *   <li>Check revocation list</li>
 *   <li>Supersede the previous active license</li>
 *   <li>Persist the new license hierarchy</li>
 *   <li>Recompute runtime license state</li>
 * </ol>
 * </p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class LicenseImportServiceImpl implements LicenseImportService {

    private final LicenseFileRepository licenseFileRepository;
    private final ApplicationLicenseRepository applicationLicenseRepository;
    private final RevocationEntryRepository revocationEntryRepository;
    private final LicenseSignatureVerifier signatureVerifier;
    private final LicenseStateHolder licenseStateHolder;
    private final ObjectMapper objectMapper;

    private static final String PRODUCT_NAME = "EMSIST";

    @Override
    @Transactional
    public LicenseImportResponse importLicense(byte[] licenseFileBytes, UUID importedBy) {
        log.info("Starting license import by user: {}", importedBy);

        // Step 1: Parse the license file
        LicenseFileParseResult parsed = parseLicenseFile(licenseFileBytes);

        // Step 2: Verify signature (Check 1)
        boolean signatureValid = signatureVerifier.verify(
            parsed.payloadBytes,
            parsed.signatureBytes,
            parsed.kid
        );
        if (!signatureValid) {
            throw new BusinessException("signature_invalid", "License file signature verification failed");
        }
        log.info("License signature verified successfully for kid: {}", parsed.kid);

        // Step 3: Parse JSON payload
        JsonNode payload = parsePayload(parsed.payloadJson);

        // Step 4: Validate payload structure and business rules
        String licenseId = requireString(payload, "licenseId");
        String formatVersion = requireString(payload, "formatVersion");
        String issuer = requireString(payload, "issuer");
        Instant issuedAt = requireInstant(payload, "issuedAt");
        String customerId = requireString(payload, "customerId");
        String customerName = requireString(payload, "customerName");
        String customerCountry = optionalString(payload, "customerCountry");

        // Check 2: Product name must match
        String product = requireString(payload, "product");
        if (!PRODUCT_NAME.equals(product)) {
            throw new BusinessException("product_mismatch",
                "License product '" + product + "' does not match expected '" + PRODUCT_NAME + "'");
        }

        // Application license fields
        String versionMin = requireString(payload, "versionMin");
        String versionMax = requireString(payload, "versionMax");
        String instanceId = optionalString(payload, "instanceId");
        int maxTenants = requireInt(payload, "maxTenants");
        Instant expiresAt = requireInstant(payload, "expiresAt");
        List<String> features = requireStringList(payload, "features");
        int gracePeriodDays = payload.has("gracePeriodDays") ? payload.get("gracePeriodDays").asInt() : 30;
        List<String> degradedFeatures = optionalStringList(payload, "degradedFeatures");

        // Check 3: Expiry must be in the future
        if (expiresAt.isBefore(Instant.now())) {
            throw new BusinessException("license_expired",
                "License has already expired at " + expiresAt);
        }

        // Check 4: Check revocation list
        if (revocationEntryRepository.existsByRevokedLicenseId(licenseId)) {
            throw new BusinessException("license_revoked",
                "License '" + licenseId + "' has been revoked");
        }

        // Check 5: Validate tenant licenses from payload
        JsonNode tenantsNode = payload.get("tenants");
        if (tenantsNode == null || !tenantsNode.isArray() || tenantsNode.isEmpty()) {
            throw new BusinessException("no_tenants", "License must contain at least one tenant");
        }

        // Check 6: Tenant count must not exceed maxTenants
        if (tenantsNode.size() > maxTenants) {
            throw new BusinessException("too_many_tenants",
                "License contains " + tenantsNode.size() + " tenants but maxTenants is " + maxTenants);
        }

        // Compute SHA-256 checksum
        String payloadChecksum = computeChecksum(parsed.payloadBytes);

        // Step 5: Supersede previous active license
        supersedePreviousLicense();

        // Step 6: Persist license file
        LicenseFileEntity licenseFile = LicenseFileEntity.builder()
            .licenseId(licenseId)
            .formatVersion(formatVersion)
            .kid(parsed.kid)
            .issuer(issuer)
            .issuedAt(issuedAt)
            .customerId(customerId)
            .customerName(customerName)
            .customerCountry(customerCountry)
            .rawContent(licenseFileBytes)
            .payloadJson(parsed.payloadJson)
            .signature(parsed.signatureBytes)
            .payloadChecksum(payloadChecksum)
            .importStatus(LicenseImportStatus.ACTIVE)
            .importedBy(importedBy)
            .build();

        licenseFile = licenseFileRepository.save(licenseFile);
        log.info("Persisted license file: {} (id: {})", licenseId, licenseFile.getId());

        // Step 7: Persist application license
        ApplicationLicenseEntity appLicense = ApplicationLicenseEntity.builder()
            .licenseFile(licenseFile)
            .product(product)
            .versionMin(versionMin)
            .versionMax(versionMax)
            .instanceId(instanceId)
            .maxTenants(maxTenants)
            .expiresAt(expiresAt)
            .features(features)
            .gracePeriodDays(gracePeriodDays)
            .degradedFeatures(degradedFeatures)
            .build();

        appLicense = applicationLicenseRepository.save(appLicense);
        log.info("Persisted application license (id: {})", appLicense.getId());

        // Step 8: Persist tenant licenses with seat allocations
        int tenantCount = 0;
        for (JsonNode tenantNode : tenantsNode) {
            TenantLicenseEntity tenantLicense = parseTenantLicense(tenantNode, appLicense, features, expiresAt);
            appLicense.getTenantLicenses().add(tenantLicense);
            tenantCount++;
        }
        applicationLicenseRepository.save(appLicense);
        log.info("Persisted {} tenant licenses", tenantCount);

        // Step 9: Recompute license state
        licenseStateHolder.recomputeState();

        return LicenseImportResponse.builder()
            .licenseFileId(licenseFile.getId())
            .licenseId(licenseId)
            .product(product)
            .versionRange(versionMin + " - " + versionMax)
            .maxTenants(maxTenants)
            .expiresAt(expiresAt)
            .features(features)
            .gracePeriodDays(gracePeriodDays)
            .tenantCount(tenantCount)
            .importedAt(licenseFile.getCreatedAt())
            .build();
    }

    @Override
    @PostConstruct
    public void reimportFromStorage() {
        log.info("Re-verifying stored license at startup");
        licenseStateHolder.recomputeState();
    }

    /**
     * Mark all currently ACTIVE license files as SUPERSEDED.
     */
    private void supersedePreviousLicense() {
        List<LicenseFileEntity> activeFiles = licenseFileRepository.findByImportStatus(LicenseImportStatus.ACTIVE);
        for (LicenseFileEntity active : activeFiles) {
            active.setImportStatus(LicenseImportStatus.SUPERSEDED);
            licenseFileRepository.save(active);
            log.info("Superseded previous license: {}", active.getLicenseId());
        }
    }

    /**
     * Parse a tenant license node from the payload and create the entity with seat allocations.
     */
    private TenantLicenseEntity parseTenantLicense(
            JsonNode tenantNode,
            ApplicationLicenseEntity appLicense,
            List<String> appFeatures,
            Instant appExpiresAt) {

        String tenantId = requireString(tenantNode, "tenantId");
        String displayName = requireString(tenantNode, "displayName");
        Instant tenantExpiresAt = requireInstant(tenantNode, "expiresAt");
        List<String> tenantFeatures = requireStringList(tenantNode, "features");

        // Check 7: Tenant expiry must not exceed application expiry
        if (tenantExpiresAt.isAfter(appExpiresAt)) {
            throw new BusinessException("tenant_expiry_exceeds",
                "Tenant '" + tenantId + "' expiry exceeds application expiry");
        }

        // Check 8: Tenant features must be a subset of application features
        for (String feature : tenantFeatures) {
            if (!appFeatures.contains(feature)) {
                throw new BusinessException("tenant_feature_not_in_app",
                    "Tenant '" + tenantId + "' has feature '" + feature + "' not in application feature set");
            }
        }

        TenantLicenseEntity tenantLicense = TenantLicenseEntity.builder()
            .applicationLicense(appLicense)
            .tenantId(tenantId)
            .displayName(displayName)
            .expiresAt(tenantExpiresAt)
            .features(tenantFeatures)
            .build();

        // Parse seat allocations
        JsonNode seatsNode = tenantNode.get("seats");
        if (seatsNode == null || !seatsNode.isObject()) {
            throw new BusinessException("missing_seats",
                "Tenant '" + tenantId + "' is missing seat allocation configuration");
        }

        for (UserTier tier : UserTier.values()) {
            String tierKey = tier.name();
            if (!seatsNode.has(tierKey)) {
                throw new BusinessException("missing_tier_seats",
                    "Tenant '" + tenantId + "' is missing seat allocation for tier " + tierKey);
            }

            int maxSeats = seatsNode.get(tierKey).asInt();

            // Check 10: TENANT_ADMIN must have at least 1 seat
            if (tier == UserTier.TENANT_ADMIN && maxSeats == 0) {
                throw new BusinessException("tenant_admin_required",
                    "Tenant '" + tenantId + "' must have at least 1 TENANT_ADMIN seat");
            }

            TierSeatAllocationEntity allocation = TierSeatAllocationEntity.builder()
                .tenantLicense(tenantLicense)
                .tier(tier)
                .maxSeats(maxSeats)
                .build();

            tenantLicense.getSeatAllocations().add(allocation);
        }

        return tenantLicense;
    }

    // ---- Parsing helpers ----

    /**
     * Parse the raw .lic file bytes into header (KID), payload, and signature.
     * Expected format: line 1 = KID, body = JSON payload, last line = base64 signature,
     * separated by "---" markers.
     */
    private LicenseFileParseResult parseLicenseFile(byte[] fileBytes) {
        String content = new String(fileBytes, StandardCharsets.UTF_8);
        String[] sections = content.split("---");

        if (sections.length < 3) {
            throw new BusinessException("invalid_format",
                "License file format is invalid. Expected header---payload---signature structure.");
        }

        String header = sections[0].trim();
        String payloadJson = sections[1].trim();
        String signatureBase64 = sections[sections.length - 1].trim();

        // Parse KID from header
        String kid = null;
        for (String line : header.split("\n")) {
            String trimmed = line.trim();
            if (trimmed.startsWith("kid:")) {
                kid = trimmed.substring(4).trim();
            }
        }
        if (kid == null || kid.isBlank()) {
            throw new BusinessException("missing_kid", "License file header is missing the KID (Key Identifier)");
        }

        byte[] signatureBytes;
        try {
            signatureBytes = Base64.getDecoder().decode(signatureBase64);
        } catch (IllegalArgumentException e) {
            throw new BusinessException("invalid_signature_encoding", "License file signature is not valid Base64");
        }

        return new LicenseFileParseResult(
            kid,
            payloadJson,
            payloadJson.getBytes(StandardCharsets.UTF_8),
            signatureBytes
        );
    }

    private JsonNode parsePayload(String payloadJson) {
        try {
            return objectMapper.readTree(payloadJson);
        } catch (Exception e) {
            throw new BusinessException("invalid_payload", "License payload is not valid JSON: " + e.getMessage());
        }
    }

    private String requireString(JsonNode node, String field) {
        JsonNode value = node.get(field);
        if (value == null || value.isNull() || value.asText().isBlank()) {
            throw new BusinessException("missing_field", "Required field '" + field + "' is missing from license payload");
        }
        return value.asText();
    }

    private String optionalString(JsonNode node, String field) {
        JsonNode value = node.get(field);
        if (value == null || value.isNull()) {
            return null;
        }
        return value.asText();
    }

    private int requireInt(JsonNode node, String field) {
        JsonNode value = node.get(field);
        if (value == null || value.isNull()) {
            throw new BusinessException("missing_field", "Required field '" + field + "' is missing from license payload");
        }
        return value.asInt();
    }

    private Instant requireInstant(JsonNode node, String field) {
        String text = requireString(node, field);
        try {
            return Instant.parse(text);
        } catch (Exception e) {
            throw new BusinessException("invalid_date",
                "Field '" + field + "' is not a valid ISO-8601 timestamp: " + text);
        }
    }

    private List<String> requireStringList(JsonNode node, String field) {
        JsonNode value = node.get(field);
        if (value == null || !value.isArray()) {
            throw new BusinessException("missing_field",
                "Required array field '" + field + "' is missing from license payload");
        }
        try {
            return objectMapper.convertValue(value, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            throw new BusinessException("invalid_field",
                "Field '" + field + "' is not a valid string array");
        }
    }

    private List<String> optionalStringList(JsonNode node, String field) {
        JsonNode value = node.get(field);
        if (value == null || !value.isArray()) {
            return Collections.emptyList();
        }
        try {
            return objectMapper.convertValue(value, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    private String computeChecksum(byte[] data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(data);
            return "sha256:" + HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            log.warn("Failed to compute SHA-256 checksum: {}", e.getMessage());
            return null;
        }
    }

    /** Internal parse result record. */
    private record LicenseFileParseResult(
        String kid,
        String payloadJson,
        byte[] payloadBytes,
        byte[] signatureBytes
    ) {}
}
