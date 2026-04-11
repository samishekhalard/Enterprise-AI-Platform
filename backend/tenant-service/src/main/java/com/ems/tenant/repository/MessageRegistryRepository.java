package com.ems.tenant.repository;

import com.ems.tenant.entity.MessageRegistryEntity;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRegistryRepository extends JpaRepository<MessageRegistryEntity, String> {

    default List<MessageRegistryEntity> findAllOrdered() {
        return findAll(Sort.by(Sort.Direction.ASC, "code"));
    }
}
