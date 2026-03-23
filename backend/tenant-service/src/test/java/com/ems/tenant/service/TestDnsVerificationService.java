package com.ems.tenant.service;

/**
 * Test-only stub for DnsVerificationService that avoids Mockito's inability
 * to create inline mocks of concrete classes on Java 25.
 *
 * <p>The branding tests never exercise DNS verification, so this stub
 * simply returns {@code false} for all verify calls. It extends the
 * real class so it can be injected into TenantServiceImpl's constructor.</p>
 */
class TestDnsVerificationService extends DnsVerificationService {

    private boolean verifyResult = false;

    TestDnsVerificationService() {
        super();
    }

    @Override
    public boolean verifyTxtRecord(String domain, String expectedToken) {
        return verifyResult;
    }

    void setVerifyResult(boolean result) {
        this.verifyResult = result;
    }
}
