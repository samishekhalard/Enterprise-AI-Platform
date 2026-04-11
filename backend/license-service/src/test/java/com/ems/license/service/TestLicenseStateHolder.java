package com.ems.license.service;

import com.ems.license.entity.LicenseState;

/**
 * Test-only stub for LicenseStateHolder that avoids Mockito's inability
 * to create inline mocks of concrete classes on Java 25.
 *
 * <p>This stub provides direct control over the license state for unit tests
 * without requiring Mockito instrumentation of the LicenseStateHolder class.</p>
 */
class TestLicenseStateHolder extends LicenseStateHolder {

    private LicenseState forcedState;
    private int recomputeCallCount = 0;

    TestLicenseStateHolder() {
        super(null, null, null, null);
    }

    TestLicenseStateHolder(LicenseState initialState) {
        super(null, null, null, null);
        this.forcedState = initialState;
    }

    void setForcedState(LicenseState state) {
        this.forcedState = state;
    }

    @Override
    public LicenseState getCurrentState() {
        return forcedState != null ? forcedState : LicenseState.UNLICENSED;
    }

    @Override
    public void recomputeState() {
        recomputeCallCount++;
    }

    int getRecomputeCallCount() {
        return recomputeCallCount;
    }
}
