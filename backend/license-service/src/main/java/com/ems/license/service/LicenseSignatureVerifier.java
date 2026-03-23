package com.ems.license.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.security.*;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Verifies Ed25519 digital signatures on license files.
 *
 * <p>Public keys are loaded from the classpath at {@code license/{kid}.pem}
 * and cached in memory for the lifetime of the application.</p>
 *
 * <p>The KID (Key Identifier) from the license file header selects which
 * public key PEM file to use for verification.</p>
 */
@Component
@Slf4j
public class LicenseSignatureVerifier {

    private static final String KEY_PATH_PREFIX = "license/";
    private static final String KEY_PATH_SUFFIX = ".pem";
    private static final String ALGORITHM = "Ed25519";

    private final ConcurrentHashMap<String, PublicKey> keyCache = new ConcurrentHashMap<>();

    /**
     * Verify an Ed25519 signature against a payload using the public key identified by KID.
     *
     * @param payload   the original signed payload bytes
     * @param signature the Ed25519 signature bytes
     * @param kid       the key identifier used to locate the public key PEM file
     * @return {@code true} if the signature is valid, {@code false} otherwise
     */
    public boolean verify(byte[] payload, byte[] signature, String kid) {
        try {
            PublicKey publicKey = loadPublicKey(kid);
            Signature sig = Signature.getInstance(ALGORITHM);
            sig.initVerify(publicKey);
            sig.update(payload);
            boolean valid = sig.verify(signature);
            if (!valid) {
                log.warn("Signature verification failed for kid: {}", kid);
            }
            return valid;
        } catch (NoSuchAlgorithmException e) {
            log.error("Ed25519 algorithm not available. Requires Java 15+: {}", e.getMessage());
            return false;
        } catch (InvalidKeyException e) {
            log.error("Invalid public key for kid {}: {}", kid, e.getMessage());
            return false;
        } catch (SignatureException e) {
            log.error("Signature verification error for kid {}: {}", kid, e.getMessage());
            return false;
        } catch (Exception e) {
            log.error("Unexpected error during signature verification for kid {}: {}", kid, e.getMessage());
            return false;
        }
    }

    /**
     * Load an Ed25519 public key from the classpath PEM file.
     * Keys are cached after first load.
     *
     * @param kid the key identifier
     * @return the loaded public key
     * @throws IllegalArgumentException if the key file cannot be found or parsed
     */
    public PublicKey loadPublicKey(String kid) {
        return keyCache.computeIfAbsent(kid, this::loadKeyFromClasspath);
    }

    private PublicKey loadKeyFromClasspath(String kid) {
        String path = KEY_PATH_PREFIX + kid + KEY_PATH_SUFFIX;
        log.info("Loading Ed25519 public key from classpath: {}", path);

        try {
            ClassPathResource resource = new ClassPathResource(path);
            if (!resource.exists()) {
                throw new IllegalArgumentException("Public key PEM file not found on classpath: " + path);
            }

            String pemContent;
            try (InputStream is = resource.getInputStream()) {
                pemContent = new String(is.readAllBytes());
            }

            // Strip PEM headers/footers and whitespace
            String base64Key = pemContent
                .replace("-----BEGIN PUBLIC KEY-----", "")
                .replace("-----END PUBLIC KEY-----", "")
                .replaceAll("\\s+", "");

            byte[] keyBytes = Base64.getDecoder().decode(base64Key);
            X509EncodedKeySpec keySpec = new X509EncodedKeySpec(keyBytes);
            KeyFactory keyFactory = KeyFactory.getInstance(ALGORITHM);
            PublicKey publicKey = keyFactory.generatePublic(keySpec);

            log.info("Successfully loaded Ed25519 public key for kid: {}", kid);
            return publicKey;
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalArgumentException("Failed to load public key for kid: " + kid, e);
        }
    }
}
