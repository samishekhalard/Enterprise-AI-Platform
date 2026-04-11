package com.ems.license.service;

/**
 * Test-only stub for LicenseSignatureVerifier that avoids Mockito's inability
 * to create inline mocks of concrete classes on Java 25.
 *
 * <p>This stub provides direct control over the verify() result for unit tests
 * without requiring Mockito instrumentation of the LicenseSignatureVerifier class.</p>
 */
class TestLicenseSignatureVerifier extends LicenseSignatureVerifier {

    private boolean verifyResult = true;
    private int verifyCallCount = 0;
    private byte[] lastPayload;
    private byte[] lastSignature;
    private String lastKid;

    TestLicenseSignatureVerifier() {
        super();
    }

    TestLicenseSignatureVerifier(boolean defaultResult) {
        super();
        this.verifyResult = defaultResult;
    }

    void setVerifyResult(boolean result) {
        this.verifyResult = result;
    }

    @Override
    public boolean verify(byte[] payload, byte[] signature, String kid) {
        verifyCallCount++;
        lastPayload = payload;
        lastSignature = signature;
        lastKid = kid;
        return verifyResult;
    }

    int getVerifyCallCount() {
        return verifyCallCount;
    }

    byte[] getLastPayload() {
        return lastPayload;
    }

    byte[] getLastSignature() {
        return lastSignature;
    }

    String getLastKid() {
        return lastKid;
    }

    void reset() {
        verifyCallCount = 0;
        lastPayload = null;
        lastSignature = null;
        lastKid = null;
    }
}
