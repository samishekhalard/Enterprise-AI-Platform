package com.ems.ai.mapper;

import com.ems.ai.dto.MessageDTO;
import com.ems.ai.entity.MessageEntity;
import org.mapstruct.*;

import java.util.List;

@Mapper(
    componentModel = "spring",
    unmappedTargetPolicy = ReportingPolicy.IGNORE,
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE
)
public interface MessageMapper {

    @Mapping(target = "conversationId", source = "conversation.id")
    MessageDTO toDTO(MessageEntity entity);

    List<MessageDTO> toDTOList(List<MessageEntity> entities);
}
