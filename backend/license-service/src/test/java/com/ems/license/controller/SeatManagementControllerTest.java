package com.ems.license.controller;

import com.ems.license.config.GlobalExceptionHandler;
import com.ems.license.dto.SeatAssignmentResponse;
import com.ems.license.entity.TenantLicenseEntity;
import com.ems.license.entity.TierSeatAllocationEntity;
import com.ems.license.entity.UserLicenseAssignmentEntity;
import com.ems.license.entity.UserTier;
import com.ems.license.repository.TenantLicenseRepository;
import com.ems.license.repository.TierSeatAllocationRepository;
import com.ems.license.repository.UserLicenseAssignmentRepository;
import com.ems.license.service.SeatValidationService;
import com.ems.common.exception.ResourceNotFoundException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(SeatManagementController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
@DisplayName("SeatManagementController")
class SeatManagementControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserLicenseAssignmentRepository assignmentRepository;

    @MockBean
    private TenantLicenseRepository tenantLicenseRepository;

    @MockBean
    private TierSeatAllocationRepository tierSeatAllocationRepository;

    @MockBean
    private SeatValidationService seatValidationService;

    private static final String TENANT_ID = "tenant-1";
    private static final UUID ADMIN_USER_ID = UUID.randomUUID();
    private static final UUID USER_ID = UUID.randomUUID();
    private static final UUID TENANT_LICENSE_ID = UUID.randomUUID();

    @Nested
    @DisplayName("POST /api/v1/tenants/{tenantId}/seats")
    class AssignSeat {

        @Test
        @DisplayName("Should return 201 when seat assignment succeeds")
        void shouldReturn201_whenAssignmentSucceeds() throws Exception {
            // Arrange
            TenantLicenseEntity tenantLicense = TenantLicenseEntity.builder()
                    .id(TENANT_LICENSE_ID)
                    .tenantId(TENANT_ID)
                    .displayName("Test Tenant")
                    .expiresAt(Instant.now().plus(365, ChronoUnit.DAYS))
                    .build();

            given(tenantLicenseRepository.findByTenantId(TENANT_ID))
                    .willReturn(List.of(tenantLicense));
            given(assignmentRepository.findByUserIdAndTenantId(USER_ID, TENANT_ID))
                    .willReturn(Optional.empty());
            given(seatValidationService.hasAvailableSeats(TENANT_ID, UserTier.CONTRIBUTOR))
                    .willReturn(true);

            UUID assignmentId = UUID.randomUUID();
            given(assignmentRepository.save(any(UserLicenseAssignmentEntity.class)))
                    .willAnswer(inv -> {
                        UserLicenseAssignmentEntity entity = inv.getArgument(0);
                        entity.setId(assignmentId);
                        return entity;
                    });

            String requestBody = """
                {
                  "userId": "%s",
                  "tenantId": "%s",
                  "tier": "CONTRIBUTOR"
                }
                """.formatted(USER_ID, TENANT_ID);

            // Act & Assert
            mockMvc.perform(post("/api/v1/tenants/{tenantId}/seats", TENANT_ID)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody)
                            .principal(() -> ADMIN_USER_ID.toString()))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.userId").value(USER_ID.toString()))
                    .andExpect(jsonPath("$.tenantId").value(TENANT_ID))
                    .andExpect(jsonPath("$.tier").value("CONTRIBUTOR"));

            verify(seatValidationService).invalidateCache(TENANT_ID, USER_ID);
        }

        @Test
        @DisplayName("Should return 400 when user already has a seat assignment (conflict)")
        void shouldReturn400_whenUserAlreadyAssigned() throws Exception {
            // Arrange
            TenantLicenseEntity tenantLicense = TenantLicenseEntity.builder()
                    .id(TENANT_LICENSE_ID)
                    .tenantId(TENANT_ID)
                    .displayName("Test Tenant")
                    .expiresAt(Instant.now().plus(365, ChronoUnit.DAYS))
                    .build();

            UserLicenseAssignmentEntity existingAssignment = UserLicenseAssignmentEntity.builder()
                    .id(UUID.randomUUID())
                    .userId(USER_ID)
                    .tenantId(TENANT_ID)
                    .tier(UserTier.VIEWER)
                    .build();

            given(tenantLicenseRepository.findByTenantId(TENANT_ID))
                    .willReturn(List.of(tenantLicense));
            given(assignmentRepository.findByUserIdAndTenantId(USER_ID, TENANT_ID))
                    .willReturn(Optional.of(existingAssignment));

            String requestBody = """
                {
                  "userId": "%s",
                  "tenantId": "%s",
                  "tier": "CONTRIBUTOR"
                }
                """.formatted(USER_ID, TENANT_ID);

            // Act & Assert
            mockMvc.perform(post("/api/v1/tenants/{tenantId}/seats", TENANT_ID)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody)
                            .principal(() -> ADMIN_USER_ID.toString()))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.error").value("already_assigned"));
        }

        @Test
        @DisplayName("Should return 400 when no seats available for tier")
        void shouldReturn400_whenNoSeatsAvailable() throws Exception {
            // Arrange
            TenantLicenseEntity tenantLicense = TenantLicenseEntity.builder()
                    .id(TENANT_LICENSE_ID)
                    .tenantId(TENANT_ID)
                    .displayName("Test Tenant")
                    .expiresAt(Instant.now().plus(365, ChronoUnit.DAYS))
                    .build();

            given(tenantLicenseRepository.findByTenantId(TENANT_ID))
                    .willReturn(List.of(tenantLicense));
            given(assignmentRepository.findByUserIdAndTenantId(USER_ID, TENANT_ID))
                    .willReturn(Optional.empty());
            given(seatValidationService.hasAvailableSeats(TENANT_ID, UserTier.TENANT_ADMIN))
                    .willReturn(false);

            String requestBody = """
                {
                  "userId": "%s",
                  "tenantId": "%s",
                  "tier": "TENANT_ADMIN"
                }
                """.formatted(USER_ID, TENANT_ID);

            // Act & Assert
            mockMvc.perform(post("/api/v1/tenants/{tenantId}/seats", TENANT_ID)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody)
                            .principal(() -> ADMIN_USER_ID.toString()))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.error").value("no_seats_available"));
        }

        @Test
        @DisplayName("Should return 404 when tenant license not found")
        void shouldReturn404_whenTenantLicenseNotFound() throws Exception {
            // Arrange
            given(tenantLicenseRepository.findByTenantId(TENANT_ID))
                    .willReturn(Collections.emptyList());

            String requestBody = """
                {
                  "userId": "%s",
                  "tenantId": "%s",
                  "tier": "CONTRIBUTOR"
                }
                """.formatted(USER_ID, TENANT_ID);

            // Act & Assert
            mockMvc.perform(post("/api/v1/tenants/{tenantId}/seats", TENANT_ID)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody)
                            .principal(() -> ADMIN_USER_ID.toString()))
                    .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("Should return 400 when tenant ID in body does not match path")
        void shouldReturn400_whenTenantIdMismatch() throws Exception {
            // Arrange
            String requestBody = """
                {
                  "userId": "%s",
                  "tenantId": "different-tenant",
                  "tier": "CONTRIBUTOR"
                }
                """.formatted(USER_ID);

            // Act & Assert
            mockMvc.perform(post("/api/v1/tenants/{tenantId}/seats", TENANT_ID)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody)
                            .principal(() -> ADMIN_USER_ID.toString()))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.error").value("tenant_mismatch"));
        }
    }

    @Nested
    @DisplayName("DELETE /api/v1/tenants/{tenantId}/seats/{userId}")
    class RevokeSeat {

        @Test
        @DisplayName("Should return 204 when seat is revoked successfully")
        void shouldReturn204_whenSeatRevoked() throws Exception {
            // Arrange
            UserLicenseAssignmentEntity assignment = UserLicenseAssignmentEntity.builder()
                    .id(UUID.randomUUID())
                    .userId(USER_ID)
                    .tenantId(TENANT_ID)
                    .tier(UserTier.CONTRIBUTOR)
                    .build();

            given(assignmentRepository.findByUserIdAndTenantId(USER_ID, TENANT_ID))
                    .willReturn(Optional.of(assignment));

            // Act & Assert
            mockMvc.perform(delete("/api/v1/tenants/{tenantId}/seats/{userId}", TENANT_ID, USER_ID))
                    .andExpect(status().isNoContent());

            verify(assignmentRepository).delete(assignment);
            verify(seatValidationService).invalidateCache(TENANT_ID, USER_ID);
        }

        @Test
        @DisplayName("Should return 404 when assignment not found")
        void shouldReturn404_whenAssignmentNotFound() throws Exception {
            // Arrange
            given(assignmentRepository.findByUserIdAndTenantId(USER_ID, TENANT_ID))
                    .willReturn(Optional.empty());

            // Act & Assert
            mockMvc.perform(delete("/api/v1/tenants/{tenantId}/seats/{userId}", TENANT_ID, USER_ID))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("GET /api/v1/tenants/{tenantId}/seats")
    class ListSeats {

        @Test
        @DisplayName("Should return 200 with list of seat assignments")
        void shouldReturn200_withAssignmentList() throws Exception {
            // Arrange
            UserLicenseAssignmentEntity assignment1 = UserLicenseAssignmentEntity.builder()
                    .id(UUID.randomUUID())
                    .userId(UUID.randomUUID())
                    .tenantId(TENANT_ID)
                    .tier(UserTier.TENANT_ADMIN)
                    .assignedAt(Instant.now())
                    .assignedBy(ADMIN_USER_ID)
                    .build();

            UserLicenseAssignmentEntity assignment2 = UserLicenseAssignmentEntity.builder()
                    .id(UUID.randomUUID())
                    .userId(UUID.randomUUID())
                    .tenantId(TENANT_ID)
                    .tier(UserTier.VIEWER)
                    .assignedAt(Instant.now())
                    .assignedBy(ADMIN_USER_ID)
                    .build();

            given(assignmentRepository.findByTenantId(TENANT_ID))
                    .willReturn(List.of(assignment1, assignment2));

            // Act & Assert
            mockMvc.perform(get("/api/v1/tenants/{tenantId}/seats", TENANT_ID))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(2))
                    .andExpect(jsonPath("$[0].tier").value("TENANT_ADMIN"))
                    .andExpect(jsonPath("$[1].tier").value("VIEWER"));
        }

        @Test
        @DisplayName("Should return 200 with empty list when no assignments")
        void shouldReturn200_withEmptyList() throws Exception {
            // Arrange
            given(assignmentRepository.findByTenantId(TENANT_ID))
                    .willReturn(Collections.emptyList());

            // Act & Assert
            mockMvc.perform(get("/api/v1/tenants/{tenantId}/seats", TENANT_ID))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(0));
        }
    }

    @Nested
    @DisplayName("GET /api/v1/tenants/{tenantId}/seats/availability")
    class GetSeatAvailability {

        @Test
        @DisplayName("Should return 200 with seat availability per tier")
        void shouldReturn200_withAvailabilityPerTier() throws Exception {
            // Arrange
            TenantLicenseEntity tenantLicense = TenantLicenseEntity.builder()
                    .id(TENANT_LICENSE_ID)
                    .tenantId(TENANT_ID)
                    .displayName("Test Tenant")
                    .build();

            TierSeatAllocationEntity adminAllocation = TierSeatAllocationEntity.builder()
                    .id(UUID.randomUUID())
                    .tenantLicense(tenantLicense)
                    .tier(UserTier.TENANT_ADMIN)
                    .maxSeats(2)
                    .build();

            TierSeatAllocationEntity viewerAllocation = TierSeatAllocationEntity.builder()
                    .id(UUID.randomUUID())
                    .tenantLicense(tenantLicense)
                    .tier(UserTier.VIEWER)
                    .maxSeats(-1) // unlimited
                    .build();

            given(tenantLicenseRepository.findByTenantId(TENANT_ID))
                    .willReturn(List.of(tenantLicense));
            given(tierSeatAllocationRepository.findByTenantLicenseId(TENANT_LICENSE_ID))
                    .willReturn(List.of(adminAllocation, viewerAllocation));
            given(assignmentRepository.countByTenantIdAndTier(TENANT_ID, UserTier.TENANT_ADMIN))
                    .willReturn(1L);
            given(assignmentRepository.countByTenantIdAndTier(TENANT_ID, UserTier.VIEWER))
                    .willReturn(5L);

            // Act & Assert
            mockMvc.perform(get("/api/v1/tenants/{tenantId}/seats/availability", TENANT_ID))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.TENANT_ADMIN.maxSeats").value(2))
                    .andExpect(jsonPath("$.TENANT_ADMIN.assigned").value(1))
                    .andExpect(jsonPath("$.TENANT_ADMIN.available").value(1))
                    .andExpect(jsonPath("$.TENANT_ADMIN.unlimited").value(false))
                    .andExpect(jsonPath("$.VIEWER.maxSeats").value(-1))
                    .andExpect(jsonPath("$.VIEWER.unlimited").value(true));
        }

        @Test
        @DisplayName("Should return 404 when tenant license not found")
        void shouldReturn404_whenTenantLicenseNotFound() throws Exception {
            // Arrange
            given(tenantLicenseRepository.findByTenantId(TENANT_ID))
                    .willReturn(Collections.emptyList());

            // Act & Assert
            mockMvc.perform(get("/api/v1/tenants/{tenantId}/seats/availability", TENANT_ID))
                    .andExpect(status().isNotFound());
        }
    }

}
