package com.ems.ai.mapper;

import com.ems.ai.dto.ConversationDTO;
import com.ems.ai.entity.ConversationEntity;
import org.mapstruct.*;

import java.util.List;

@Mapper(
    componentModel = "spring",
    unmappedTargetPolicy = ReportingPolicy.IGNORE,
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE
)
public interface ConversationMapper {

    @Mapping(target = "agentId", source = "agent.id")
    @Mapping(target = "agentName", source = "agent.name")
    @Mapping(target = "agentAvatarUrl", source = "agent.avatarUrl")
    ConversationDTO toDTO(ConversationEntity entity);

    List<ConversationDTO> toDTOList(List<ConversationEntity> entities);
}
