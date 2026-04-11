package com.ems.notification.controller;

import com.ems.notification.dto.NotificationDTO;
import com.ems.notification.dto.SendNotificationRequest;
import com.ems.notification.service.NotificationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.bean.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(NotificationController.class)
@AutoConfigureMockMvc
@DisplayName("NotificationController Unit Tests")
class NotificationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private NotificationService notificationService;

    private static final String BASE_URL = "/api/v1/notifications";
    private static final String TENANT_ID = "tenant-1";
    private static final UUID USER_ID = UUID.randomUUID();
    private static final UUID NOTIFICATION_ID = UUID.randomUUID();

    private NotificationDTO buildNotificationDTO() {
        return NotificationDTO.builder()
                .id(NOTIFICATION_ID)
                .tenantId(TENANT_ID)
                .userId(USER_ID)
                .type("EMAIL")
                .category("SYSTEM")
                .subject("Test Subject")
                .body("Test Body")
                .status("SENT")
                .createdAt(Instant.now())
                .build();
    }

    @Nested
    @DisplayName("POST /api/v1/notifications")
    class SendNotification {

        @Test
        @DisplayName("Should return 201 Created when notification is sent successfully")
        void sendNotification_shouldReturn201() throws Exception {
            // Arrange
            SendNotificationRequest request = SendNotificationRequest.builder()
                    .tenantId(TENANT_ID)
                    .userId(USER_ID)
                    .type("EMAIL")
                    .subject("Subject")
                    .body("Body")
                    .recipientAddress("user@example.com")
                    .build();

            when(notificationService.send(any(SendNotificationRequest.class)))
                    .thenReturn(buildNotificationDTO());

            // Act & Assert
            mockMvc.perform(post(BASE_URL)
                            .with(jwt().jwt(j -> j.subject(USER_ID.toString())))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.id").value(NOTIFICATION_ID.toString()))
                    .andExpect(jsonPath("$.type").value("EMAIL"))
                    .andExpect(jsonPath("$.status").value("SENT"));
        }

        @Test
        @DisplayName("Should return 400 when required fields are missing")
        void sendNotification_whenMissingFields_shouldReturn400() throws Exception {
            // Arrange
            String invalidJson = "{}";

            // Act & Assert
            mockMvc.perform(post(BASE_URL)
                            .with(jwt().jwt(j -> j.subject(USER_ID.toString())))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(invalidJson))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Should return 401 when not authenticated")
        void sendNotification_whenNotAuthenticated_shouldReturn401() throws Exception {
            // Arrange
            SendNotificationRequest request = SendNotificationRequest.builder()
                    .tenantId(TENANT_ID)
                    .userId(USER_ID)
                    .type("EMAIL")
                    .build();

            // Act & Assert
            mockMvc.perform(post(BASE_URL)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("POST /api/v1/notifications/async")
    class SendNotificationAsync {

        @Test
        @DisplayName("Should return 202 Accepted for async notification")
        void sendNotificationAsync_shouldReturn202() throws Exception {
            // Arrange
            SendNotificationRequest request = SendNotificationRequest.builder()
                    .tenantId(TENANT_ID)
                    .userId(USER_ID)
                    .type("EMAIL")
                    .subject("Subject")
                    .body("Body")
                    .build();

            // Act & Assert
            mockMvc.perform(post(BASE_URL + "/async")
                            .with(jwt().jwt(j -> j.subject(USER_ID.toString())))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isAccepted());

            verify(notificationService).sendAsync(any(SendNotificationRequest.class));
        }
    }

    @Nested
    @DisplayName("GET /api/v1/notifications/{notificationId}")
    class GetNotification {

        @Test
        @DisplayName("Should return 200 with notification when found")
        void getNotification_shouldReturn200() throws Exception {
            // Arrange
            when(notificationService.getNotification(NOTIFICATION_ID)).thenReturn(buildNotificationDTO());

            // Act & Assert
            mockMvc.perform(get(BASE_URL + "/{id}", NOTIFICATION_ID)
                            .with(jwt().jwt(j -> j.subject(USER_ID.toString()))))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(NOTIFICATION_ID.toString()))
                    .andExpect(jsonPath("$.subject").value("Test Subject"));
        }
    }

    @Nested
    @DisplayName("GET /api/v1/notifications")
    class GetUserNotifications {

        @Test
        @DisplayName("Should return 200 with list of user notifications")
        void getUserNotifications_shouldReturn200() throws Exception {
            // Arrange
            when(notificationService.getUserNotifications(eq(TENANT_ID), eq(USER_ID), isNull(), eq(0), eq(20)))
                    .thenReturn(List.of(buildNotificationDTO()));

            // Act & Assert
            mockMvc.perform(get(BASE_URL)
                            .with(jwt().jwt(j -> j.subject(USER_ID.toString())))
                            .header("X-Tenant-ID", TENANT_ID))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isArray())
                    .andExpect(jsonPath("$[0].id").value(NOTIFICATION_ID.toString()));
        }

        @Test
        @DisplayName("Should pass type filter parameter to service")
        void getUserNotifications_withTypeFilter_shouldPassToService() throws Exception {
            // Arrange
            when(notificationService.getUserNotifications(eq(TENANT_ID), eq(USER_ID), eq("EMAIL"), eq(0), eq(20)))
                    .thenReturn(List.of(buildNotificationDTO()));

            // Act & Assert
            mockMvc.perform(get(BASE_URL)
                            .with(jwt().jwt(j -> j.subject(USER_ID.toString())))
                            .header("X-Tenant-ID", TENANT_ID)
                            .param("type", "EMAIL"))
                    .andExpect(status().isOk());

            verify(notificationService).getUserNotifications(TENANT_ID, USER_ID, "EMAIL", 0, 20);
        }
    }

    @Nested
    @DisplayName("GET /api/v1/notifications/unread")
    class GetUnread {

        @Test
        @DisplayName("Should return 200 with unread notifications")
        void getUnreadNotifications_shouldReturn200() throws Exception {
            // Arrange
            when(notificationService.getUnreadNotifications(TENANT_ID, USER_ID))
                    .thenReturn(List.of(buildNotificationDTO()));

            // Act & Assert
            mockMvc.perform(get(BASE_URL + "/unread")
                            .with(jwt().jwt(j -> j.subject(USER_ID.toString())))
                            .header("X-Tenant-ID", TENANT_ID))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].id").value(NOTIFICATION_ID.toString()));
        }
    }

    @Nested
    @DisplayName("GET /api/v1/notifications/unread/count")
    class GetUnreadCount {

        @Test
        @DisplayName("Should return 200 with unread count")
        void getUnreadCount_shouldReturn200() throws Exception {
            // Arrange
            when(notificationService.getUnreadCount(TENANT_ID, USER_ID)).thenReturn(5L);

            // Act & Assert
            mockMvc.perform(get(BASE_URL + "/unread/count")
                            .with(jwt().jwt(j -> j.subject(USER_ID.toString())))
                            .header("X-Tenant-ID", TENANT_ID))
                    .andExpect(status().isOk())
                    .andExpect(content().string("5"));
        }
    }

    @Nested
    @DisplayName("POST /api/v1/notifications/{id}/read")
    class MarkAsRead {

        @Test
        @DisplayName("Should return 200 when marking notification as read")
        void markAsRead_shouldReturn200() throws Exception {
            // Act & Assert
            mockMvc.perform(post(BASE_URL + "/{id}/read", NOTIFICATION_ID)
                            .with(jwt().jwt(j -> j.subject(USER_ID.toString()))))
                    .andExpect(status().isOk());

            verify(notificationService).markAsRead(NOTIFICATION_ID);
        }
    }

    @Nested
    @DisplayName("POST /api/v1/notifications/read-all")
    class MarkAllAsRead {

        @Test
        @DisplayName("Should return 200 when marking all as read")
        void markAllAsRead_shouldReturn200() throws Exception {
            // Act & Assert
            mockMvc.perform(post(BASE_URL + "/read-all")
                            .with(jwt().jwt(j -> j.subject(USER_ID.toString())))
                            .header("X-Tenant-ID", TENANT_ID))
                    .andExpect(status().isOk());

            verify(notificationService).markAllAsRead(TENANT_ID, USER_ID);
        }
    }

    @Nested
    @DisplayName("DELETE /api/v1/notifications/{id}")
    class DeleteNotification {

        @Test
        @DisplayName("Should return 204 No Content when deleted")
        void deleteNotification_shouldReturn204() throws Exception {
            // Act & Assert
            mockMvc.perform(delete(BASE_URL + "/{id}", NOTIFICATION_ID)
                            .with(jwt().jwt(j -> j.subject(USER_ID.toString()))))
                    .andExpect(status().isNoContent());

            verify(notificationService).deleteNotification(NOTIFICATION_ID);
        }
    }
}
