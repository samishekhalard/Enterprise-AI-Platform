package com.ems.tenant.repository;

import com.ems.tenant.entity.BrandDraftEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BrandDraftRepository extends JpaRepository<BrandDraftEntity, String> {
}
