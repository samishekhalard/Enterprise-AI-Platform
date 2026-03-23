package com.ems.license.service;

import com.ems.license.entity.*;
import com.ems.license.repository.ApplicationLicenseRepository;
import com.ems.license.repository.LicenseFileRepository;
import com.ems.license.repository.RevocationEntryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Runtime singleton that holds the current {@link LicenseState}.
 *
 * <p>The state is computed from the active license file, its signature validity,
 * expiry date, and grace period. It is re-evaluated:</p>
 * <ul>
 *   <li>At application startup</li>
 *   <li>After every license import</li>
 *   <li>Daily at midnight via {@code @Scheduled}</li>
 * </ul>
 *
 * <p>State machine (from ADR-015):</p>
 * <pre>
 * UNLICENSED -> ACTIVE -> GRACE -> EXPIRED
 *                   \        \
 *                    +---------+--> TAMPERED
 * </pre>
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class LicenseStateHolder {

    private final LicenseFileRepository licenseFileRepository;
    private final ApplicationLicenseRepository applicationLicenseRepository;
    private final RevocationEntryRepository revocationEntryRepository;
    private final LicenseSignatureVerifier signatureVerifier;

    private final AtomicReference<LicenseState> currentState = new AtomicReference<>(LicenseState.UNLICENSED);

    /**
     * Returns the current runtime license state.
     *
     * @return the current {@link LicenseState}
     */
    public LicenseState getCurrentState() {
        return currentState.get();
    }

    /**
     * Recomputes the license state from the database.
     * Called after license import and at scheduled intervals.
     */
    @Transactional(readOnly = true)
    public void recomputeState() {
        log.debug("Recomputing license state");

        List<LicenseFileEntity> activeFiles = licenseFileRepository.findByImportStatus(LicenseImportStatus.ACTIVE);

        if (activeFiles.isEmpty()) {
            log.info("No active license file found. State: UNLICENSED");
            currentState.set(LicenseState.UNLICENSED);
            return;
        }

        LicenseFileEntity activeFile = activeFiles.getFirst();

        // Check revocation
        if (revocationEntryRepository.existsByRevokedLicenseId(activeFile.getLicenseId())) {
            log.warn("Active license {} has been revoked. State: TAMPERED", activeFile.getLicenseId());
            currentState.set(LicenseState.TAMPERED);
            return;
        }

        // Verify signature
        boolean signatureValid = signatureVerifier.verify(
            activeFile.getPayloadJson().getBytes(),
            activeFile.getSignature(),
            activeFile.getKid()
        );

        if (!signatureValid) {
            log.error("Signature verification failed for active license {}. State: TAMPERED",
                activeFile.getLicenseId());
            currentState.set(LicenseState.TAMPERED);
            return;
        }

        // Get application license for expiry information
        ApplicationLicenseEntity appLicense = applicationLicenseRepository
            .findByLicenseFileId(activeFile.getId())
            .orElse(null);

        if (appLicense == null) {
            log.error("Active license file {} has no associated application license. State: TAMPERED",
                activeFile.getLicenseId());
            currentState.set(LicenseState.TAMPERED);
            return;
        }

        Instant now = Instant.now();
        Instant expiresAt = appLicense.getExpiresAt();
        Instant graceEndsAt = expiresAt.plus(appLicense.getGracePeriodDays(), ChronoUnit.DAYS);

        if (now.isBefore(expiresAt)) {
            log.info("License {} is active. Expires at: {}", activeFile.getLicenseId(), expiresAt);
            currentState.set(LicenseState.ACTIVE);
        } else if (now.isBefore(graceEndsAt)) {
            log.warn("License {} is in grace period. Expired at: {}, Grace ends: {}",
                activeFile.getLicenseId(), expiresAt, graceEndsAt);
            currentState.set(LicenseState.GRACE);
        } else {
            log.warn("License {} has expired. Expired at: {}, Grace ended: {}",
                activeFile.getLicenseId(), expiresAt, graceEndsAt);
            currentState.set(LicenseState.EXPIRED);
        }
    }

    /**
     * Scheduled daily re-evaluation of license state.
     * Runs at midnight every day.
     */
    @Scheduled(cron = "0 0 0 * * *")
    public void scheduledRecompute() {
        log.info("Scheduled daily license state re-evaluation");
        recomputeState();
    }
}
