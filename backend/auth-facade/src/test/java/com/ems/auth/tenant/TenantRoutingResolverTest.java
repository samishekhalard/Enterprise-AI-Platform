package com.ems.auth.tenant;

import com.ems.auth.client.TenantServiceClient;
import com.ems.auth.config.AuthGraphPerTenantProperties;
import com.ems.auth.dto.internal.TenantRoutingRecord;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Duration;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TenantRoutingResolverTest {

    @Mock
    private TenantServiceClient tenantServiceClient;

    @Mock
    private StringRedisTemplate stringRedisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    private TenantRoutingResolver resolver;

    @BeforeEach
    void setUp() {
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);

        AuthGraphPerTenantProperties properties = new AuthGraphPerTenantProperties();
        properties.setRoutingCachePrefix("tenant:routing:");
        properties.setRoutingCacheTtlMinutes(5);

        resolver = new TenantRoutingResolver(tenantServiceClient, stringRedisTemplate, new ObjectMapper(), properties);
    }

    @Test
    void shouldReturnCachedRoutingWhenPresent() throws Exception {
        TenantRoutingContext cached = new TenantRoutingContext(
            UUID.fromString("22222222-2222-2222-2222-222222222222"),
            "acme",
            "tenant_acme_auth",
            "ar",
            "V003"
        );

        when(valueOperations.get("tenant:routing:22222222-2222-2222-2222-222222222222:auth-facade"))
            .thenReturn(new ObjectMapper().writeValueAsString(cached));

        TenantRoutingContext resolved = resolver.resolve("22222222-2222-2222-2222-222222222222");

        assertThat(resolved).isEqualTo(cached);
        verifyNoInteractions(tenantServiceClient);
    }

    @Test
    void shouldResolveFromControlPlaneAndCacheBothLookupKeys() {
        UUID tenantId = UUID.fromString("33333333-3333-3333-3333-333333333333");
        when(valueOperations.get(any())).thenReturn(null);
        when(tenantServiceClient.getRouting("legacy-id")).thenReturn(new TenantRoutingRecord(
            tenantId,
            "acme",
            "tenant_acme_auth",
            "tenant_acme_definitions",
            "en",
            "V003",
            "ACTIVE"
        ));

        TenantRoutingContext resolved = resolver.resolve("legacy-id");

        assertThat(resolved.tenantId()).isEqualTo(tenantId);
        assertThat(resolved.authDbName()).isEqualTo("tenant_acme_auth");
        assertThat(resolved.defaultLocale()).isEqualTo("en");

        verify(tenantServiceClient).getRouting("legacy-id");
        verify(valueOperations, times(2)).set(anyString(), anyString(), eq(Duration.ofMinutes(5)));
    }
}
