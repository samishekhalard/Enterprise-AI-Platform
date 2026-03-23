package com.ems.ai.service;

import com.ems.ai.dto.*;
import com.ems.ai.entity.AgentCategoryEntity;
import com.ems.ai.entity.AgentEntity;
import com.ems.ai.entity.AgentEntity.AgentStatus;
import com.ems.ai.mapper.AgentMapper;
import com.ems.ai.repository.AgentCategoryRepository;
import com.ems.ai.repository.AgentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class AgentServiceImpl implements AgentService {

    private final AgentRepository agentRepository;
    private final AgentCategoryRepository categoryRepository;
    private final AgentMapper agentMapper;

    @Override
    public AgentDTO createAgent(String tenantId, UUID ownerId, CreateAgentRequest request) {
        log.debug("Creating agent for tenant: {}, owner: {}", tenantId, ownerId);

        AgentEntity entity = agentMapper.toEntity(request);
        entity.setTenantId(tenantId);
        entity.setOwnerId(ownerId);

        if (request.categoryId() != null) {
            categoryRepository.findById(request.categoryId())
                .ifPresent(entity::setCategory);
        }

        if (request.ragEnabled() == null) {
            entity.setRagEnabled(false);
        }
        if (request.isPublic() == null) {
            entity.setIsPublic(false);
        }

        AgentEntity saved = agentRepository.save(entity);
        log.info("Created agent: {} for tenant: {}", saved.getId(), tenantId);

        return agentMapper.toDTO(saved);
    }

    @Override
    public AgentDTO updateAgent(UUID agentId, String tenantId, UUID ownerId, UpdateAgentRequest request) {
        log.debug("Updating agent: {} for tenant: {}", agentId, tenantId);

        AgentEntity entity = agentRepository.findById(agentId)
            .orElseThrow(() -> new RuntimeException("Agent not found: " + agentId));

        if (!entity.getTenantId().equals(tenantId) || !entity.getOwnerId().equals(ownerId)) {
            throw new RuntimeException("Not authorized to update this agent");
        }

        if (request.name() != null) entity.setName(request.name());
        if (request.description() != null) entity.setDescription(request.description());
        if (request.avatarUrl() != null) entity.setAvatarUrl(request.avatarUrl());
        if (request.systemPrompt() != null) entity.setSystemPrompt(request.systemPrompt());
        if (request.greetingMessage() != null) entity.setGreetingMessage(request.greetingMessage());
        if (request.conversationStarters() != null) entity.setConversationStarters(request.conversationStarters());
        if (request.provider() != null) entity.setProvider(request.provider());
        if (request.model() != null) entity.setModel(request.model());
        if (request.modelConfig() != null) entity.setModelConfig(request.modelConfig());
        if (request.ragEnabled() != null) entity.setRagEnabled(request.ragEnabled());
        if (request.isPublic() != null) entity.setIsPublic(request.isPublic());

        if (request.categoryId() != null) {
            categoryRepository.findById(request.categoryId())
                .ifPresent(entity::setCategory);
        }

        AgentEntity saved = agentRepository.save(entity);
        log.info("Updated agent: {}", agentId);

        return agentMapper.toDTO(saved);
    }

    @Override
    public void deleteAgent(UUID agentId, String tenantId, UUID ownerId) {
        log.debug("Deleting agent: {} for tenant: {}", agentId, tenantId);

        AgentEntity entity = agentRepository.findById(agentId)
            .orElseThrow(() -> new RuntimeException("Agent not found: " + agentId));

        if (!entity.getTenantId().equals(tenantId) || !entity.getOwnerId().equals(ownerId)) {
            throw new RuntimeException("Not authorized to delete this agent");
        }

        if (entity.getIsSystem()) {
            throw new RuntimeException("Cannot delete system agents");
        }

        entity.setStatus(AgentStatus.DELETED);
        agentRepository.save(entity);
        log.info("Deleted agent: {}", agentId);
    }

    @Override
    @Transactional(readOnly = true)
    public AgentDTO getAgent(UUID agentId, String tenantId) {
        return agentRepository.findAccessibleById(agentId, tenantId, AgentStatus.ACTIVE)
            .map(agentMapper::toDTO)
            .orElseThrow(() -> new RuntimeException("Agent not found or not accessible: " + agentId));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AgentDTO> getMyAgents(String tenantId, UUID ownerId, Pageable pageable) {
        return agentRepository.findByTenantIdAndOwnerIdAndStatus(tenantId, ownerId, AgentStatus.ACTIVE, pageable)
            .map(agentMapper::toDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AgentDTO> getAccessibleAgents(String tenantId, Pageable pageable) {
        return agentRepository.findAccessibleAgents(tenantId, AgentStatus.ACTIVE, pageable)
            .map(agentMapper::toDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AgentDTO> searchAgents(String tenantId, String query, Pageable pageable) {
        return agentRepository.searchAgents(tenantId, query, AgentStatus.ACTIVE, pageable)
            .map(agentMapper::toDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AgentDTO> getAgentsByCategory(UUID categoryId, Pageable pageable) {
        return agentRepository.findByCategoryIdAndStatus(categoryId, AgentStatus.ACTIVE, pageable)
            .map(agentMapper::toDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AgentCategoryDTO> getCategories() {
        return agentMapper.toCategoryDTOList(
            categoryRepository.findByIsActiveTrueOrderByDisplayOrderAsc()
        );
    }

    @Override
    public void incrementUsage(UUID agentId) {
        agentRepository.incrementUsageCount(agentId);
    }
}
