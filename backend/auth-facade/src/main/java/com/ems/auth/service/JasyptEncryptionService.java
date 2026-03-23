package com.ems.auth.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jasypt.encryption.StringEncryptor;
import org.springframework.stereotype.Service;

/**
 * Jasypt implementation of EncryptionService.
 * Uses the configured StringEncryptor bean to handle encryption operations.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class JasyptEncryptionService implements EncryptionService {

    private final StringEncryptor stringEncryptor;

    @Override
    public String encrypt(String rawData) {
        if (rawData == null) {
            return null;
        }
        try {
            return stringEncryptor.encrypt(rawData);
        } catch (Exception e) {
            log.error("Error encrypting data", e);
            throw new RuntimeException("Encryption failed", e);
        }
    }

    @Override
    public String decrypt(String encryptedData) {
        if (encryptedData == null) {
            return null;
        }
        try {
            return stringEncryptor.decrypt(encryptedData);
        } catch (Exception e) {
            log.error("Error decrypting data", e);
            throw new RuntimeException("Decryption failed", e);
        }
    }
}