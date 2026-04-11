package com.ems.audit.config;

import org.jasypt.encryption.StringEncryptor;
import org.jasypt.encryption.pbe.PooledPBEStringEncryptor;
import org.jasypt.encryption.pbe.config.SimpleStringPBEConfig;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Jasypt Configuration for encrypting sensitive data.
 *
 * Used to encrypt/decrypt:
 * - OAuth client secrets
 * - LDAP bind passwords
 * - API keys
 *
 * The encryption password is loaded from JASYPT_PASSWORD environment variable.
 */
@Configuration
public class JasyptConfig {

    @Value("${jasypt.encryptor.password}")
    private String password;

    @Value("${jasypt.encryptor.algorithm:PBEWITHHMACSHA512ANDAES_256}")
    private String algorithm;

    @Value("${jasypt.encryptor.key-obtention-iterations:1000}")
    private String keyObtentionIterations;

    @Value("${jasypt.encryptor.pool-size:1}")
    private String poolSize;

    @Value("${jasypt.encryptor.salt-generator-classname:org.jasypt.salt.RandomSaltGenerator}")
    private String saltGeneratorClassname;

    @Value("${jasypt.encryptor.iv-generator-classname:org.jasypt.iv.RandomIvGenerator}")
    private String ivGeneratorClassname;

    @Value("${jasypt.encryptor.string-output-type:base64}")
    private String stringOutputType;

    /**
     * Create and configure the Jasypt string encryptor.
     *
     * @return Configured StringEncryptor
     */
    @Bean("jasyptStringEncryptor")
    public StringEncryptor stringEncryptor() {
        PooledPBEStringEncryptor encryptor = new PooledPBEStringEncryptor();
        SimpleStringPBEConfig config = new SimpleStringPBEConfig();

        config.setPassword(password);
        config.setAlgorithm(algorithm);
        config.setKeyObtentionIterations(keyObtentionIterations);
        config.setPoolSize(poolSize);
        config.setSaltGeneratorClassName(saltGeneratorClassname);
        config.setIvGeneratorClassName(ivGeneratorClassname);
        config.setStringOutputType(stringOutputType);

        encryptor.setConfig(config);
        return encryptor;
    }
}
