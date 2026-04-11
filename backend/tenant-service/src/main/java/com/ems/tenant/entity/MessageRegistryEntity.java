package com.ems.tenant.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.Instant;

@Entity
@Table(name = "message_registry")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageRegistryEntity {

    @Id
    @Column(name = "code", length = 20)
    private String code;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "type", nullable = false, length = 1, columnDefinition = "CHAR(1)")
    private String type;

    @Column(name = "category", nullable = false, length = 50)
    private String category;

    @Column(name = "http_status")
    private Integer httpStatus;

    @Column(name = "default_title", nullable = false, length = 255)
    private String defaultTitle;

    @Column(name = "default_detail", columnDefinition = "TEXT")
    private String defaultDetail;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
