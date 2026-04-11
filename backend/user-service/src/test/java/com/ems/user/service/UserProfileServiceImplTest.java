package com.ems.user.service;

import com.ems.common.enums.UserStatus;
import com.ems.common.exception.ResourceNotFoundException;
import com.ems.user.dto.CreateUserRequest;
import com.ems.user.dto.UserListResponse;
import com.ems.user.dto.UserProfileDTO;
import com.ems.user.dto.UserProfileUpdateRequest;
import com.ems.user.entity.UserProfileEntity;
import com.ems.user.mapper.UserMapper;
import com.ems.user.repository.UserProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("UserProfileServiceImpl Unit Tests")
class UserProfileServiceImplTest {

    @Mock
    private UserProfileRepository userProfileRepository;

    @Mock
    private UserMapper userMapper;

    @Mock
    private KeycloakSyncService keycloakSyncService;

    @InjectMocks
    private UserProfileServiceImpl userProfileService;

    private static final String TENANT_ID = "tenant-acme";
    private static final UUID USER_ID = UUID.randomUUID();
    private static final UUID KEYCLOAK_ID = UUID.randomUUID();
    private static final UUID MANAGER_ID = UUID.randomUUID();

    private UserProfileEntity userEntity;
    private UserProfileDTO userDTO;

    @BeforeEach
    void setUp() {
        userEntity = UserProfileEntity.builder()
            .id(USER_ID)
            .keycloakId(KEYCLOAK_ID)
            .tenantId(TENANT_ID)
            .email("john.doe@acme.com")
            .firstName("John")
            .lastName("Doe")
            .displayName("John Doe")
            .jobTitle("Engineer")
            .department("Engineering")
            .phone("+1234567890")
            .status(UserStatus.ACTIVE)
            .build();

        userDTO = UserProfileDTO.builder()
            .id(USER_ID)
            .keycloakId(KEYCLOAK_ID)
            .tenantId(TENANT_ID)
            .email("john.doe@acme.com")
            .firstName("John")
            .lastName("Doe")
            .fullName("John Doe")
            .displayName("John Doe")
            .jobTitle("Engineer")
            .department("Engineering")
            .status(UserStatus.ACTIVE)
            .build();
    }

    @Nested
    @DisplayName("getCurrentUser")
    class GetCurrentUser {

        @Test
        @DisplayName("Should return user profile when user exists locally")
        void getCurrentUser_whenUserExistsLocally_shouldReturnProfile() {
            // Arrange
            when(userProfileRepository.findByKeycloakId(KEYCLOAK_ID)).thenReturn(Optional.of(userEntity));
            when(userMapper.toProfileDTO(userEntity)).thenReturn(userDTO);
            when(userProfileRepository.findById(USER_ID)).thenReturn(Optional.of(userEntity));

            // Act
            UserProfileDTO result = userProfileService.getCurrentUser(KEYCLOAK_ID, TENANT_ID);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.email()).isEqualTo("john.doe@acme.com");
            verify(userProfileRepository).findByKeycloakId(KEYCLOAK_ID);
            verify(keycloakSyncService, never()).syncUser(any(), any());
        }

        @Test
        @DisplayName("Should sync from Keycloak when user does not exist locally")
        void getCurrentUser_whenUserNotLocal_shouldSyncFromKeycloak() {
            // Arrange
            when(userProfileRepository.findByKeycloakId(KEYCLOAK_ID)).thenReturn(Optional.empty());
            when(keycloakSyncService.syncUser(KEYCLOAK_ID, TENANT_ID)).thenReturn(userEntity);
            when(userMapper.toProfileDTO(userEntity)).thenReturn(userDTO);
            when(userProfileRepository.findById(USER_ID)).thenReturn(Optional.of(userEntity));

            // Act
            UserProfileDTO result = userProfileService.getCurrentUser(KEYCLOAK_ID, TENANT_ID);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.email()).isEqualTo("john.doe@acme.com");
            verify(keycloakSyncService).syncUser(KEYCLOAK_ID, TENANT_ID);
        }

        @Test
        @DisplayName("Should enrich with manager info when manager exists")
        void getCurrentUser_whenManagerExists_shouldEnrichWithManagerInfo() {
            // Arrange
            userEntity.setManagerId(MANAGER_ID);
            UserProfileEntity managerEntity = UserProfileEntity.builder()
                .id(MANAGER_ID)
                .firstName("Jane")
                .lastName("Smith")
                .email("jane.smith@acme.com")
                .build();

            when(userProfileRepository.findByKeycloakId(KEYCLOAK_ID)).thenReturn(Optional.of(userEntity));
            when(userMapper.toProfileDTO(userEntity)).thenReturn(userDTO);
            when(userProfileRepository.findById(USER_ID)).thenReturn(Optional.of(userEntity));
            when(userProfileRepository.findById(MANAGER_ID)).thenReturn(Optional.of(managerEntity));

            // Act
            UserProfileDTO result = userProfileService.getCurrentUser(KEYCLOAK_ID, TENANT_ID);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.manager()).isNotNull();
            assertThat(result.manager().email()).isEqualTo("jane.smith@acme.com");
        }
    }

    @Nested
    @DisplayName("updateCurrentUser")
    class UpdateCurrentUser {

        @Test
        @DisplayName("Should update self-service fields successfully")
        void updateCurrentUser_withValidRequest_shouldUpdateSelfServiceFields() {
            // Arrange
            UserProfileUpdateRequest request = UserProfileUpdateRequest.builder()
                .displayName("Johnny Doe")
                .phone("+0987654321")
                .timezone("America/New_York")
                .locale("en-US")
                .build();

            when(userProfileRepository.findByKeycloakId(KEYCLOAK_ID)).thenReturn(Optional.of(userEntity));
            when(userProfileRepository.save(any(UserProfileEntity.class))).thenReturn(userEntity);
            when(userMapper.toProfileDTO(any(UserProfileEntity.class))).thenReturn(userDTO);
            when(userProfileRepository.findById(USER_ID)).thenReturn(Optional.of(userEntity));

            // Act
            UserProfileDTO result = userProfileService.updateCurrentUser(KEYCLOAK_ID, TENANT_ID, request);

            // Assert
            assertThat(result).isNotNull();
            ArgumentCaptor<UserProfileEntity> captor = ArgumentCaptor.forClass(UserProfileEntity.class);
            verify(userProfileRepository).save(captor.capture());
            UserProfileEntity saved = captor.getValue();
            assertThat(saved.getDisplayName()).isEqualTo("Johnny Doe");
            assertThat(saved.getPhone()).isEqualTo("+0987654321");
            assertThat(saved.getTimezone()).isEqualTo("America/New_York");
            assertThat(saved.getLocale()).isEqualTo("en-US");
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when user not found")
        void updateCurrentUser_whenUserNotFound_shouldThrowException() {
            // Arrange
            UserProfileUpdateRequest request = UserProfileUpdateRequest.builder()
                .displayName("New Name")
                .build();
            when(userProfileRepository.findByKeycloakId(KEYCLOAK_ID)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() ->
                userProfileService.updateCurrentUser(KEYCLOAK_ID, TENANT_ID, request)
            ).isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("Should not update fields when request values are null")
        void updateCurrentUser_withNullFields_shouldNotOverwrite() {
            // Arrange
            UserProfileUpdateRequest request = UserProfileUpdateRequest.builder().build();
            when(userProfileRepository.findByKeycloakId(KEYCLOAK_ID)).thenReturn(Optional.of(userEntity));
            when(userProfileRepository.save(any(UserProfileEntity.class))).thenReturn(userEntity);
            when(userMapper.toProfileDTO(any(UserProfileEntity.class))).thenReturn(userDTO);
            when(userProfileRepository.findById(USER_ID)).thenReturn(Optional.of(userEntity));

            // Act
            userProfileService.updateCurrentUser(KEYCLOAK_ID, TENANT_ID, request);

            // Assert
            ArgumentCaptor<UserProfileEntity> captor = ArgumentCaptor.forClass(UserProfileEntity.class);
            verify(userProfileRepository).save(captor.capture());
            UserProfileEntity saved = captor.getValue();
            assertThat(saved.getDisplayName()).isEqualTo("John Doe");
            assertThat(saved.getPhone()).isEqualTo("+1234567890");
        }
    }

    @Nested
    @DisplayName("listUsers")
    class ListUsers {

        @Test
        @DisplayName("Should return paginated user list without search")
        void listUsers_withoutSearch_shouldReturnPaginatedResults() {
            // Arrange
            Pageable pageable = PageRequest.of(0, 20);
            Page<UserProfileEntity> page = new PageImpl<>(List.of(userEntity), pageable, 1);
            when(userProfileRepository.findByTenantId(TENANT_ID, pageable)).thenReturn(page);
            when(userMapper.toProfileDTO(userEntity)).thenReturn(userDTO);
            when(userProfileRepository.findById(USER_ID)).thenReturn(Optional.of(userEntity));

            // Act
            UserListResponse result = userProfileService.listUsers(TENANT_ID, null, pageable);

            // Assert
            assertThat(result.users()).hasSize(1);
            assertThat(result.total()).isEqualTo(1);
            assertThat(result.page()).isEqualTo(1);
            assertThat(result.totalPages()).isEqualTo(1);
            verify(userProfileRepository).findByTenantId(TENANT_ID, pageable);
            verify(userProfileRepository, never()).searchByTenantId(any(), any(), any());
        }

        @Test
        @DisplayName("Should search users when search term provided")
        void listUsers_withSearchTerm_shouldSearchByTenantId() {
            // Arrange
            Pageable pageable = PageRequest.of(0, 20);
            Page<UserProfileEntity> page = new PageImpl<>(List.of(userEntity), pageable, 1);
            when(userProfileRepository.searchByTenantId(TENANT_ID, "john", pageable)).thenReturn(page);
            when(userMapper.toProfileDTO(userEntity)).thenReturn(userDTO);
            when(userProfileRepository.findById(USER_ID)).thenReturn(Optional.of(userEntity));

            // Act
            UserListResponse result = userProfileService.listUsers(TENANT_ID, "john", pageable);

            // Assert
            assertThat(result.users()).hasSize(1);
            verify(userProfileRepository).searchByTenantId(TENANT_ID, "john", pageable);
            verify(userProfileRepository, never()).findByTenantId(any(), any());
        }

        @Test
        @DisplayName("Should return empty list when no users found")
        void listUsers_whenNoUsersFound_shouldReturnEmptyList() {
            // Arrange
            Pageable pageable = PageRequest.of(0, 20);
            Page<UserProfileEntity> emptyPage = new PageImpl<>(List.of(), pageable, 0);
            when(userProfileRepository.findByTenantId(TENANT_ID, pageable)).thenReturn(emptyPage);

            // Act
            UserListResponse result = userProfileService.listUsers(TENANT_ID, null, pageable);

            // Assert
            assertThat(result.users()).isEmpty();
            assertThat(result.total()).isZero();
        }

        @Test
        @DisplayName("Should ignore blank search term and use findByTenantId")
        void listUsers_withBlankSearch_shouldUseFindByTenantId() {
            // Arrange
            Pageable pageable = PageRequest.of(0, 20);
            Page<UserProfileEntity> page = new PageImpl<>(List.of(), pageable, 0);
            when(userProfileRepository.findByTenantId(TENANT_ID, pageable)).thenReturn(page);

            // Act
            userProfileService.listUsers(TENANT_ID, "   ", pageable);

            // Assert
            verify(userProfileRepository).findByTenantId(TENANT_ID, pageable);
            verify(userProfileRepository, never()).searchByTenantId(any(), any(), any());
        }
    }

    @Nested
    @DisplayName("getUserById")
    class GetUserById {

        @Test
        @DisplayName("Should return user when found in correct tenant")
        void getUserById_whenExistsInTenant_shouldReturnUser() {
            // Arrange
            when(userProfileRepository.findById(USER_ID)).thenReturn(Optional.of(userEntity));
            when(userMapper.toProfileDTO(userEntity)).thenReturn(userDTO);

            // Act
            UserProfileDTO result = userProfileService.getUserById(USER_ID, TENANT_ID);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.id()).isEqualTo(USER_ID);
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when user not found")
        void getUserById_whenNotFound_shouldThrowException() {
            // Arrange
            when(userProfileRepository.findById(USER_ID)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() ->
                userProfileService.getUserById(USER_ID, TENANT_ID)
            ).isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when user belongs to different tenant")
        void getUserById_whenDifferentTenant_shouldThrowException() {
            // Arrange
            when(userProfileRepository.findById(USER_ID)).thenReturn(Optional.of(userEntity));

            // Act & Assert
            assertThatThrownBy(() ->
                userProfileService.getUserById(USER_ID, "tenant-other")
            ).isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("getUserByKeycloakId")
    class GetUserByKeycloakId {

        @Test
        @DisplayName("Should return user when keycloak ID exists")
        void getUserByKeycloakId_whenExists_shouldReturnUser() {
            // Arrange
            when(userProfileRepository.findByKeycloakId(KEYCLOAK_ID)).thenReturn(Optional.of(userEntity));
            when(userMapper.toProfileDTO(userEntity)).thenReturn(userDTO);
            when(userProfileRepository.findById(USER_ID)).thenReturn(Optional.of(userEntity));

            // Act
            UserProfileDTO result = userProfileService.getUserByKeycloakId(KEYCLOAK_ID);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.keycloakId()).isEqualTo(KEYCLOAK_ID);
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when keycloak ID not found")
        void getUserByKeycloakId_whenNotFound_shouldThrowException() {
            // Arrange
            when(userProfileRepository.findByKeycloakId(KEYCLOAK_ID)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() ->
                userProfileService.getUserByKeycloakId(KEYCLOAK_ID)
            ).isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("createUser")
    class CreateUser {

        @Test
        @DisplayName("Should create user in Keycloak and locally")
        void createUser_withValidRequest_shouldCreateInBothKeycloakAndLocal() {
            // Arrange
            UUID creatorKeycloakId = UUID.randomUUID();
            UUID newKeycloakId = UUID.randomUUID();
            CreateUserRequest request = CreateUserRequest.builder()
                .email("new.user@acme.com")
                .password("SecurePass123!")
                .firstName("New")
                .lastName("User")
                .displayName("New User")
                .jobTitle("Analyst")
                .department("Finance")
                .phone("+1111111111")
                .build();

            when(keycloakSyncService.createUserInKeycloak(TENANT_ID, request)).thenReturn(newKeycloakId);
            when(userProfileRepository.save(any(UserProfileEntity.class))).thenAnswer(inv -> {
                UserProfileEntity e = inv.getArgument(0);
                e.setId(UUID.randomUUID());
                return e;
            });
            when(userMapper.toProfileDTO(any(UserProfileEntity.class))).thenReturn(userDTO);
            when(userProfileRepository.findById(any())).thenReturn(Optional.empty());

            // Act
            UserProfileDTO result = userProfileService.createUser(TENANT_ID, request, creatorKeycloakId);

            // Assert
            assertThat(result).isNotNull();
            verify(keycloakSyncService).createUserInKeycloak(TENANT_ID, request);

            ArgumentCaptor<UserProfileEntity> captor = ArgumentCaptor.forClass(UserProfileEntity.class);
            verify(userProfileRepository).save(captor.capture());
            UserProfileEntity saved = captor.getValue();
            assertThat(saved.getEmail()).isEqualTo("new.user@acme.com");
            assertThat(saved.getKeycloakId()).isEqualTo(newKeycloakId);
            assertThat(saved.getTenantId()).isEqualTo(TENANT_ID);
            assertThat(saved.getStatus()).isEqualTo(UserStatus.ACTIVE);
            assertThat(saved.getFirstName()).isEqualTo("New");
            assertThat(saved.getLastName()).isEqualTo("User");
            assertThat(saved.getJobTitle()).isEqualTo("Analyst");
            assertThat(saved.getDepartment()).isEqualTo("Finance");
        }

        @Test
        @DisplayName("Should set managerId when provided in request")
        void createUser_withManagerId_shouldSetManagerId() {
            // Arrange
            CreateUserRequest request = CreateUserRequest.builder()
                .email("new.user@acme.com")
                .password("SecurePass123!")
                .managerId(MANAGER_ID)
                .build();

            UUID newKeycloakId = UUID.randomUUID();
            when(keycloakSyncService.createUserInKeycloak(TENANT_ID, request)).thenReturn(newKeycloakId);
            when(userProfileRepository.save(any(UserProfileEntity.class))).thenAnswer(inv -> inv.getArgument(0));
            when(userMapper.toProfileDTO(any(UserProfileEntity.class))).thenReturn(userDTO);
            when(userProfileRepository.findById(any())).thenReturn(Optional.empty());

            // Act
            userProfileService.createUser(TENANT_ID, request, UUID.randomUUID());

            // Assert
            ArgumentCaptor<UserProfileEntity> captor = ArgumentCaptor.forClass(UserProfileEntity.class);
            verify(userProfileRepository).save(captor.capture());
            assertThat(captor.getValue().getManagerId()).isEqualTo(MANAGER_ID);
        }
    }

    @Nested
    @DisplayName("updateUser (admin)")
    class UpdateUser {

        @Test
        @DisplayName("Should update all fields including admin-only fields")
        void updateUser_withAdminRequest_shouldUpdateAllFields() {
            // Arrange
            UserProfileUpdateRequest request = UserProfileUpdateRequest.builder()
                .displayName("Updated Name")
                .firstName("UpdatedFirst")
                .lastName("UpdatedLast")
                .jobTitle("Senior Engineer")
                .department("Platform")
                .officeLocation("Building B")
                .employeeId("EMP-999")
                .employeeType("CONTRACT")
                .managerId(MANAGER_ID)
                .phone("+5555555555")
                .mobile("+6666666666")
                .avatarUrl("https://example.com/avatar.png")
                .timezone("Europe/London")
                .locale("en-GB")
                .build();

            when(userProfileRepository.findById(USER_ID)).thenReturn(Optional.of(userEntity));
            when(userProfileRepository.save(any(UserProfileEntity.class))).thenReturn(userEntity);
            when(userMapper.toProfileDTO(any(UserProfileEntity.class))).thenReturn(userDTO);

            // Act
            userProfileService.updateUser(USER_ID, TENANT_ID, request);

            // Assert
            ArgumentCaptor<UserProfileEntity> captor = ArgumentCaptor.forClass(UserProfileEntity.class);
            verify(userProfileRepository).save(captor.capture());
            UserProfileEntity saved = captor.getValue();
            assertThat(saved.getFirstName()).isEqualTo("UpdatedFirst");
            assertThat(saved.getLastName()).isEqualTo("UpdatedLast");
            assertThat(saved.getJobTitle()).isEqualTo("Senior Engineer");
            assertThat(saved.getDepartment()).isEqualTo("Platform");
            assertThat(saved.getOfficeLocation()).isEqualTo("Building B");
            assertThat(saved.getEmployeeId()).isEqualTo("EMP-999");
            assertThat(saved.getEmployeeType()).isEqualTo("CONTRACT");
            assertThat(saved.getManagerId()).isEqualTo(MANAGER_ID);
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when user belongs to different tenant")
        void updateUser_whenDifferentTenant_shouldThrowException() {
            // Arrange
            UserProfileUpdateRequest request = UserProfileUpdateRequest.builder().build();
            when(userProfileRepository.findById(USER_ID)).thenReturn(Optional.of(userEntity));

            // Act & Assert
            assertThatThrownBy(() ->
                userProfileService.updateUser(USER_ID, "tenant-other", request)
            ).isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("deleteUser")
    class DeleteUser {

        @Test
        @DisplayName("Should soft delete user and remove from Keycloak")
        void deleteUser_whenExists_shouldSoftDeleteAndRemoveFromKeycloak() {
            // Arrange
            when(userProfileRepository.findById(USER_ID)).thenReturn(Optional.of(userEntity));

            // Act
            userProfileService.deleteUser(USER_ID, TENANT_ID);

            // Assert
            verify(keycloakSyncService).deleteUserInKeycloak(KEYCLOAK_ID, TENANT_ID);
            ArgumentCaptor<UserProfileEntity> captor = ArgumentCaptor.forClass(UserProfileEntity.class);
            verify(userProfileRepository).save(captor.capture());
            assertThat(captor.getValue().getStatus()).isEqualTo(UserStatus.DELETED);
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when user not found")
        void deleteUser_whenNotFound_shouldThrowException() {
            // Arrange
            when(userProfileRepository.findById(USER_ID)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() ->
                userProfileService.deleteUser(USER_ID, TENANT_ID)
            ).isInstanceOf(ResourceNotFoundException.class);
            verify(keycloakSyncService, never()).deleteUserInKeycloak(any(), any());
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when user belongs to different tenant")
        void deleteUser_whenDifferentTenant_shouldThrowException() {
            // Arrange
            when(userProfileRepository.findById(USER_ID)).thenReturn(Optional.of(userEntity));

            // Act & Assert
            assertThatThrownBy(() ->
                userProfileService.deleteUser(USER_ID, "tenant-other")
            ).isInstanceOf(ResourceNotFoundException.class);
            verify(keycloakSyncService, never()).deleteUserInKeycloak(any(), any());
        }
    }

    @Nested
    @DisplayName("enableUser")
    class EnableUser {

        @Test
        @DisplayName("Should enable user locally and in Keycloak")
        void enableUser_whenExists_shouldEnableInBothSystems() {
            // Arrange
            userEntity.setStatus(UserStatus.SUSPENDED);
            when(userProfileRepository.findById(USER_ID)).thenReturn(Optional.of(userEntity));

            // Act
            userProfileService.enableUser(USER_ID, TENANT_ID);

            // Assert
            verify(keycloakSyncService).enableUserInKeycloak(KEYCLOAK_ID, TENANT_ID);
            ArgumentCaptor<UserProfileEntity> captor = ArgumentCaptor.forClass(UserProfileEntity.class);
            verify(userProfileRepository).save(captor.capture());
            assertThat(captor.getValue().getStatus()).isEqualTo(UserStatus.ACTIVE);
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when user not found")
        void enableUser_whenNotFound_shouldThrowException() {
            // Arrange
            when(userProfileRepository.findById(USER_ID)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() ->
                userProfileService.enableUser(USER_ID, TENANT_ID)
            ).isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("disableUser")
    class DisableUser {

        @Test
        @DisplayName("Should disable user locally and in Keycloak")
        void disableUser_whenExists_shouldDisableInBothSystems() {
            // Arrange
            when(userProfileRepository.findById(USER_ID)).thenReturn(Optional.of(userEntity));

            // Act
            userProfileService.disableUser(USER_ID, TENANT_ID);

            // Assert
            verify(keycloakSyncService).disableUserInKeycloak(KEYCLOAK_ID, TENANT_ID);
            ArgumentCaptor<UserProfileEntity> captor = ArgumentCaptor.forClass(UserProfileEntity.class);
            verify(userProfileRepository).save(captor.capture());
            assertThat(captor.getValue().getStatus()).isEqualTo(UserStatus.SUSPENDED);
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when user not found")
        void disableUser_whenNotFound_shouldThrowException() {
            // Arrange
            when(userProfileRepository.findById(USER_ID)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() ->
                userProfileService.disableUser(USER_ID, TENANT_ID)
            ).isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("syncFromKeycloak")
    class SyncFromKeycloak {

        @Test
        @DisplayName("Should delegate to KeycloakSyncService and return mapped DTO")
        void syncFromKeycloak_shouldDelegateAndReturnDTO() {
            // Arrange
            when(keycloakSyncService.syncUser(KEYCLOAK_ID, TENANT_ID)).thenReturn(userEntity);
            when(userMapper.toProfileDTO(userEntity)).thenReturn(userDTO);
            when(userProfileRepository.findById(USER_ID)).thenReturn(Optional.of(userEntity));

            // Act
            UserProfileDTO result = userProfileService.syncFromKeycloak(KEYCLOAK_ID, TENANT_ID);

            // Assert
            assertThat(result).isNotNull();
            verify(keycloakSyncService).syncUser(KEYCLOAK_ID, TENANT_ID);
            verify(userMapper).toProfileDTO(userEntity);
        }
    }
}
