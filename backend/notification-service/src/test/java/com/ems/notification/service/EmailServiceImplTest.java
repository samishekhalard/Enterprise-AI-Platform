package com.ems.notification.service;

import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;
import org.thymeleaf.spring6.SpringTemplateEngine;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("EmailServiceImpl Unit Tests")
class EmailServiceImplTest {

    @Mock
    private JavaMailSender mailSender;

    @Mock
    private SpringTemplateEngine templateEngine;

    @InjectMocks
    private EmailServiceImpl emailService;

    private void setDefaults() {
        ReflectionTestUtils.setField(emailService, "fromAddress", "noreply@emsist.com");
        ReflectionTestUtils.setField(emailService, "emailEnabled", true);
    }

    @Nested
    @DisplayName("sendEmail(String to, String subject, String textBody, String htmlBody)")
    class SendEmailFourArgs {

        @Test
        @DisplayName("Should send plain text email when htmlBody is null")
        void sendEmail_whenHtmlNull_shouldSendPlainText() {
            // Arrange
            setDefaults();

            // Act
            emailService.sendEmail("user@example.com", "Subject", "Text body", null);

            // Assert
            verify(mailSender).send(any(SimpleMailMessage.class));
        }

        @Test
        @DisplayName("Should send plain text email when htmlBody is blank")
        void sendEmail_whenHtmlBlank_shouldSendPlainText() {
            // Arrange
            setDefaults();

            // Act
            emailService.sendEmail("user@example.com", "Subject", "Text body", "   ");

            // Assert
            verify(mailSender).send(any(SimpleMailMessage.class));
        }

        @Test
        @DisplayName("Should send HTML email when htmlBody is provided")
        void sendEmail_whenHtmlProvided_shouldSendMime() {
            // Arrange
            setDefaults();
            MimeMessage mimeMessage = mock(MimeMessage.class);
            when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

            // Act
            emailService.sendEmail("user@example.com", "Subject", "Text body", "<h1>HTML</h1>");

            // Assert
            verify(mailSender).createMimeMessage();
            verify(mailSender).send(any(MimeMessage.class));
        }

        @Test
        @DisplayName("Should not send email when emailEnabled is false")
        void sendEmail_whenDisabled_shouldNotSend() {
            // Arrange
            ReflectionTestUtils.setField(emailService, "fromAddress", "noreply@emsist.com");
            ReflectionTestUtils.setField(emailService, "emailEnabled", false);

            // Act
            emailService.sendEmail("user@example.com", "Subject", "Body", null);

            // Assert
            verify(mailSender, never()).send(any(SimpleMailMessage.class));
            verify(mailSender, never()).send(any(MimeMessage.class));
        }

        @Test
        @DisplayName("Should throw RuntimeException when sending fails")
        void sendEmail_whenMailSenderFails_shouldThrowRuntime() {
            // Arrange
            setDefaults();
            doThrow(new RuntimeException("SMTP error")).when(mailSender).send(any(SimpleMailMessage.class));

            // Act & Assert
            assertThatThrownBy(() -> emailService.sendEmail("user@example.com", "Subject", "Body", null))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Failed to send email");
        }
    }

    @Nested
    @DisplayName("sendEmail(String to, String subject, String textBody)")
    class SendEmailThreeArgs {

        @Test
        @DisplayName("Should delegate to four-arg sendEmail with null htmlBody")
        void sendEmail_threeArgs_shouldDelegateToFourArgs() {
            // Arrange
            setDefaults();

            // Act
            emailService.sendEmail("user@example.com", "Subject", "Body");

            // Assert
            verify(mailSender).send(any(SimpleMailMessage.class));
        }
    }

    @Nested
    @DisplayName("sendTemplatedEmail()")
    class SendTemplatedEmail {

        @Test
        @DisplayName("Should process template with Map data and send HTML email")
        void sendTemplatedEmail_withMapData_shouldProcessAndSend() {
            // Arrange
            setDefaults();
            MimeMessage mimeMessage = mock(MimeMessage.class);
            when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
            when(templateEngine.process(anyString(), any())).thenReturn("<h1>Rendered</h1>");

            Map<String, Object> data = Map.of("name", "John", "email", "john@example.com");

            // Act
            emailService.sendTemplatedEmail("user@example.com", "welcome-email", data);

            // Assert
            verify(templateEngine).process(eq("welcome-email"), any());
            verify(mailSender).send(any(MimeMessage.class));
        }

        @Test
        @DisplayName("Should fall back to template name as subject when subject template fails")
        void sendTemplatedEmail_whenSubjectTemplateFails_shouldFallbackToName() {
            // Arrange
            setDefaults();
            MimeMessage mimeMessage = mock(MimeMessage.class);
            when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

            // First call: body template
            // Second call: subject template throws
            when(templateEngine.process(eq("welcome-email"), any())).thenReturn("<h1>Body</h1>");
            when(templateEngine.process(eq("welcome-email-subject"), any()))
                    .thenThrow(new RuntimeException("Template not found"));

            // Act
            emailService.sendTemplatedEmail("user@example.com", "welcome-email", Map.of());

            // Assert
            verify(mailSender).send(any(MimeMessage.class));
        }
    }
}
