package com.ems.user.mapper;

import com.ems.user.dto.UserDeviceDTO;
import com.ems.user.dto.UserProfileDTO;
import com.ems.user.dto.UserSessionDTO;
import com.ems.user.entity.UserDeviceEntity;
import com.ems.user.entity.UserProfileEntity;
import com.ems.user.entity.UserSessionEntity;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.util.UUID;

@Mapper(componentModel = "spring")
public interface UserMapper {

    @Mapping(target = "fullName", expression = "java(entity.getFullName())")
    @Mapping(target = "manager", source = "managerId", qualifiedByName = "managerIdToDto")
    UserProfileDTO toProfileDTO(UserProfileEntity entity);

    @Named("managerIdToDto")
    default UserProfileDTO.ManagerDTO managerIdToDto(UUID managerId) {
        // Manager details will be populated by service layer
        return null;
    }

    UserDeviceDTO toDeviceDTO(UserDeviceEntity entity);

    @Mapping(target = "deviceName", ignore = true) // Will be populated from device lookup
    @Mapping(target = "isCurrent", constant = "false") // Will be set by service
    UserSessionDTO toSessionDTO(UserSessionEntity entity);
}
