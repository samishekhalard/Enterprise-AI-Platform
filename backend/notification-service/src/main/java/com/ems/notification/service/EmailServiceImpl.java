package com.ems.notification.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;
    private final SpringTemplateEngine templateEngine;

    @Value("${spring.mail.from:noreply@emsist.com}")
    private String fromAddress;

    @Value("${notification.email.enabled:true}")
    private boolean emailEnabled;

    @Override
    @Async
    public void sendEmail(String to, String subject, String textBody, String htmlBody) {
        if (!emailEnabled) {
            log.info("Email sending disabled. Would have sent to: {}", to);
            return;
        }

        try {
            if (htmlBody != null && !htmlBody.isBlank()) {
                sendHtmlEmail(to, subject, textBody, htmlBody);
            } else {
                sendPlainTextEmail(to, subject, textBody);
            }
            log.info("Email sent successfully to: {}", to);
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage(), e);
            throw new RuntimeException("Failed to send email", e);
        }
    }

    @Override
    @Async
    public void sendEmail(String to, String subject, String textBody) {
        sendEmail(to, subject, textBody, null);
    }

    @Override
    @Async
    public void sendTemplatedEmail(String to, String templateName, Object templateData) {
        Context context = new Context();
        if (templateData instanceof java.util.Map) {
            @SuppressWarnings("unchecked")
            java.util.Map<String, Object> data = (java.util.Map<String, Object>) templateData;
            data.forEach(context::setVariable);
        }

        String htmlContent = templateEngine.process(templateName, context);
        String subject = extractSubject(templateName, context);

        sendEmail(to, subject, null, htmlContent);
    }

    private void sendPlainTextEmail(String to, String subject, String textBody) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(to);
        message.setSubject(subject);
        message.setText(textBody);
        mailSender.send(message);
    }

    private void sendHtmlEmail(String to, String subject, String textBody, String htmlBody) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setFrom(fromAddress);
        helper.setTo(to);
        helper.setSubject(subject);

        if (textBody != null && !textBody.isBlank()) {
            helper.setText(textBody, htmlBody);
        } else {
            helper.setText(htmlBody, true);
        }

        mailSender.send(message);
    }

    private String extractSubject(String templateName, Context context) {
        // Try to process subject template if exists
        try {
            return templateEngine.process(templateName + "-subject", context);
        } catch (Exception e) {
            return templateName.replace("-", " ").replace("_", " ");
        }
    }
}
