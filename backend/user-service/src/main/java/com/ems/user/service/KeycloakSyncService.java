package com.ems.user.service;

import com.ems.common.enums.UserStatus;
import com.ems.user.dto.CreateUserRequest;
import com.ems.user.entity.UserProfileEntity;
import com.ems.user.repository.UserProfileRepository;
import jakarta.ws.rs.core.Response;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.admin.client.resource.UserResource;
import org.keycloak.admin.client.resource.UsersResource;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class KeycloakSyncService {

    private final Keycloak keycloak;
    private final UserProfileRepository userProfileRepository;

    @Value("${keycloak.admin.server-url}")
    private String keycloakServerUrl;

    public UserProfileEntity syncUser(UUID keycloakId, String tenantId) {
        log.info("Syncing user from Keycloak: {} in tenant: {}", keycloakId, tenantId);

        String realmName = resolveRealmName(tenantId);
        RealmResource realm = keycloak.realm(realmName);
        UserResource userResource = realm.users().get(keycloakId.toString());
        UserRepresentation kcUser = userResource.toRepresentation();

        // Check if user already exists locally
        UserProfileEntity user = userProfileRepository.findByKeycloakId(keycloakId)
            .orElse(UserProfileEntity.builder()
                .keycloakId(keycloakId)
                .tenantId(tenantId)
                .build());

        // Sync fields from Keycloak
        user.setEmail(kcUser.getEmail());
        user.setEmailVerified(kcUser.isEmailVerified());
        user.setFirstName(kcUser.getFirstName());
        user.setLastName(kcUser.getLastName());
        user.setStatus(kcUser.isEnabled() ? UserStatus.ACTIVE : UserStatus.SUSPENDED);

        // Set display name if not already set
        if (user.getDisplayName() == null) {
            user.setDisplayName(String.format("%s %s",
                kcUser.getFirstName() != null ? kcUser.getFirstName() : "",
                kcUser.getLastName() != null ? kcUser.getLastName() : "").trim());
        }

        user = userProfileRepository.save(user);
        log.info("Synced user: {} with id: {}", user.getEmail(), user.getId());

        return user;
    }

    @Transactional
    public UUID createUserInKeycloak(String tenantId, CreateUserRequest request) {
        log.info("Creating user in Keycloak: {} for tenant: {}", request.email(), tenantId);

        String realmName = resolveRealmName(tenantId);
        RealmResource realm = keycloak.realm(realmName);
        UsersResource usersResource = realm.users();

        // Create user representation
        UserRepresentation user = new UserRepresentation();
        user.setEmail(request.email());
        user.setUsername(request.email());
        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());
        user.setEnabled(true);
        user.setEmailVerified(false);

        // Create user
        Response response = usersResource.create(user);
        if (response.getStatus() != 201) {
            String error = response.readEntity(String.class);
            log.error("Failed to create user in Keycloak: {}", error);
            throw new RuntimeException("Failed to create user in Keycloak: " + error);
        }

        // Extract user ID from response location header
        String location = response.getHeaderString("Location");
        String userId = location.substring(location.lastIndexOf('/') + 1);
        UUID keycloakUserId = UUID.fromString(userId);

        // Set password
        CredentialRepresentation credential = new CredentialRepresentation();
        credential.setType(CredentialRepresentation.PASSWORD);
        credential.setValue(request.password());
        credential.setTemporary(true); // User must change password on first login

        usersResource.get(userId).resetPassword(credential);

        log.info("Created user in Keycloak: {} with id: {}", request.email(), keycloakUserId);
        return keycloakUserId;
    }

    public void deleteUserInKeycloak(UUID keycloakId, String tenantId) {
        log.info("Deleting user in Keycloak: {} for tenant: {}", keycloakId, tenantId);

        String realmName = resolveRealmName(tenantId);
        RealmResource realm = keycloak.realm(realmName);

        try {
            realm.users().get(keycloakId.toString()).remove();
            log.info("Deleted user in Keycloak: {}", keycloakId);
        } catch (Exception e) {
            log.error("Failed to delete user in Keycloak: {}", keycloakId, e);
            throw new RuntimeException("Failed to delete user in Keycloak", e);
        }
    }

    public void enableUserInKeycloak(UUID keycloakId, String tenantId) {
        log.info("Enabling user in Keycloak: {} for tenant: {}", keycloakId, tenantId);

        String realmName = resolveRealmName(tenantId);
        RealmResource realm = keycloak.realm(realmName);
        UserResource userResource = realm.users().get(keycloakId.toString());

        UserRepresentation user = userResource.toRepresentation();
        user.setEnabled(true);
        userResource.update(user);

        log.info("Enabled user in Keycloak: {}", keycloakId);
    }

    public void disableUserInKeycloak(UUID keycloakId, String tenantId) {
        log.info("Disabling user in Keycloak: {} for tenant: {}", keycloakId, tenantId);

        String realmName = resolveRealmName(tenantId);
        RealmResource realm = keycloak.realm(realmName);
        UserResource userResource = realm.users().get(keycloakId.toString());

        UserRepresentation user = userResource.toRepresentation();
        user.setEnabled(false);
        userResource.update(user);

        log.info("Disabled user in Keycloak: {}", keycloakId);
    }

    private String resolveRealmName(String tenantId) {
        // Tenant ID maps to Keycloak realm
        if (tenantId.startsWith("tenant-")) {
            return tenantId;
        }
        return "tenant-" + tenantId;
    }
}
