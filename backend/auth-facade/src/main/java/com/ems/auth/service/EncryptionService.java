package com.ems.auth.service;

/**
 * Service for encrypting and decrypting sensitive data.
 * Used for storing secrets (client secrets, passwords) securely in the database.
 */
public interface EncryptionService {

    /**
     * Encrypts the given raw string.
     *
     * @param rawData the data to encrypt
     * @return the encrypted string
     */
    String encrypt(String rawData);

    /**
     * Decrypts the given encrypted string.
     *
     * @param encryptedData the data to decrypt
     * @return the decrypted string
     */
    String decrypt(String encryptedData);
}