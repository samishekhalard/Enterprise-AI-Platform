package com.ems.user.service;

import com.ems.common.enums.UserStatus;
import com.ems.user.dto.CreateUserRequest;
import com.ems.user.entity.UserProfileEntity;
import com.ems.user.repository.UserProfileRepository;
import jakarta.ws.rs.core.Response;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.admin.client.resource.UserResource;
import org.keycloak.admin.client.resource.UsersResource;
import org.keycloak.representations.idm.UserRepresentation;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("KeycloakSyncService Unit Tests")
class KeycloakSyncServiceTest {

    @Mock
    private Keycloak keycloak;

    @Mock
    private UserProfileRepository userProfileRepository;

    @InjectMocks
    private KeycloakSyncService keycloakSyncService;

    private static final UUID KEYCLOAK_ID = UUID.randomUUID();
    private static final String TENANT_ID = "tenant-acme";

    @Nested
    @DisplayName("syncUser")
    class SyncUser {

        @Test
        @DisplayName("Should create new local profile when user does not exist locally")
        void syncUser_whenUserNotLocal_shouldCreateNewProfile() {
            // Arrange
            RealmResource realmResource = mock(RealmResource.class);
            UsersResource usersResource = mock(UsersResource.class);
            UserResource userResource = mock(UserResource.class);

            UserRepresentation kcUser = new UserRepresentation();
            kcUser.setEmail("keycloak@acme.com");
            kcUser.setFirstName("KC");
            kcUser.setLastName("User");
            kcUser.setEmailVerified(true);
            kcUser.setEnabled(true);

            when(keycloak.realm(TENANT_ID)).thenReturn(realmResource);
            when(realmResource.users()).thenReturn(usersResource);
            when(usersResource.get(KEYCLOAK_ID.toString())).thenReturn(userResource);
            when(userResource.toRepresentation()).thenReturn(kcUser);
            when(userProfileRepository.findByKeycloakId(KEYCLOAK_ID)).thenReturn(Optional.empty());
            when(userProfileRepository.save(any(UserProfileEntity.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act
            UserProfileEntity result = keycloakSyncService.syncUser(KEYCLOAK_ID, TENANT_ID);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getEmail()).isEqualTo("keycloak@acme.com");
            assertThat(result.getFirstName()).isEqualTo("KC");
            assertThat(result.getLastName()).isEqualTo("User");
            assertThat(result.getEmailVerified()).isTrue();
            assertThat(result.getStatus()).isEqualTo(UserStatus.ACTIVE);
            assertThat(result.getDisplayName()).isEqualTo("KC User");
            verify(userProfileRepository).save(any(UserProfileEntity.class));
        }

        @Test
        @DisplayName("Should update existing local profile when user exists locally")
        void syncUser_whenUserExistsLocally_shouldUpdateProfile() {
            // Arrange
            UserProfileEntity existingUser = UserProfileEntity.builder()
                .keycloakId(KEYCLOAK_ID)
                .tenantId(TENANT_ID)
                .email("old@acme.com")
                .displayName("Existing Name")
                .build();

            RealmResource realmResource = mock(RealmResource.class);
            UsersResource usersResource = mock(UsersResource.class);
            UserResource userResource = mock(UserResource.class);

            UserRepresentation kcUser = new UserRepresentation();
            kcUser.setEmail("updated@acme.com");
            kcUser.setFirstName("Updated");
            kcUser.setLastName("Name");
            kcUser.setEmailVerified(true);
            kcUser.setEnabled(true);

            when(keycloak.realm(TENANT_ID)).thenReturn(realmResource);
            when(realmResource.users()).thenReturn(usersResource);
            when(usersResource.get(KEYCLOAK_ID.toString())).thenReturn(userResource);
            when(userResource.toRepresentation()).thenReturn(kcUser);
            when(userProfileRepository.findByKeycloakId(KEYCLOAK_ID)).thenReturn(Optional.of(existingUser));
            when(userProfileRepository.save(any(UserProfileEntity.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act
            UserProfileEntity result = keycloakSyncService.syncUser(KEYCLOAK_ID, TENANT_ID);

            // Assert
            assertThat(result.getEmail()).isEqualTo("updated@acme.com");
            assertThat(result.getDisplayName()).isEqualTo("Existing Name");
        }

        @Test
        @DisplayName("Should set SUSPENDED status when Keycloak user is disabled")
        void syncUser_whenKeycloakUserDisabled_shouldSetSuspendedStatus() {
            // Arrange
            RealmResource realmResource = mock(RealmResource.class);
            UsersResource usersResource = mock(UsersResource.class);
            UserResource userResource = mock(UserResource.class);

            UserRepresentation kcUser = new UserRepresentation();
            kcUser.setEmail("disabled@acme.com");
            kcUser.setEnabled(false);

            when(keycloak.realm(TENANT_ID)).thenReturn(realmResource);
            when(realmResource.users()).thenReturn(usersResource);
            when(usersResource.get(KEYCLOAK_ID.toString())).thenReturn(userResource);
            when(userResource.toRepresentation()).thenReturn(kcUser);
            when(userProfileRepository.findByKeycloakId(KEYCLOAK_ID)).thenReturn(Optional.empty());
            when(userProfileRepository.save(any(UserProfileEntity.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act
            UserProfileEntity result = keycloakSyncService.syncUser(KEYCLOAK_ID, TENANT_ID);

            // Assert
            assertThat(result.getStatus()).isEqualTo(UserStatus.SUSPENDED);
        }

        @Test
        @DisplayName("Should handle null firstName and lastName in display name")
        void syncUser_whenNamesNull_shouldHandleGracefully() {
            // Arrange
            RealmResource realmResource = mock(RealmResource.class);
            UsersResource usersResource = mock(UsersResource.class);
            UserResource userResource = mock(UserResource.class);

            UserRepresentation kcUser = new UserRepresentation();
            kcUser.setEmail("noname@acme.com");
            kcUser.setFirstName(null);
            kcUser.setLastName(null);
            kcUser.setEnabled(true);

            when(keycloak.realm(TENANT_ID)).thenReturn(realmResource);
            when(realmResource.users()).thenReturn(usersResource);
            when(usersResource.get(KEYCLOAK_ID.toString())).thenReturn(userResource);
            when(userResource.toRepresentation()).thenReturn(kcUser);
            when(userProfileRepository.findByKeycloakId(KEYCLOAK_ID)).thenReturn(Optional.empty());
            when(userProfileRepository.save(any(UserProfileEntity.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act
            UserProfileEntity result = keycloakSyncService.syncUser(KEYCLOAK_ID, TENANT_ID);

            // Assert
            assertThat(result.getDisplayName()).isEmpty();
        }
    }

    @Nested
    @DisplayName("createUserInKeycloak")
    class CreateUserInKeycloak {

        @Test
        @DisplayName("Should create user in Keycloak and return UUID")
        void createUserInKeycloak_withValidRequest_shouldReturnKeycloakId() {
            // Arrange
            CreateUserRequest request = CreateUserRequest.builder()
                .email("new@acme.com")
                .password("SecurePass123!")
                .firstName("New")
                .lastName("User")
                .build();

            UUID newKeycloakId = UUID.randomUUID();
            String locationUrl = "http://keycloak/admin/realms/tenant-acme/users/" + newKeycloakId;

            RealmResource realmResource = mock(RealmResource.class);
            UsersResource usersResource = mock(UsersResource.class);
            UserResource userResource = mock(UserResource.class);
            Response response = mock(Response.class);

            when(keycloak.realm(TENANT_ID)).thenReturn(realmResource);
            when(realmResource.users()).thenReturn(usersResource);
            when(usersResource.create(any(UserRepresentation.class))).thenReturn(response);
            when(response.getStatus()).thenReturn(201);
            when(response.getHeaderString("Location")).thenReturn(locationUrl);
            when(usersResource.get(newKeycloakId.toString())).thenReturn(userResource);

            // Act
            UUID result = keycloakSyncService.createUserInKeycloak(TENANT_ID, request);

            // Assert
            assertThat(result).isEqualTo(newKeycloakId);
            verify(userResource).resetPassword(any());
        }

        @Test
        @DisplayName("Should throw RuntimeException when Keycloak returns non-201 status")
        void createUserInKeycloak_whenKeycloakFails_shouldThrowException() {
            // Arrange
            CreateUserRequest request = CreateUserRequest.builder()
                .email("dup@acme.com")
                .password("SecurePass123!")
                .build();

            RealmResource realmResource = mock(RealmResource.class);
            UsersResource usersResource = mock(UsersResource.class);
            Response response = mock(Response.class);

            when(keycloak.realm(TENANT_ID)).thenReturn(realmResource);
            when(realmResource.users()).thenReturn(usersResource);
            when(usersResource.create(any(UserRepresentation.class))).thenReturn(response);
            when(response.getStatus()).thenReturn(409);
            when(response.readEntity(String.class)).thenReturn("User already exists");

            // Act & Assert
            assertThatThrownBy(() ->
                keycloakSyncService.createUserInKeycloak(TENANT_ID, request)
            ).isInstanceOf(RuntimeException.class)
             .hasMessageContaining("Failed to create user in Keycloak");
        }
    }

    @Nested
    @DisplayName("deleteUserInKeycloak")
    class DeleteUserInKeycloak {

        @Test
        @DisplayName("Should remove user from Keycloak realm")
        void deleteUserInKeycloak_shouldRemoveUser() {
            // Arrange
            RealmResource realmResource = mock(RealmResource.class);
            UsersResource usersResource = mock(UsersResource.class);
            UserResource userResource = mock(UserResource.class);

            when(keycloak.realm(TENANT_ID)).thenReturn(realmResource);
            when(realmResource.users()).thenReturn(usersResource);
            when(usersResource.get(KEYCLOAK_ID.toString())).thenReturn(userResource);

            // Act
            keycloakSyncService.deleteUserInKeycloak(KEYCLOAK_ID, TENANT_ID);

            // Assert
            verify(userResource).remove();
        }

        @Test
        @DisplayName("Should throw RuntimeException when Keycloak delete fails")
        void deleteUserInKeycloak_whenFails_shouldThrowException() {
            // Arrange
            RealmResource realmResource = mock(RealmResource.class);
            UsersResource usersResource = mock(UsersResource.class);
            UserResource userResource = mock(UserResource.class);

            when(keycloak.realm(TENANT_ID)).thenReturn(realmResource);
            when(realmResource.users()).thenReturn(usersResource);
            when(usersResource.get(KEYCLOAK_ID.toString())).thenReturn(userResource);
            when(userResource.remove()).thenThrow(new RuntimeException("Connection refused"));

            // Act & Assert
            assertThatThrownBy(() ->
                keycloakSyncService.deleteUserInKeycloak(KEYCLOAK_ID, TENANT_ID)
            ).isInstanceOf(RuntimeException.class)
             .hasMessageContaining("Failed to delete user in Keycloak");
        }
    }

    @Nested
    @DisplayName("enableUserInKeycloak")
    class EnableUserInKeycloak {

        @Test
        @DisplayName("Should enable user in Keycloak realm")
        void enableUserInKeycloak_shouldSetEnabledTrue() {
            // Arrange
            RealmResource realmResource = mock(RealmResource.class);
            UsersResource usersResource = mock(UsersResource.class);
            UserResource userResource = mock(UserResource.class);
            UserRepresentation kcUser = new UserRepresentation();
            kcUser.setEnabled(false);

            when(keycloak.realm(TENANT_ID)).thenReturn(realmResource);
            when(realmResource.users()).thenReturn(usersResource);
            when(usersResource.get(KEYCLOAK_ID.toString())).thenReturn(userResource);
            when(userResource.toRepresentation()).thenReturn(kcUser);

            // Act
            keycloakSyncService.enableUserInKeycloak(KEYCLOAK_ID, TENANT_ID);

            // Assert
            ArgumentCaptor<UserRepresentation> captor = ArgumentCaptor.forClass(UserRepresentation.class);
            verify(userResource).update(captor.capture());
            assertThat(captor.getValue().isEnabled()).isTrue();
        }
    }

    @Nested
    @DisplayName("disableUserInKeycloak")
    class DisableUserInKeycloak {

        @Test
        @DisplayName("Should disable user in Keycloak realm")
        void disableUserInKeycloak_shouldSetEnabledFalse() {
            // Arrange
            RealmResource realmResource = mock(RealmResource.class);
            UsersResource usersResource = mock(UsersResource.class);
            UserResource userResource = mock(UserResource.class);
            UserRepresentation kcUser = new UserRepresentation();
            kcUser.setEnabled(true);

            when(keycloak.realm(TENANT_ID)).thenReturn(realmResource);
            when(realmResource.users()).thenReturn(usersResource);
            when(usersResource.get(KEYCLOAK_ID.toString())).thenReturn(userResource);
            when(userResource.toRepresentation()).thenReturn(kcUser);

            // Act
            keycloakSyncService.disableUserInKeycloak(KEYCLOAK_ID, TENANT_ID);

            // Assert
            ArgumentCaptor<UserRepresentation> captor = ArgumentCaptor.forClass(UserRepresentation.class);
            verify(userResource).update(captor.capture());
            assertThat(captor.getValue().isEnabled()).isFalse();
        }
    }

    @Nested
    @DisplayName("resolveRealmName (tested indirectly)")
    class ResolveRealmName {

        @Test
        @DisplayName("Should use tenant ID as realm when it starts with 'tenant-'")
        void resolveRealmName_whenStartsWithTenantPrefix_shouldUseAsIs() {
            // Arrange
            RealmResource realmResource = mock(RealmResource.class);
            UsersResource usersResource = mock(UsersResource.class);
            UserResource userResource = mock(UserResource.class);
            UserRepresentation kcUser = new UserRepresentation();
            kcUser.setEmail("test@acme.com");
            kcUser.setEnabled(true);

            when(keycloak.realm("tenant-acme")).thenReturn(realmResource);
            when(realmResource.users()).thenReturn(usersResource);
            when(usersResource.get(KEYCLOAK_ID.toString())).thenReturn(userResource);
            when(userResource.toRepresentation()).thenReturn(kcUser);
            when(userProfileRepository.findByKeycloakId(KEYCLOAK_ID)).thenReturn(Optional.empty());
            when(userProfileRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            // Act
            keycloakSyncService.syncUser(KEYCLOAK_ID, "tenant-acme");

            // Assert
            verify(keycloak).realm("tenant-acme");
        }

        @Test
        @DisplayName("Should prepend 'tenant-' when ID does not start with it")
        void resolveRealmName_whenNoPrefix_shouldPrependTenant() {
            // Arrange
            RealmResource realmResource = mock(RealmResource.class);
            UsersResource usersResource = mock(UsersResource.class);
            UserResource userResource = mock(UserResource.class);
            UserRepresentation kcUser = new UserRepresentation();
            kcUser.setEmail("test@acme.com");
            kcUser.setEnabled(true);

            when(keycloak.realm("tenant-acme")).thenReturn(realmResource);
            when(realmResource.users()).thenReturn(usersResource);
            when(usersResource.get(KEYCLOAK_ID.toString())).thenReturn(userResource);
            when(userResource.toRepresentation()).thenReturn(kcUser);
            when(userProfileRepository.findByKeycloakId(KEYCLOAK_ID)).thenReturn(Optional.empty());
            when(userProfileRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            // Act
            keycloakSyncService.syncUser(KEYCLOAK_ID, "acme");

            // Assert
            verify(keycloak).realm("tenant-acme");
        }
    }
}
