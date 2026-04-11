package com.ems.ai.service;

import com.ems.ai.dto.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface AgentService {

    AgentDTO createAgent(String tenantId, UUID ownerId, CreateAgentRequest request);

    AgentDTO updateAgent(UUID agentId, String tenantId, UUID ownerId, UpdateAgentRequest request);

    void deleteAgent(UUID agentId, String tenantId, UUID ownerId);

    AgentDTO getAgent(UUID agentId, String tenantId);

    Page<AgentDTO> getMyAgents(String tenantId, UUID ownerId, Pageable pageable);

    Page<AgentDTO> getAccessibleAgents(String tenantId, Pageable pageable);

    Page<AgentDTO> searchAgents(String tenantId, String query, Pageable pageable);

    Page<AgentDTO> getAgentsByCategory(UUID categoryId, Pageable pageable);

    List<AgentCategoryDTO> getCategories();

    void incrementUsage(UUID agentId);
}
