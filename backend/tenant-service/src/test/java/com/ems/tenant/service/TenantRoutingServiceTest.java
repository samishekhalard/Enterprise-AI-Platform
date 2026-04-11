package com.ems.tenant.service;

import com.ems.common.enums.TenantStatus;
import com.ems.common.enums.TenantTier;
import com.ems.common.enums.TenantType;
import com.ems.tenant.entity.TenantEntity;
import com.ems.tenant.repository.TenantRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TenantRoutingServiceTest {

    @Mock
    private TenantRepository tenantRepository;

    private TenantRoutingService tenantRoutingService;

    @BeforeEach
    void setUp() {
        tenantRoutingService = new TenantRoutingService(tenantRepository);
    }

    @Test
    @DisplayName("getRouting resolves by UUID and falls back to en default locale")
    void getRouting_resolvesByUuid() {
        UUID tenantUuid = UUID.fromString("f4dc7421-69b8-4c1a-a4a3-1e3dd9c31c31");
        TenantEntity tenant = TenantEntity.builder()
            .id("tenant-acme")
            .uuid(tenantUuid)
            .slug("acme")
            .tenantType(TenantType.REGULAR)
            .tier(TenantTier.STANDARD)
            .status(TenantStatus.ACTIVE)
            .authDbName("tenant_acme_auth")
            .definitionsDbName("tenant_acme_definitions")
            .baselineVersion("V003")
            .build();

        when(tenantRepository.findById(tenantUuid.toString())).thenReturn(Optional.empty());
        when(tenantRepository.findByUuid(tenantUuid)).thenReturn(Optional.of(tenant));

        var response = tenantRoutingService.getRouting(tenantUuid.toString());

        assertThat(response.tenantId()).isEqualTo(tenantUuid);
        assertThat(response.defaultLocale()).isEqualTo("en");
        assertThat(response.authDbName()).isEqualTo("tenant_acme_auth");
        assertThat(response.definitionsDbName()).isEqualTo("tenant_acme_definitions");
    }
}
