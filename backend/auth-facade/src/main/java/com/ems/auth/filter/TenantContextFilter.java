package com.ems.auth.filter;

import com.ems.auth.config.AuthGraphPerTenantProperties;
import com.ems.auth.tenant.TenantRoutingContext;
import com.ems.auth.tenant.TenantRoutingContextHolder;
import com.ems.auth.tenant.TenantRoutingResolver;
import com.ems.auth.tenant.TenantRoutingUnavailableException;
import com.ems.common.exception.TenantNotFoundException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.Collections;
import java.util.Enumeration;
import java.util.LinkedHashSet;
import java.util.List;

@Component
@Order(1)
@Slf4j
@RequiredArgsConstructor
public class TenantContextFilter extends OncePerRequestFilter {

    public static final String TENANT_HEADER = "X-Tenant-ID";
    private static final ThreadLocal<String> CURRENT_TENANT = new ThreadLocal<>();

    private final TenantRoutingResolver tenantRoutingResolver;
    private final AuthGraphPerTenantProperties graphPerTenantProperties;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String tenantId = request.getHeader(TENANT_HEADER);

        try {
            if (tenantId == null || tenantId.isBlank()) {
                filterChain.doFilter(request, response);
                return;
            }

            String trimmedTenantId = tenantId.trim();
            if (!graphPerTenantProperties.isEnabled()) {
                CURRENT_TENANT.set(trimmedTenantId);
                log.debug("Tenant context set (legacy/shared graph mode): {}", trimmedTenantId);
                filterChain.doFilter(request, response);
                return;
            }

            TenantRoutingContext context = tenantRoutingResolver.resolve(trimmedTenantId);
            TenantRoutingContextHolder.setCurrent(context);
            CURRENT_TENANT.set(context.tenantIdValue());
            log.debug("Tenant routing context set: tenant={}, db={}", context.tenantIdValue(), context.authDbName());

            HttpServletRequest wrappedRequest = wrapWithCanonicalTenantHeader(request, context.tenantIdValue());
            filterChain.doFilter(wrappedRequest, response);
        } catch (TenantNotFoundException ex) {
            log.warn("Tenant routing failed: {}", ex.getMessage());
            writeError(response, HttpStatus.NOT_FOUND, "tenant_not_found", ex.getMessage());
        } catch (TenantRoutingUnavailableException ex) {
            log.error("Tenant routing unavailable: {}", ex.getMessage());
            writeError(response, HttpStatus.SERVICE_UNAVAILABLE, "tenant_routing_unavailable",
                "Tenant routing metadata is temporarily unavailable");
        } finally {
            TenantRoutingContextHolder.clear();
            CURRENT_TENANT.remove();
        }
    }

    public static String getCurrentTenant() {
        TenantRoutingContext context = TenantRoutingContextHolder.getCurrent();
        return context != null ? context.tenantIdValue() : CURRENT_TENANT.get();
    }

    public static void setCurrentTenant(String tenantId) {
        CURRENT_TENANT.set(tenantId);
    }

    public static void clear() {
        TenantRoutingContextHolder.clear();
        CURRENT_TENANT.remove();
    }

    private HttpServletRequest wrapWithCanonicalTenantHeader(HttpServletRequest request, String tenantId) {
        return new HttpServletRequestWrapper(request) {
            @Override
            public String getHeader(String name) {
                if (TENANT_HEADER.equalsIgnoreCase(name)) {
                    return tenantId;
                }
                return super.getHeader(name);
            }

            @Override
            public Enumeration<String> getHeaders(String name) {
                if (TENANT_HEADER.equalsIgnoreCase(name)) {
                    return Collections.enumeration(List.of(tenantId));
                }
                return super.getHeaders(name);
            }

            @Override
            public Enumeration<String> getHeaderNames() {
                LinkedHashSet<String> names = new LinkedHashSet<>(Collections.list(super.getHeaderNames()));
                names.add(TENANT_HEADER);
                return Collections.enumeration(names);
            }
        };
    }

    private void writeError(HttpServletResponse response, HttpStatus status, String error, String message) throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getWriter(), new ErrorBody(error, message, Instant.now().toString()));
    }

    private record ErrorBody(String error, String message, String timestamp) {
    }
}
