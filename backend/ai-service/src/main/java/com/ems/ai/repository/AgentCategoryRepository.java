package com.ems.ai.repository;

import com.ems.ai.entity.AgentCategoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AgentCategoryRepository extends JpaRepository<AgentCategoryEntity, UUID> {

    List<AgentCategoryEntity> findByIsActiveTrueOrderByDisplayOrderAsc();

    boolean existsByName(String name);
}
