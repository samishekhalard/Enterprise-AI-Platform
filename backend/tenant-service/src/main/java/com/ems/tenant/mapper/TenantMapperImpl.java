package com.ems.tenant.mapper;

import com.ems.common.dto.TenantSummaryDTO;
import com.ems.tenant.entity.TenantEntity;
import org.springframework.stereotype.Component;

@Component
public class TenantMapperImpl implements TenantMapper {

    @Override
    public TenantSummaryDTO toSummaryDTO(TenantEntity entity) {
        if (entity == null) {
            return null;
        }

        TenantSummaryDTO.TenantSummaryDTOBuilder tenantSummaryDTO = TenantSummaryDTO.builder();

        tenantSummaryDTO.logo(entity.getLogoUrl());
        tenantSummaryDTO.id(entity.getId());
        if (entity.getUuid() != null) {
            tenantSummaryDTO.uuid(entity.getUuid().toString());
        }
        tenantSummaryDTO.fullName(entity.getFullName());
        tenantSummaryDTO.shortName(entity.getShortName());
        tenantSummaryDTO.description(entity.getDescription());
        tenantSummaryDTO.tenantType(entity.getTenantType());
        tenantSummaryDTO.tier(entity.getTier());
        tenantSummaryDTO.status(entity.getStatus());
        tenantSummaryDTO.createdAt(entity.getCreatedAt());
        tenantSummaryDTO.updatedAt(entity.getUpdatedAt());
        tenantSummaryDTO.lastActivityAt(entity.getLastActivityAt());

        tenantSummaryDTO.primaryDomain(entity.getPrimaryDomain());
        tenantSummaryDTO.domainsCount(entity.getDomainsCount());
        tenantSummaryDTO.usersCount(0);
        tenantSummaryDTO.isProtected(Boolean.TRUE.equals(entity.getIsProtected()));

        tenantSummaryDTO.suspensionReason(entity.getSuspensionReason());
        tenantSummaryDTO.suspensionNotes(entity.getSuspensionNotes());
        tenantSummaryDTO.suspendedAt(entity.getSuspendedAt());
        tenantSummaryDTO.estimatedReactivationDate(entity.getEstimatedReactivationDate());

        return tenantSummaryDTO.build();
    }
}
