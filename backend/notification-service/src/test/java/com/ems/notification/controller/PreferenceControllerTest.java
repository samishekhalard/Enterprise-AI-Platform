package com.ems.notification.controller;

import com.ems.notification.dto.NotificationPreferenceDTO;
import com.ems.notification.dto.UpdatePreferenceRequest;
import com.ems.notification.service.PreferenceService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.bean.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(PreferenceController.class)
@AutoConfigureMockMvc
@DisplayName("PreferenceController Unit Tests")
class PreferenceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private PreferenceService preferenceService;

    private static final String BASE_URL = "/api/v1/notification-preferences";
    private static final String TENANT_ID = "tenant-1";
    private static final UUID USER_ID = UUID.randomUUID();

    private NotificationPreferenceDTO buildPreferenceDTO() {
        return NotificationPreferenceDTO.builder()
                .id(UUID.randomUUID())
                .tenantId(TENANT_ID)
                .userId(USER_ID)
                .emailEnabled(true)
                .pushEnabled(true)
                .smsEnabled(false)
                .inAppEnabled(true)
                .systemNotifications(true)
                .marketingNotifications(false)
                .transactionalNotifications(true)
                .alertNotifications(true)
                .quietHoursEnabled(false)
                .timezone("UTC")
                .digestEnabled(false)
                .digestFrequency("DAILY")
                .build();
    }

    @Nested
    @DisplayName("GET /api/v1/notification-preferences")
    class GetPreferences {

        @Test
        @DisplayName("Should return 200 with preferences for authenticated user")
        void getPreferences_shouldReturn200() throws Exception {
            // Arrange
            when(preferenceService.getPreferences(eq(TENANT_ID), eq(USER_ID)))
                    .thenReturn(buildPreferenceDTO());

            // Act & Assert
            mockMvc.perform(get(BASE_URL)
                            .with(jwt().jwt(j -> j.subject(USER_ID.toString())))
                            .header("X-Tenant-ID", TENANT_ID))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.emailEnabled").value(true))
                    .andExpect(jsonPath("$.smsEnabled").value(false))
                    .andExpect(jsonPath("$.timezone").value("UTC"));
        }

        @Test
        @DisplayName("Should return 401 when not authenticated")
        void getPreferences_whenNotAuthenticated_shouldReturn401() throws Exception {
            // Act & Assert
            mockMvc.perform(get(BASE_URL)
                            .header("X-Tenant-ID", TENANT_ID))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("PUT /api/v1/notification-preferences")
    class UpdatePreferences {

        @Test
        @DisplayName("Should return 200 when preferences updated")
        void updatePreferences_shouldReturn200() throws Exception {
            // Arrange
            UpdatePreferenceRequest request = UpdatePreferenceRequest.builder()
                    .emailEnabled(false)
                    .pushEnabled(true)
                    .digestEnabled(true)
                    .digestFrequency("WEEKLY")
                    .build();

            when(preferenceService.updatePreferences(eq(TENANT_ID), eq(USER_ID), any(UpdatePreferenceRequest.class)))
                    .thenReturn(buildPreferenceDTO());

            // Act & Assert
            mockMvc.perform(put(BASE_URL)
                            .with(jwt().jwt(j -> j.subject(USER_ID.toString())))
                            .header("X-Tenant-ID", TENANT_ID)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk());

            verify(preferenceService).updatePreferences(eq(TENANT_ID), eq(USER_ID), any(UpdatePreferenceRequest.class));
        }
    }

    @Nested
    @DisplayName("POST /api/v1/notification-preferences/reset")
    class ResetPreferences {

        @Test
        @DisplayName("Should return 200 when preferences are reset to defaults")
        void resetPreferences_shouldReturn200() throws Exception {
            // Arrange
            when(preferenceService.createDefaultPreferences(TENANT_ID, USER_ID))
                    .thenReturn(buildPreferenceDTO());

            // Act & Assert
            mockMvc.perform(post(BASE_URL + "/reset")
                            .with(jwt().jwt(j -> j.subject(USER_ID.toString())))
                            .header("X-Tenant-ID", TENANT_ID))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.emailEnabled").value(true));

            verify(preferenceService).createDefaultPreferences(TENANT_ID, USER_ID);
        }
    }
}
