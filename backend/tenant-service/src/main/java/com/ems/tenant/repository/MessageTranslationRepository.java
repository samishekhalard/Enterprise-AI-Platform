package com.ems.tenant.repository;

import com.ems.tenant.entity.MessageTranslationEntity;
import com.ems.tenant.entity.MessageTranslationId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface MessageTranslationRepository extends JpaRepository<MessageTranslationEntity, MessageTranslationId> {

    List<MessageTranslationEntity> findByCodeIn(Collection<String> codes);

    List<MessageTranslationEntity> findByCodeOrderByLocaleCodeAsc(String code);

    Optional<MessageTranslationEntity> findByCodeAndLocaleCode(String code, String localeCode);
}
