package com.ems.audit.mapper;

import com.ems.audit.dto.AuditEventDTO;
import com.ems.audit.dto.CreateAuditEventRequest;
import com.ems.audit.entity.AuditEventEntity;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface AuditEventMapper {

    AuditEventDTO toDTO(AuditEventEntity entity);

    List<AuditEventDTO> toDTOList(List<AuditEventEntity> entities);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "timestamp", ignore = true)
    @Mapping(target = "expiresAt", ignore = true)
    AuditEventEntity toEntity(CreateAuditEventRequest request);
}
