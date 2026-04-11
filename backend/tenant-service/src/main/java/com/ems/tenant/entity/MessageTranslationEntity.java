package com.ems.tenant.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "message_translation")
@IdClass(MessageTranslationId.class)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageTranslationEntity {

    @Id
    @Column(name = "code", nullable = false, length = 20)
    private String code;

    @Id
    @Column(name = "locale_code", nullable = false, length = 10)
    private String localeCode;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "detail", columnDefinition = "TEXT")
    private String detail;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
