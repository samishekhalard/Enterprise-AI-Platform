package com.ems.ai.mapper;

import com.ems.ai.dto.AgentCategoryDTO;
import com.ems.ai.dto.AgentDTO;
import com.ems.ai.dto.CreateAgentRequest;
import com.ems.ai.entity.AgentCategoryEntity;
import com.ems.ai.entity.AgentEntity;
import org.mapstruct.*;

import java.util.List;

@Mapper(
    componentModel = "spring",
    unmappedTargetPolicy = ReportingPolicy.IGNORE,
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE
)
public interface AgentMapper {

    @Mapping(target = "knowledgeSourceCount", expression = "java(entity.getKnowledgeSources() != null ? entity.getKnowledgeSources().size() : 0)")
    AgentDTO toDTO(AgentEntity entity);

    List<AgentDTO> toDTOList(List<AgentEntity> entities);

    AgentCategoryDTO toCategoryDTO(AgentCategoryEntity entity);

    List<AgentCategoryDTO> toCategoryDTOList(List<AgentCategoryEntity> entities);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "ownerId", ignore = true)
    @Mapping(target = "category", ignore = true)
    @Mapping(target = "isSystem", constant = "false")
    @Mapping(target = "status", constant = "ACTIVE")
    @Mapping(target = "usageCount", constant = "0L")
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "knowledgeSources", ignore = true)
    AgentEntity toEntity(CreateAgentRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "ownerId", ignore = true)
    @Mapping(target = "category", ignore = true)
    @Mapping(target = "isSystem", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "usageCount", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "knowledgeSources", ignore = true)
    void updateEntity(@MappingTarget AgentEntity entity, CreateAgentRequest request);
}
