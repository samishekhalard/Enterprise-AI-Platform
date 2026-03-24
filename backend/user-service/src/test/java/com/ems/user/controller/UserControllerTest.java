package com.ems.user.controller;

import com.ems.common.enums.DeviceTrustLevel;
import com.ems.common.enums.DeviceType;
import com.ems.common.enums.SessionStatus;
import com.ems.common.enums.UserStatus;
import com.ems.common.exception.ResourceNotFoundException;
import com.ems.user.config.GlobalExceptionHandler;
import com.ems.user.dto.*;
import com.ems.user.service.DeviceService;
import com.ems.user.service.SessionService;
import com.ems.user.service.UserProfileService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
@DisplayName("UserController Unit Tests")
class UserControllerTest {

    @Mock
    private UserProfileService userProfileService;

    @Mock
    private SessionService sessionService;

    @Mock
    private DeviceService deviceService;

    @InjectMocks
    private UserController userController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    private static final String TENANT_ID = "tenant-acme";
    private static final UUID USER_ID = UUID.randomUUID();
    private static final UUID KEYCLOAK_ID = UUID.randomUUID();
    private static final UUID DEVICE_ID = UUID.randomUUID();
    private static final UUID SESSION_ID = UUID.randomUUID();

    private UserProfileDTO userProfileDTO;
    private Jwt jwt;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(userController)
            .setControllerAdvice(new GlobalExceptionHandler())
            .build();
        objectMapper = new ObjectMapper();
        objectMapper.findAndRegisterModules();

        userProfileDTO = UserProfileDTO.builder()
            .id(USER_ID)
            .keycloakId(KEYCLOAK_ID)
            .tenantId(TENANT_ID)
            .email("john.doe@acme.com")
            .firstName("John")
            .lastName("Doe")
            .fullName("John Doe")
            .displayName("John Doe")
            .status(UserStatus.ACTIVE)
            .build();

        jwt = Jwt.withTokenValue("token")
            .header("alg", "RS256")
            .subject(KEYCLOAK_ID.toString())
            .claim("realm_access", java.util.Map.of("roles", List.of("ADMIN")))
            .build();
    }

    @Nested
    @DisplayName("Admin Endpoints")
    class AdminEndpoints {

        @Test
        @DisplayName("GET /api/v1/users should return paginated user list")
        void listUsers_shouldReturnPaginatedUserList() throws Exception {
            // Arrange
            UserListResponse response = UserListResponse.builder()
                .users(List.of(userProfileDTO))
                .page(1)
                .limit(20)
                .total(1)
                .totalPages(1)
                .build();
            when(userProfileService.listUsers(eq(TENANT_ID), eq(null), any())).thenReturn(response);

            // Act & Assert
            mockMvc.perform(get("/api/v1/users")
                    .header("X-Tenant-ID", TENANT_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.users", hasSize(1)))
                .andExpect(jsonPath("$.total", is(1)))
                .andExpect(jsonPath("$.page", is(1)));
        }

        @Test
        @DisplayName("GET /api/v1/users with search should pass search parameter")
        void listUsers_withSearch_shouldPassSearchParam() throws Exception {
            // Arrange
            UserListResponse response = UserListResponse.builder()
                .users(List.of())
                .page(1)
                .limit(20)
                .total(0)
                .totalPages(0)
                .build();
            when(userProfileService.listUsers(eq(TENANT_ID), eq("john"), any())).thenReturn(response);

            // Act & Assert
            mockMvc.perform(get("/api/v1/users")
                    .header("X-Tenant-ID", TENANT_ID)
                    .param("search", "john"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.users", hasSize(0)));
        }

        @Test
        @DisplayName("GET /api/v1/users/{userId} should return user profile")
        void getUserById_shouldReturnUserProfile() throws Exception {
            // Arrange
            when(userProfileService.getUserById(USER_ID, TENANT_ID)).thenReturn(userProfileDTO);

            // Act & Assert
            mockMvc.perform(get("/api/v1/users/{userId}", USER_ID)
                    .header("X-Tenant-ID", TENANT_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email", is("john.doe@acme.com")))
                .andExpect(jsonPath("$.firstName", is("John")));
        }

        @Test
        @DisplayName("GET /api/v1/users/{userId} should return 404 when not found")
        void getUserById_whenNotFound_shouldReturn404() throws Exception {
            // Arrange
            when(userProfileService.getUserById(USER_ID, TENANT_ID))
                .thenThrow(new ResourceNotFoundException("User", USER_ID.toString()));

            // Act & Assert
            mockMvc.perform(get("/api/v1/users/{userId}", USER_ID)
                    .header("X-Tenant-ID", TENANT_ID))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error", is("resource_not_found")));
        }

        @Test
        @DisplayName("PATCH /api/v1/users/{userId} should update user")
        void updateUser_shouldReturnUpdatedProfile() throws Exception {
            // Arrange
            UserProfileUpdateRequest request = UserProfileUpdateRequest.builder()
                .displayName("Updated Name")
                .build();
            when(userProfileService.updateUser(eq(USER_ID), eq(TENANT_ID), any())).thenReturn(userProfileDTO);

            // Act & Assert
            mockMvc.perform(patch("/api/v1/users/{userId}", USER_ID)
                    .header("X-Tenant-ID", TENANT_ID)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("DELETE /api/v1/users/{userId} should return 204")
        void deleteUser_shouldReturn204() throws Exception {
            // Arrange
            doNothing().when(userProfileService).deleteUser(USER_ID, TENANT_ID);

            // Act & Assert
            mockMvc.perform(delete("/api/v1/users/{userId}", USER_ID)
                    .header("X-Tenant-ID", TENANT_ID))
                .andExpect(status().isNoContent());
            verify(userProfileService).deleteUser(USER_ID, TENANT_ID);
        }

        @Test
        @DisplayName("POST /api/v1/users/{userId}/enable should return 204")
        void enableUser_shouldReturn204() throws Exception {
            // Arrange
            doNothing().when(userProfileService).enableUser(USER_ID, TENANT_ID);

            // Act & Assert
            mockMvc.perform(post("/api/v1/users/{userId}/enable", USER_ID)
                    .header("X-Tenant-ID", TENANT_ID))
                .andExpect(status().isNoContent());
            verify(userProfileService).enableUser(USER_ID, TENANT_ID);
        }

        @Test
        @DisplayName("POST /api/v1/users/{userId}/disable should return 204")
        void disableUser_shouldReturn204() throws Exception {
            // Arrange
            doNothing().when(userProfileService).disableUser(USER_ID, TENANT_ID);

            // Act & Assert
            mockMvc.perform(post("/api/v1/users/{userId}/disable", USER_ID)
                    .header("X-Tenant-ID", TENANT_ID))
                .andExpect(status().isNoContent());
            verify(userProfileService).disableUser(USER_ID, TENANT_ID);
        }
    }

    @Nested
    @DisplayName("Admin Session Endpoints")
    class AdminSessionEndpoints {

        @Test
        @DisplayName("GET /api/v1/users/{userId}/sessions should return sessions")
        void getUserSessions_shouldReturnSessions() throws Exception {
            // Arrange
            UserSessionDTO sessionDTO = UserSessionDTO.builder()
                .id(SESSION_ID)
                .ipAddress("192.168.1.100")
                .status(SessionStatus.ACTIVE)
                .isCurrent(false)
                .build();
            when(sessionService.getUserSessions(USER_ID, TENANT_ID)).thenReturn(List.of(sessionDTO));

            // Act & Assert
            mockMvc.perform(get("/api/v1/users/{userId}/sessions", USER_ID)
                    .header("X-Tenant-ID", TENANT_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].ipAddress", is("192.168.1.100")));
        }
    }

    @Nested
    @DisplayName("Admin Device Endpoints")
    class AdminDeviceEndpoints {

        @Test
        @DisplayName("GET /api/v1/users/{userId}/devices should return devices")
        void getUserDevices_shouldReturnDevices() throws Exception {
            // Arrange
            UserDeviceDTO deviceDTO = UserDeviceDTO.builder()
                .id(DEVICE_ID)
                .deviceName("Chrome on MacOS")
                .deviceType(DeviceType.BROWSER)
                .trustLevel(DeviceTrustLevel.UNKNOWN)
                .build();
            when(deviceService.getUserDevices(USER_ID, TENANT_ID)).thenReturn(List.of(deviceDTO));

            // Act & Assert
            mockMvc.perform(get("/api/v1/users/{userId}/devices", USER_ID)
                    .header("X-Tenant-ID", TENANT_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].deviceName", is("Chrome on MacOS")));
        }
    }

    @Nested
    @DisplayName("Tenant Admin Endpoints")
    class TenantAdminEndpoints {

        @Test
        @DisplayName("GET /api/v1/admin/sessions should return tenant sessions")
        void getTenantSessions_shouldReturnSessions() throws Exception {
            // Arrange
            UserSessionDTO sessionDTO = UserSessionDTO.builder()
                .id(SESSION_ID)
                .status(SessionStatus.ACTIVE)
                .isCurrent(false)
                .build();
            when(sessionService.getTenantSessions(TENANT_ID)).thenReturn(List.of(sessionDTO));

            // Act & Assert
            mockMvc.perform(get("/api/v1/admin/sessions")
                    .header("X-Tenant-ID", TENANT_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));
        }
    }

    @Nested
    @DisplayName("Sync Endpoints")
    class SyncEndpoints {

        @Test
        @DisplayName("POST /api/v1/internal/users/{keycloakId}/sync should sync from Keycloak")
        void syncFromKeycloak_shouldReturnSyncedProfile() throws Exception {
            // Arrange
            when(userProfileService.syncFromKeycloak(KEYCLOAK_ID, TENANT_ID)).thenReturn(userProfileDTO);

            // Act & Assert
            mockMvc.perform(post("/api/v1/internal/users/{keycloakId}/sync", KEYCLOAK_ID)
                    .header("X-Tenant-ID", TENANT_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email", is("john.doe@acme.com")));
        }
    }

    @Nested
    @DisplayName("getAuthenticatedUserId (private method, tested via endpoints)")
    class AuthenticatedUserIdExtraction {

        @Test
        @DisplayName("Should return 400 when JWT subject is null (via IllegalArgument handler)")
        void getAuthenticatedUserId_whenSubjectNull_shouldReturn400() throws Exception {
            // The controller calls getAuthenticatedUserId which throws IllegalArgumentException
            // when JWT is null. For standalone MockMvc without security, the @AuthenticationPrincipal
            // resolves to null. The controller should throw IllegalArgumentException.

            // Act & Assert
            mockMvc.perform(get("/api/v1/users/me")
                    .header("X-Tenant-ID", TENANT_ID))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", is("invalid_argument")));
        }
    }
}
