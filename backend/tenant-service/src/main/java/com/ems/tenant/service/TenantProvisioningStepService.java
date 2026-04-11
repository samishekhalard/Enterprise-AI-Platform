package com.ems.tenant.service;

import com.ems.tenant.entity.ProvisioningStepStatus;
import com.ems.tenant.entity.TenantProvisioningStepEntity;
import com.ems.tenant.repository.TenantProvisioningStepRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class TenantProvisioningStepService {

    private final TenantProvisioningStepRepository tenantProvisioningStepRepository;

    public List<TenantProvisioningStepEntity> initializeSteps(UUID tenantUuid, List<String> orderedStepNames) {
        List<TenantProvisioningStepEntity> existing =
            tenantProvisioningStepRepository.findByTenantUuidOrderByStepOrderAsc(tenantUuid);
        if (!existing.isEmpty()) {
            return existing;
        }

        List<TenantProvisioningStepEntity> steps = java.util.stream.IntStream.range(0, orderedStepNames.size())
            .mapToObj(index -> TenantProvisioningStepEntity.builder()
                .tenantUuid(tenantUuid)
                .stepName(orderedStepNames.get(index))
                .stepOrder(index + 1)
                .status(ProvisioningStepStatus.PENDING)
                .build())
            .toList();

        return tenantProvisioningStepRepository.saveAll(steps);
    }

    public Optional<TenantProvisioningStepEntity> findFirstNonCompletedStep(UUID tenantUuid) {
        return tenantProvisioningStepRepository.findByTenantUuidOrderByStepOrderAsc(tenantUuid).stream()
            .filter(step -> step.getStatus() != ProvisioningStepStatus.COMPLETED)
            .findFirst();
    }

    public TenantProvisioningStepEntity markInProgress(UUID tenantUuid, String stepName) {
        return updateStatus(tenantUuid, stepName, ProvisioningStepStatus.IN_PROGRESS, null, null);
    }

    public TenantProvisioningStepEntity markCompleted(UUID tenantUuid, String stepName) {
        return updateStatus(tenantUuid, stepName, ProvisioningStepStatus.COMPLETED, null, Instant.now());
    }

    public TenantProvisioningStepEntity markFailed(UUID tenantUuid, String stepName, String errorMessage) {
        return updateStatus(tenantUuid, stepName, ProvisioningStepStatus.FAILED, errorMessage, null);
    }

    private TenantProvisioningStepEntity updateStatus(
        UUID tenantUuid,
        String stepName,
        ProvisioningStepStatus status,
        String errorMessage,
        Instant completedAt
    ) {
        TenantProvisioningStepEntity step = tenantProvisioningStepRepository
            .findByTenantUuidAndStepName(tenantUuid, stepName)
            .orElseThrow(() -> new IllegalArgumentException("Provisioning step not found: " + stepName));

        step.setStatus(status);
        step.setErrorMessage(errorMessage);
        step.setCompletedAt(completedAt);
        return tenantProvisioningStepRepository.save(step);
    }
}
