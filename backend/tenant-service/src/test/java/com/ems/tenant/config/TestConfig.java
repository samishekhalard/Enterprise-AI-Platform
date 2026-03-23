package com.ems.tenant.config;

import com.ems.tenant.mapper.TenantMapper;
import org.mapstruct.factory.Mappers;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;

@TestConfiguration
public class TestConfig {

    @Bean
    public TenantMapper tenantMapper() {
        return Mappers.getMapper(TenantMapper.class);
    }
}
