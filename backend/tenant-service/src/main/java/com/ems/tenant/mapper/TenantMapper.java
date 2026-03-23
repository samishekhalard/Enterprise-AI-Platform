package com.ems.tenant.mapper;

import com.ems.common.dto.TenantSummaryDTO;
import com.ems.tenant.entity.TenantEntity;

public interface TenantMapper {

    TenantSummaryDTO toSummaryDTO(TenantEntity entity);
}
