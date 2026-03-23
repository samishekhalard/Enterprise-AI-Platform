package com.ems.notification.service;

public interface EmailService {

    void sendEmail(String to, String subject, String textBody, String htmlBody);

    void sendEmail(String to, String subject, String textBody);

    void sendTemplatedEmail(String to, String templateName, Object templateData);
}
