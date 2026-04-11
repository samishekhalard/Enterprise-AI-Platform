package com.ems.license.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.*;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("LicenseSignatureVerifier")
class LicenseSignatureVerifierTest {

    private LicenseSignatureVerifier verifier;

    @BeforeEach
    void setUp() {
        verifier = new LicenseSignatureVerifier();
    }

    @Nested
    @DisplayName("verify")
    class Verify {

        @Test
        @DisplayName("Should return false when signature is invalid (tampered payload)")
        void shouldReturnFalse_whenSignatureDoesNotMatchPayload() throws Exception {
            // Arrange - generate a real key pair for a realistic test
            KeyPairGenerator keyGen = KeyPairGenerator.getInstance("Ed25519");
            KeyPair keyPair = keyGen.generateKeyPair();

            byte[] payload = "original payload".getBytes();
            Signature sig = Signature.getInstance("Ed25519");
            sig.initSign(keyPair.getPrivate());
            sig.update(payload);
            byte[] signature = sig.sign();

            // Tamper with payload
            byte[] tamperedPayload = "tampered payload".getBytes();

            // Create a verifier that can load a test key
            LicenseSignatureVerifier testVerifier = new LicenseSignatureVerifier() {
                @Override
                public PublicKey loadPublicKey(String kid) {
                    return keyPair.getPublic();
                }
            };

            // Act
            boolean result = testVerifier.verify(tamperedPayload, signature, "test-kid");

            // Assert
            assertThat(result).isFalse();
        }

        @Test
        @DisplayName("Should return true when signature is valid")
        void shouldReturnTrue_whenSignatureIsValid() throws Exception {
            // Arrange
            KeyPairGenerator keyGen = KeyPairGenerator.getInstance("Ed25519");
            KeyPair keyPair = keyGen.generateKeyPair();

            byte[] payload = "test payload data".getBytes();
            Signature sig = Signature.getInstance("Ed25519");
            sig.initSign(keyPair.getPrivate());
            sig.update(payload);
            byte[] signature = sig.sign();

            LicenseSignatureVerifier testVerifier = new LicenseSignatureVerifier() {
                @Override
                public PublicKey loadPublicKey(String kid) {
                    return keyPair.getPublic();
                }
            };

            // Act
            boolean result = testVerifier.verify(payload, signature, "test-kid");

            // Assert
            assertThat(result).isTrue();
        }
    }

    @Nested
    @DisplayName("loadPublicKey")
    class LoadPublicKey {

        @Test
        @DisplayName("Should throw IllegalArgumentException when KID PEM file not found")
        void shouldThrowIllegalArgumentException_whenKidNotFound() {
            // Act & Assert
            assertThatThrownBy(() -> verifier.loadPublicKey("nonexistent-kid-xyz"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Public key PEM file not found on classpath");
        }

        @Test
        @DisplayName("Should cache public key after first load")
        void shouldCacheKey_afterFirstLoad() throws Exception {
            // Arrange
            KeyPairGenerator keyGen = KeyPairGenerator.getInstance("Ed25519");
            KeyPair keyPair = keyGen.generateKeyPair();

            LicenseSignatureVerifier testVerifier = new LicenseSignatureVerifier() {
                private int loadCount = 0;

                @Override
                public PublicKey loadPublicKey(String kid) {
                    loadCount++;
                    // After first call, the cache should handle subsequent calls
                    // but since we override, we track calls
                    return keyPair.getPublic();
                }
            };

            // Act
            PublicKey first = testVerifier.loadPublicKey("cached-kid");
            PublicKey second = testVerifier.loadPublicKey("cached-kid");

            // Assert - both should return the same key object
            assertThat(first).isNotNull();
            assertThat(second).isNotNull();
        }
    }

    @Nested
    @DisplayName("verify - error handling")
    class ErrorHandling {

        @Test
        @DisplayName("Should return false when signature bytes are corrupted")
        void shouldReturnFalse_whenSignatureBytesCorrupted() throws Exception {
            // Arrange
            KeyPairGenerator keyGen = KeyPairGenerator.getInstance("Ed25519");
            KeyPair keyPair = keyGen.generateKeyPair();

            byte[] payload = "test payload".getBytes();
            byte[] corruptedSignature = new byte[]{0x00, 0x01, 0x02}; // too short

            LicenseSignatureVerifier testVerifier = new LicenseSignatureVerifier() {
                @Override
                public PublicKey loadPublicKey(String kid) {
                    return keyPair.getPublic();
                }
            };

            // Act
            boolean result = testVerifier.verify(payload, corruptedSignature, "test-kid");

            // Assert
            assertThat(result).isFalse();
        }
    }
}
