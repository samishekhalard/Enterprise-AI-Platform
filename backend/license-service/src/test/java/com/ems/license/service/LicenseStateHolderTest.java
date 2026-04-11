package com.ems.license.service;

import com.ems.license.entity.*;
import com.ems.license.repository.ApplicationLicenseRepository;
import com.ems.license.repository.LicenseFileRepository;
import com.ems.license.repository.RevocationEntryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
@DisplayName("LicenseStateHolder")
class LicenseStateHolderTest {

    @Mock
    private LicenseFileRepository licenseFileRepository;

    @Mock
    private ApplicationLicenseRepository applicationLicenseRepository;

    @Mock
    private RevocationEntryRepository revocationEntryRepository;

    private TestLicenseSignatureVerifier signatureVerifier;

    private LicenseStateHolder licenseStateHolder;

    @BeforeEach
    void setUp() {
        signatureVerifier = new TestLicenseSignatureVerifier(true);
        licenseStateHolder = new LicenseStateHolder(
                licenseFileRepository,
                applicationLicenseRepository,
                revocationEntryRepository,
                signatureVerifier
        );
    }

    private LicenseFileEntity buildActiveFile(String licenseId) {
        return LicenseFileEntity.builder()
                .id(UUID.randomUUID())
                .licenseId(licenseId)
                .kid("key-001")
                .payloadJson("{\"test\":\"payload\"}")
                .signature("test-sig".getBytes())
                .importStatus(LicenseImportStatus.ACTIVE)
                .build();
    }

    private ApplicationLicenseEntity buildAppLicense(UUID licenseFileId, Instant expiresAt, int gracePeriodDays) {
        return ApplicationLicenseEntity.builder()
                .id(UUID.randomUUID())
                .expiresAt(expiresAt)
                .gracePeriodDays(gracePeriodDays)
                .build();
    }

    @Nested
    @DisplayName("getCurrentState")
    class GetCurrentState {

        @Test
        @DisplayName("Should return UNLICENSED as initial state")
        void shouldReturnUnlicensed_asInitialState() {
            // Act
            LicenseState state = licenseStateHolder.getCurrentState();

            // Assert
            assertThat(state).isEqualTo(LicenseState.UNLICENSED);
        }
    }

    @Nested
    @DisplayName("recomputeState - UNLICENSED")
    class UnlicensedState {

        @Test
        @DisplayName("Should set state to UNLICENSED when no active license file exists")
        void shouldSetUnlicensed_whenNoActiveFileExists() {
            // Arrange
            given(licenseFileRepository.findByImportStatus(LicenseImportStatus.ACTIVE))
                    .willReturn(Collections.emptyList());

            // Act
            licenseStateHolder.recomputeState();

            // Assert
            assertThat(licenseStateHolder.getCurrentState()).isEqualTo(LicenseState.UNLICENSED);
        }
    }

    @Nested
    @DisplayName("recomputeState - TAMPERED")
    class TamperedState {

        @Test
        @DisplayName("Should set state to TAMPERED when license is on revocation list")
        void shouldSetTampered_whenLicenseIsRevoked() {
            // Arrange
            LicenseFileEntity activeFile = buildActiveFile("LIC-REVOKED");

            given(licenseFileRepository.findByImportStatus(LicenseImportStatus.ACTIVE))
                    .willReturn(List.of(activeFile));
            given(revocationEntryRepository.existsByRevokedLicenseId("LIC-REVOKED"))
                    .willReturn(true);

            // Act
            licenseStateHolder.recomputeState();

            // Assert
            assertThat(licenseStateHolder.getCurrentState()).isEqualTo(LicenseState.TAMPERED);
        }

        @Test
        @DisplayName("Should set state to TAMPERED when signature verification fails")
        void shouldSetTampered_whenSignatureFails() {
            // Arrange
            LicenseFileEntity activeFile = buildActiveFile("LIC-TAMPERED");
            signatureVerifier.setVerifyResult(false);

            given(licenseFileRepository.findByImportStatus(LicenseImportStatus.ACTIVE))
                    .willReturn(List.of(activeFile));
            given(revocationEntryRepository.existsByRevokedLicenseId("LIC-TAMPERED"))
                    .willReturn(false);

            // Act
            licenseStateHolder.recomputeState();

            // Assert
            assertThat(licenseStateHolder.getCurrentState()).isEqualTo(LicenseState.TAMPERED);
        }

        @Test
        @DisplayName("Should set state to TAMPERED when no associated application license exists")
        void shouldSetTampered_whenNoAppLicenseExists() {
            // Arrange
            LicenseFileEntity activeFile = buildActiveFile("LIC-ORPHAN");

            given(licenseFileRepository.findByImportStatus(LicenseImportStatus.ACTIVE))
                    .willReturn(List.of(activeFile));
            given(revocationEntryRepository.existsByRevokedLicenseId("LIC-ORPHAN"))
                    .willReturn(false);
            // signatureVerifier defaults to true
            given(applicationLicenseRepository.findByLicenseFileId(activeFile.getId()))
                    .willReturn(Optional.empty());

            // Act
            licenseStateHolder.recomputeState();

            // Assert
            assertThat(licenseStateHolder.getCurrentState()).isEqualTo(LicenseState.TAMPERED);
        }
    }

    @Nested
    @DisplayName("recomputeState - ACTIVE")
    class ActiveState {

        @Test
        @DisplayName("Should set state to ACTIVE when license is valid and not expired")
        void shouldSetActive_whenLicenseIsValidAndNotExpired() {
            // Arrange
            LicenseFileEntity activeFile = buildActiveFile("LIC-ACTIVE");
            Instant futureExpiry = Instant.now().plus(365, ChronoUnit.DAYS);
            ApplicationLicenseEntity appLicense = buildAppLicense(activeFile.getId(), futureExpiry, 30);

            given(licenseFileRepository.findByImportStatus(LicenseImportStatus.ACTIVE))
                    .willReturn(List.of(activeFile));
            given(revocationEntryRepository.existsByRevokedLicenseId("LIC-ACTIVE"))
                    .willReturn(false);
            // signatureVerifier defaults to true
            given(applicationLicenseRepository.findByLicenseFileId(activeFile.getId()))
                    .willReturn(Optional.of(appLicense));

            // Act
            licenseStateHolder.recomputeState();

            // Assert
            assertThat(licenseStateHolder.getCurrentState()).isEqualTo(LicenseState.ACTIVE);
        }
    }

    @Nested
    @DisplayName("recomputeState - GRACE")
    class GraceState {

        @Test
        @DisplayName("Should set state to GRACE when past expiry but within grace period")
        void shouldSetGrace_whenPastExpiryButWithinGracePeriod() {
            // Arrange
            LicenseFileEntity activeFile = buildActiveFile("LIC-GRACE");
            Instant pastExpiry = Instant.now().minus(5, ChronoUnit.DAYS);
            ApplicationLicenseEntity appLicense = buildAppLicense(activeFile.getId(), pastExpiry, 30);

            given(licenseFileRepository.findByImportStatus(LicenseImportStatus.ACTIVE))
                    .willReturn(List.of(activeFile));
            given(revocationEntryRepository.existsByRevokedLicenseId("LIC-GRACE"))
                    .willReturn(false);
            // signatureVerifier defaults to true
            given(applicationLicenseRepository.findByLicenseFileId(activeFile.getId()))
                    .willReturn(Optional.of(appLicense));

            // Act
            licenseStateHolder.recomputeState();

            // Assert
            assertThat(licenseStateHolder.getCurrentState()).isEqualTo(LicenseState.GRACE);
        }
    }

    @Nested
    @DisplayName("recomputeState - EXPIRED")
    class ExpiredState {

        @Test
        @DisplayName("Should set state to EXPIRED when past expiry and grace period")
        void shouldSetExpired_whenPastExpiryAndGracePeriod() {
            // Arrange
            LicenseFileEntity activeFile = buildActiveFile("LIC-EXPIRED");
            Instant pastExpiry = Instant.now().minus(60, ChronoUnit.DAYS);
            ApplicationLicenseEntity appLicense = buildAppLicense(activeFile.getId(), pastExpiry, 30);

            given(licenseFileRepository.findByImportStatus(LicenseImportStatus.ACTIVE))
                    .willReturn(List.of(activeFile));
            given(revocationEntryRepository.existsByRevokedLicenseId("LIC-EXPIRED"))
                    .willReturn(false);
            // signatureVerifier defaults to true
            given(applicationLicenseRepository.findByLicenseFileId(activeFile.getId()))
                    .willReturn(Optional.of(appLicense));

            // Act
            licenseStateHolder.recomputeState();

            // Assert
            assertThat(licenseStateHolder.getCurrentState()).isEqualTo(LicenseState.EXPIRED);
        }
    }

    @Nested
    @DisplayName("State transitions")
    class StateTransitions {

        @Test
        @DisplayName("Should transition from UNLICENSED to ACTIVE after valid license import")
        void shouldTransitionFromUnlicensedToActive() {
            // Arrange
            assertThat(licenseStateHolder.getCurrentState()).isEqualTo(LicenseState.UNLICENSED);

            LicenseFileEntity activeFile = buildActiveFile("LIC-NEW");
            Instant futureExpiry = Instant.now().plus(365, ChronoUnit.DAYS);
            ApplicationLicenseEntity appLicense = buildAppLicense(activeFile.getId(), futureExpiry, 30);

            given(licenseFileRepository.findByImportStatus(LicenseImportStatus.ACTIVE))
                    .willReturn(List.of(activeFile));
            given(revocationEntryRepository.existsByRevokedLicenseId("LIC-NEW"))
                    .willReturn(false);
            // signatureVerifier defaults to true
            given(applicationLicenseRepository.findByLicenseFileId(activeFile.getId()))
                    .willReturn(Optional.of(appLicense));

            // Act
            licenseStateHolder.recomputeState();

            // Assert
            assertThat(licenseStateHolder.getCurrentState()).isEqualTo(LicenseState.ACTIVE);
        }

        @Test
        @DisplayName("Should transition from ACTIVE to GRACE when license expires")
        void shouldTransitionFromActiveToGrace() {
            // Arrange - first set ACTIVE
            LicenseFileEntity activeFile = buildActiveFile("LIC-TRANSITION");
            Instant futureExpiry = Instant.now().plus(365, ChronoUnit.DAYS);
            ApplicationLicenseEntity appLicense = buildAppLicense(activeFile.getId(), futureExpiry, 30);

            given(licenseFileRepository.findByImportStatus(LicenseImportStatus.ACTIVE))
                    .willReturn(List.of(activeFile));
            given(revocationEntryRepository.existsByRevokedLicenseId("LIC-TRANSITION"))
                    .willReturn(false);
            // signatureVerifier defaults to true
            given(applicationLicenseRepository.findByLicenseFileId(activeFile.getId()))
                    .willReturn(Optional.of(appLicense));

            licenseStateHolder.recomputeState();
            assertThat(licenseStateHolder.getCurrentState()).isEqualTo(LicenseState.ACTIVE);

            // Now simulate expiry
            Instant pastExpiry = Instant.now().minus(5, ChronoUnit.DAYS);
            appLicense.setExpiresAt(pastExpiry);

            // Act
            licenseStateHolder.recomputeState();

            // Assert
            assertThat(licenseStateHolder.getCurrentState()).isEqualTo(LicenseState.GRACE);
        }

        @Test
        @DisplayName("Should transition from GRACE to EXPIRED when grace period ends")
        void shouldTransitionFromGraceToExpired() {
            // Arrange
            LicenseFileEntity activeFile = buildActiveFile("LIC-GRACE-END");
            Instant pastExpiry = Instant.now().minus(60, ChronoUnit.DAYS);
            ApplicationLicenseEntity appLicense = buildAppLicense(activeFile.getId(), pastExpiry, 30);

            given(licenseFileRepository.findByImportStatus(LicenseImportStatus.ACTIVE))
                    .willReturn(List.of(activeFile));
            given(revocationEntryRepository.existsByRevokedLicenseId("LIC-GRACE-END"))
                    .willReturn(false);
            // signatureVerifier defaults to true
            given(applicationLicenseRepository.findByLicenseFileId(activeFile.getId()))
                    .willReturn(Optional.of(appLicense));

            // Act
            licenseStateHolder.recomputeState();

            // Assert
            assertThat(licenseStateHolder.getCurrentState()).isEqualTo(LicenseState.EXPIRED);
        }
    }

    @Nested
    @DisplayName("scheduledRecompute")
    class ScheduledRecompute {

        @Test
        @DisplayName("Should call recomputeState during scheduled run")
        void shouldCallRecomputeState() {
            // Arrange
            given(licenseFileRepository.findByImportStatus(LicenseImportStatus.ACTIVE))
                    .willReturn(Collections.emptyList());

            // Act
            licenseStateHolder.scheduledRecompute();

            // Assert
            assertThat(licenseStateHolder.getCurrentState()).isEqualTo(LicenseState.UNLICENSED);
            verify(licenseFileRepository).findByImportStatus(LicenseImportStatus.ACTIVE);
        }
    }
}
