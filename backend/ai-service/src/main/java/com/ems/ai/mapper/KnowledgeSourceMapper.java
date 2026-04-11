package com.ems.ai.mapper;

import com.ems.ai.dto.KnowledgeSourceDTO;
import com.ems.ai.entity.KnowledgeSourceEntity;
import org.mapstruct.*;

import java.util.List;

@Mapper(
    componentModel = "spring",
    unmappedTargetPolicy = ReportingPolicy.IGNORE,
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE
)
public interface KnowledgeSourceMapper {

    @Mapping(target = "agentId", source = "agent.id")
    KnowledgeSourceDTO toDTO(KnowledgeSourceEntity entity);

    List<KnowledgeSourceDTO> toDTOList(List<KnowledgeSourceEntity> entities);
}
