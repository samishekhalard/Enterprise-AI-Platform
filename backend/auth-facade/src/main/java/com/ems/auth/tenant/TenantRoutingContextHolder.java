package com.ems.auth.tenant;

import java.util.function.Supplier;

public final class TenantRoutingContextHolder {

    private static final ThreadLocal<TenantRoutingContext> CURRENT = new ThreadLocal<>();

    private TenantRoutingContextHolder() {
    }

    public static TenantRoutingContext getCurrent() {
        return CURRENT.get();
    }

    public static void setCurrent(TenantRoutingContext context) {
        CURRENT.set(context);
    }

    public static void clear() {
        CURRENT.remove();
    }

    public static <T> T withContext(TenantRoutingContext context, Supplier<T> supplier) {
        TenantRoutingContext previous = CURRENT.get();
        CURRENT.set(context);
        try {
            return supplier.get();
        } finally {
            restore(previous);
        }
    }

    public static void withContext(TenantRoutingContext context, Runnable runnable) {
        TenantRoutingContext previous = CURRENT.get();
        CURRENT.set(context);
        try {
            runnable.run();
        } finally {
            restore(previous);
        }
    }

    private static void restore(TenantRoutingContext previous) {
        if (previous == null) {
            CURRENT.remove();
        } else {
            CURRENT.set(previous);
        }
    }
}
