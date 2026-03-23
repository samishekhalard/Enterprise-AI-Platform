package com.ems.license.service;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

/**
 * Test-only stub for StringRedisTemplate that avoids Mockito's inability
 * to create inline mocks of concrete Spring classes on Java 25.
 *
 * <p>This stub provides a simple in-memory implementation of the
 * Redis operations used by license service classes, without requiring
 * Mockito instrumentation of StringRedisTemplate.</p>
 */
class TestStringRedisTemplate extends StringRedisTemplate {

    private final TestValueOperations valueOps = new TestValueOperations();
    private final Map<String, Boolean> deletedKeys = new HashMap<>();
    private RuntimeException opsForValueException;
    private RuntimeException deleteException;

    @Override
    public ValueOperations<String, String> opsForValue() {
        if (opsForValueException != null) {
            throw opsForValueException;
        }
        return valueOps;
    }

    @Override
    public Boolean delete(String key) {
        if (deleteException != null) {
            throw deleteException;
        }
        boolean existed = valueOps.getData().containsKey(key);
        valueOps.getData().remove(key);
        deletedKeys.put(key, existed);
        return existed;
    }

    // ---- Test control methods ----

    /**
     * Pre-populate a cache entry.
     */
    void putCacheEntry(String key, String value) {
        valueOps.getData().put(key, value);
    }

    /**
     * Get a cache entry (for verification).
     */
    String getCacheEntry(String key) {
        return valueOps.getData().get(key);
    }

    /**
     * Check if a key was stored via set().
     */
    boolean wasCached(String key) {
        return valueOps.getData().containsKey(key);
    }

    /**
     * Check if delete was called for a specific key.
     */
    boolean wasDeleted(String key) {
        return deletedKeys.containsKey(key);
    }

    /**
     * Force opsForValue() to throw on the next get() call.
     */
    void setGetException(RuntimeException ex) {
        valueOps.setGetException(ex);
    }

    /**
     * Force opsForValue() to throw on the next set() call.
     */
    void setSetException(RuntimeException ex) {
        valueOps.setSetException(ex);
    }

    /**
     * Force delete() to throw.
     */
    void setDeleteException(RuntimeException ex) {
        this.deleteException = ex;
    }

    /**
     * Get the underlying test value operations for direct assertions.
     */
    TestValueOperations getTestValueOps() {
        return valueOps;
    }

    /**
     * Reset all state.
     */
    void reset() {
        valueOps.getData().clear();
        valueOps.setGetException(null);
        valueOps.setSetException(null);
        deletedKeys.clear();
        deleteException = null;
        opsForValueException = null;
    }
}
