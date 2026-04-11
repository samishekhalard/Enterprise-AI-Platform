package com.ems.tenant.repository;

import com.ems.tenant.entity.IconAssetEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IconAssetRepository extends JpaRepository<IconAssetEntity, String> {

    List<IconAssetEntity> findByIconLibraryIdOrderByDisplayNameAsc(String iconLibraryId);
}
