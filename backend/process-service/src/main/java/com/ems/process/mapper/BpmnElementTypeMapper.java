package com.ems.process.mapper;

import com.ems.process.dto.BpmnElementTypeDTO;
import com.ems.process.entity.BpmnElementTypeEntity;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface BpmnElementTypeMapper {

    @Mapping(target = "defaultSize", expression = "java(toSizeDTO(entity.getDefaultWidth(), entity.getDefaultHeight()))")
    BpmnElementTypeDTO toDTO(BpmnElementTypeEntity entity);

    default BpmnElementTypeDTO.ElementSizeDTO toSizeDTO(Integer width, Integer height) {
        if (width == null && height == null) {
            return null;
        }
        return BpmnElementTypeDTO.ElementSizeDTO.builder()
                .width(width)
                .height(height)
                .build();
    }
}
