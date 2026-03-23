package com.ems.license.service;

import org.springframework.data.redis.connection.BitFieldSubCommands;
import org.springframework.data.redis.core.RedisOperations;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Duration;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * Test-only stub for ValueOperations that provides simple in-memory behavior
 * for the get/set operations used by license service classes.
 *
 * <p>Supports programmable exceptions to simulate Redis failures.</p>
 */
class TestValueOperations implements ValueOperations<String, String> {

    private final Map<String, String> data = new HashMap<>();
    private final Map<String, Duration> ttls = new HashMap<>();
    private RuntimeException getException;
    private RuntimeException setException;

    Map<String, String> getData() {
        return data;
    }

    Map<String, Duration> getTtls() {
        return ttls;
    }

    void setGetException(RuntimeException ex) {
        this.getException = ex;
    }

    void setSetException(RuntimeException ex) {
        this.setException = ex;
    }

    @Override
    public String get(Object key) {
        if (getException != null) {
            RuntimeException ex = getException;
            // Don't clear - let it throw every time unless explicitly reset
            throw ex;
        }
        return data.get(key.toString());
    }

    @Override
    public void set(String key, String value) {
        if (setException != null) {
            throw setException;
        }
        data.put(key, value);
    }

    @Override
    public void set(String key, String value, long timeout, TimeUnit unit) {
        if (setException != null) {
            throw setException;
        }
        data.put(key, value);
        ttls.put(key, Duration.of(timeout, unit.toChronoUnit()));
    }

    @Override
    public void set(String key, String value, Duration timeout) {
        if (setException != null) {
            throw setException;
        }
        data.put(key, value);
        ttls.put(key, timeout);
    }

    @Override
    public Boolean setIfAbsent(String key, String value) {
        if (!data.containsKey(key)) {
            data.put(key, value);
            return true;
        }
        return false;
    }

    @Override
    public Boolean setIfAbsent(String key, String value, long timeout, TimeUnit unit) {
        return setIfAbsent(key, value);
    }

    @Override
    public Boolean setIfAbsent(String key, String value, Duration timeout) {
        return setIfAbsent(key, value);
    }

    @Override
    public Boolean setIfPresent(String key, String value) {
        if (data.containsKey(key)) {
            data.put(key, value);
            return true;
        }
        return false;
    }

    @Override
    public Boolean setIfPresent(String key, String value, long timeout, TimeUnit unit) {
        return setIfPresent(key, value);
    }

    @Override
    public Boolean setIfPresent(String key, String value, Duration timeout) {
        return setIfPresent(key, value);
    }

    @Override
    public void multiSet(Map<? extends String, ? extends String> map) {
        data.putAll(map);
    }

    @Override
    public Boolean multiSetIfAbsent(Map<? extends String, ? extends String> map) {
        boolean allAbsent = map.keySet().stream().noneMatch(data::containsKey);
        if (allAbsent) {
            data.putAll(map);
        }
        return allAbsent;
    }

    @Override
    public String getAndSet(String key, String value) {
        String old = data.get(key);
        data.put(key, value);
        return old;
    }

    @Override
    public String getAndDelete(String key) {
        return data.remove(key);
    }

    @Override
    public String getAndExpire(String key, long timeout, TimeUnit unit) {
        return data.get(key);
    }

    @Override
    public String getAndExpire(String key, Duration timeout) {
        return data.get(key);
    }

    @Override
    public String getAndPersist(String key) {
        return data.get(key);
    }

    @Override
    public List<String> multiGet(Collection<String> keys) {
        return keys.stream().map(data::get).toList();
    }

    @Override
    public Long increment(String key) {
        long val = Long.parseLong(data.getOrDefault(key, "0")) + 1;
        data.put(key, String.valueOf(val));
        return val;
    }

    @Override
    public Long increment(String key, long delta) {
        long val = Long.parseLong(data.getOrDefault(key, "0")) + delta;
        data.put(key, String.valueOf(val));
        return val;
    }

    @Override
    public Double increment(String key, double delta) {
        double val = Double.parseDouble(data.getOrDefault(key, "0")) + delta;
        data.put(key, String.valueOf(val));
        return val;
    }

    @Override
    public Long decrement(String key) {
        long val = Long.parseLong(data.getOrDefault(key, "0")) - 1;
        data.put(key, String.valueOf(val));
        return val;
    }

    @Override
    public Long decrement(String key, long delta) {
        long val = Long.parseLong(data.getOrDefault(key, "0")) - delta;
        data.put(key, String.valueOf(val));
        return val;
    }

    @Override
    public Integer append(String key, String value) {
        String current = data.getOrDefault(key, "");
        data.put(key, current + value);
        return (current + value).length();
    }

    @Override
    public String get(String key, long start, long end) {
        String val = data.getOrDefault(key, "");
        int s = (int) Math.max(0, start);
        int e = (int) Math.min(val.length(), end + 1);
        return val.substring(s, e);
    }

    @Override
    public void set(String key, String value, long offset) {
        data.put(key, value);
    }

    @Override
    public Long size(String key) {
        String val = data.get(key);
        return val == null ? 0L : (long) val.length();
    }

    @Override
    public Boolean setBit(String key, long offset, boolean value) {
        return false;
    }

    @Override
    public Boolean getBit(String key, long offset) {
        return false;
    }

    @Override
    public List<Long> bitField(String key, BitFieldSubCommands subCommands) {
        return Collections.emptyList();
    }

    @Override
    public RedisOperations<String, String> getOperations() {
        return null;
    }
}
