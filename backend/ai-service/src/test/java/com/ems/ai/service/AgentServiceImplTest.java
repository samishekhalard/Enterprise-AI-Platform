package com.ems.ai.service;

import com.ems.ai.dto.*;
import com.ems.ai.entity.AgentCategoryEntity;
import com.ems.ai.entity.AgentEntity;
import com.ems.ai.entity.AgentEntity.AgentStatus;
import com.ems.ai.entity.AgentEntity.LlmProvider;
import com.ems.ai.mapper.AgentMapper;
import com.ems.ai.repository.AgentCategoryRepository;
import com.ems.ai.repository.AgentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AgentServiceImplTest {

    @Mock
    private AgentRepository agentRepository;

    @Mock
    private AgentCategoryRepository categoryRepository;

    @Mock
    private AgentMapper agentMapper;

    @InjectMocks
    private AgentServiceImpl agentService;

    private static final String TENANT_ID = "tenant-1";
    private static final UUID OWNER_ID = UUID.randomUUID();
    private static final UUID AGENT_ID = UUID.randomUUID();
    private static final UUID CATEGORY_ID = UUID.randomUUID();

    private AgentEntity sampleAgent;
    private AgentDTO sampleAgentDTO;

    @BeforeEach
    void setUp() {
        sampleAgent = AgentEntity.builder()
            .id(AGENT_ID)
            .tenantId(TENANT_ID)
            .ownerId(OWNER_ID)
            .name("Test Agent")
            .description("A test agent")
            .systemPrompt("You are a helpful assistant")
            .provider(LlmProvider.OPENAI)
            .model("gpt-4o")
            .ragEnabled(false)
            .isPublic(false)
            .isSystem(false)
            .status(AgentStatus.ACTIVE)
            .usageCount(0L)
            .knowledgeSources(new ArrayList<>())
            .createdAt(Instant.now())
            .build();

        sampleAgentDTO = AgentDTO.builder()
            .id(AGENT_ID)
            .tenantId(TENANT_ID)
            .ownerId(OWNER_ID)
            .name("Test Agent")
            .description("A test agent")
            .systemPrompt("You are a helpful assistant")
            .provider(LlmProvider.OPENAI)
            .model("gpt-4o")
            .ragEnabled(false)
            .isPublic(false)
            .isSystem(false)
            .status(AgentStatus.ACTIVE)
            .usageCount(0L)
            .knowledgeSourceCount(0)
            .build();
    }

    @Nested
    @DisplayName("createAgent")
    class CreateAgent {

        @Test
        @DisplayName("should create agent with valid request and return DTO")
        void createAgent_withValidRequest_shouldReturnAgentDTO() {
            // Arrange
            CreateAgentRequest request = CreateAgentRequest.builder()
                .name("Test Agent")
                .systemPrompt("You are a helpful assistant")
                .provider(LlmProvider.OPENAI)
                .model("gpt-4o")
                .ragEnabled(null)
                .isPublic(null)
                .build();

            when(agentMapper.toEntity(request)).thenReturn(sampleAgent);
            when(agentRepository.save(any(AgentEntity.class))).thenReturn(sampleAgent);
            when(agentMapper.toDTO(sampleAgent)).thenReturn(sampleAgentDTO);

            // Act
            AgentDTO result = agentService.createAgent(TENANT_ID, OWNER_ID, request);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.name()).isEqualTo("Test Agent");
            assertThat(result.provider()).isEqualTo(LlmProvider.OPENAI);
            verify(agentRepository).save(any(AgentEntity.class));
            verify(agentMapper).toDTO(sampleAgent);
        }

        @Test
        @DisplayName("should set ragEnabled to false when null in request")
        void createAgent_whenRagEnabledNull_shouldDefaultToFalse() {
            // Arrange
            CreateAgentRequest request = CreateAgentRequest.builder()
                .name("Agent")
                .systemPrompt("Prompt")
                .provider(LlmProvider.OPENAI)
                .model("gpt-4o")
                .ragEnabled(null)
                .isPublic(null)
                .build();

            AgentEntity entityCapture = AgentEntity.builder()
                .ragEnabled(null)
                .isPublic(null)
                .knowledgeSources(new ArrayList<>())
                .build();

            when(agentMapper.toEntity(request)).thenReturn(entityCapture);
            when(agentRepository.save(any())).thenReturn(sampleAgent);
            when(agentMapper.toDTO(any())).thenReturn(sampleAgentDTO);

            // Act
            agentService.createAgent(TENANT_ID, OWNER_ID, request);

            // Assert
            assertThat(entityCapture.getRagEnabled()).isFalse();
            assertThat(entityCapture.getIsPublic()).isFalse();
        }

        @Test
        @DisplayName("should associate category when categoryId is provided")
        void createAgent_withCategoryId_shouldAssociateCategory() {
            // Arrange
            AgentCategoryEntity category = AgentCategoryEntity.builder()
                .id(CATEGORY_ID)
                .name("Productivity")
                .build();

            CreateAgentRequest request = CreateAgentRequest.builder()
                .name("Agent")
                .systemPrompt("Prompt")
                .provider(LlmProvider.OPENAI)
                .model("gpt-4o")
                .categoryId(CATEGORY_ID)
                .build();

            when(agentMapper.toEntity(request)).thenReturn(sampleAgent);
            when(categoryRepository.findById(CATEGORY_ID)).thenReturn(Optional.of(category));
            when(agentRepository.save(any())).thenReturn(sampleAgent);
            when(agentMapper.toDTO(any())).thenReturn(sampleAgentDTO);

            // Act
            agentService.createAgent(TENANT_ID, OWNER_ID, request);

            // Assert
            verify(categoryRepository).findById(CATEGORY_ID);
            assertThat(sampleAgent.getCategory()).isEqualTo(category);
        }

        @Test
        @DisplayName("should not set category when categoryId is null")
        void createAgent_withNullCategoryId_shouldNotSetCategory() {
            // Arrange
            CreateAgentRequest request = CreateAgentRequest.builder()
                .name("Agent")
                .systemPrompt("Prompt")
                .provider(LlmProvider.OPENAI)
                .model("gpt-4o")
                .categoryId(null)
                .build();

            when(agentMapper.toEntity(request)).thenReturn(sampleAgent);
            when(agentRepository.save(any())).thenReturn(sampleAgent);
            when(agentMapper.toDTO(any())).thenReturn(sampleAgentDTO);

            // Act
            agentService.createAgent(TENANT_ID, OWNER_ID, request);

            // Assert
            verify(categoryRepository, never()).findById(any());
        }
    }

    @Nested
    @DisplayName("updateAgent")
    class UpdateAgent {

        @Test
        @DisplayName("should update agent fields when owner matches")
        void updateAgent_whenOwnerMatches_shouldUpdateFields() {
            // Arrange
            UpdateAgentRequest request = UpdateAgentRequest.builder()
                .name("Updated Name")
                .description("Updated description")
                .systemPrompt("New prompt")
                .build();

            when(agentRepository.findById(AGENT_ID)).thenReturn(Optional.of(sampleAgent));
            when(agentRepository.save(any())).thenReturn(sampleAgent);
            when(agentMapper.toDTO(any())).thenReturn(sampleAgentDTO);

            // Act
            AgentDTO result = agentService.updateAgent(AGENT_ID, TENANT_ID, OWNER_ID, request);

            // Assert
            assertThat(result).isNotNull();
            assertThat(sampleAgent.getName()).isEqualTo("Updated Name");
            assertThat(sampleAgent.getDescription()).isEqualTo("Updated description");
            assertThat(sampleAgent.getSystemPrompt()).isEqualTo("New prompt");
            verify(agentRepository).save(sampleAgent);
        }

        @Test
        @DisplayName("should throw when agent not found")
        void updateAgent_whenNotFound_shouldThrowException() {
            // Arrange
            UpdateAgentRequest request = UpdateAgentRequest.builder().name("X").build();
            when(agentRepository.findById(AGENT_ID)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> agentService.updateAgent(AGENT_ID, TENANT_ID, OWNER_ID, request))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Agent not found");
        }

        @Test
        @DisplayName("should throw when tenant does not match")
        void updateAgent_whenTenantMismatch_shouldThrowException() {
            // Arrange
            UpdateAgentRequest request = UpdateAgentRequest.builder().name("X").build();
            when(agentRepository.findById(AGENT_ID)).thenReturn(Optional.of(sampleAgent));

            // Act & Assert
            assertThatThrownBy(() -> agentService.updateAgent(AGENT_ID, "other-tenant", OWNER_ID, request))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Not authorized");
        }

        @Test
        @DisplayName("should throw when owner does not match")
        void updateAgent_whenOwnerMismatch_shouldThrowException() {
            // Arrange
            UUID otherOwner = UUID.randomUUID();
            UpdateAgentRequest request = UpdateAgentRequest.builder().name("X").build();
            when(agentRepository.findById(AGENT_ID)).thenReturn(Optional.of(sampleAgent));

            // Act & Assert
            assertThatThrownBy(() -> agentService.updateAgent(AGENT_ID, TENANT_ID, otherOwner, request))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Not authorized");
        }

        @Test
        @DisplayName("should only update non-null fields from request")
        void updateAgent_withPartialRequest_shouldUpdateOnlyNonNullFields() {
            // Arrange
            String originalDescription = sampleAgent.getDescription();
            UpdateAgentRequest request = UpdateAgentRequest.builder()
                .name("New Name Only")
                .build();

            when(agentRepository.findById(AGENT_ID)).thenReturn(Optional.of(sampleAgent));
            when(agentRepository.save(any())).thenReturn(sampleAgent);
            when(agentMapper.toDTO(any())).thenReturn(sampleAgentDTO);

            // Act
            agentService.updateAgent(AGENT_ID, TENANT_ID, OWNER_ID, request);

            // Assert
            assertThat(sampleAgent.getName()).isEqualTo("New Name Only");
            assertThat(sampleAgent.getDescription()).isEqualTo(originalDescription);
        }
    }

    @Nested
    @DisplayName("deleteAgent")
    class DeleteAgent {

        @Test
        @DisplayName("should soft-delete agent by setting status to DELETED")
        void deleteAgent_whenAuthorized_shouldSetStatusDeleted() {
            // Arrange
            when(agentRepository.findById(AGENT_ID)).thenReturn(Optional.of(sampleAgent));
            when(agentRepository.save(any())).thenReturn(sampleAgent);

            // Act
            agentService.deleteAgent(AGENT_ID, TENANT_ID, OWNER_ID);

            // Assert
            assertThat(sampleAgent.getStatus()).isEqualTo(AgentStatus.DELETED);
            verify(agentRepository).save(sampleAgent);
        }

        @Test
        @DisplayName("should throw when agent not found")
        void deleteAgent_whenNotFound_shouldThrowException() {
            // Arrange
            when(agentRepository.findById(AGENT_ID)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> agentService.deleteAgent(AGENT_ID, TENANT_ID, OWNER_ID))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Agent not found");
        }

        @Test
        @DisplayName("should throw when trying to delete system agent")
        void deleteAgent_whenSystemAgent_shouldThrowException() {
            // Arrange
            sampleAgent.setIsSystem(true);
            when(agentRepository.findById(AGENT_ID)).thenReturn(Optional.of(sampleAgent));

            // Act & Assert
            assertThatThrownBy(() -> agentService.deleteAgent(AGENT_ID, TENANT_ID, OWNER_ID))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Cannot delete system agents");
        }

        @Test
        @DisplayName("should throw when not authorized to delete")
        void deleteAgent_whenNotAuthorized_shouldThrowException() {
            // Arrange
            when(agentRepository.findById(AGENT_ID)).thenReturn(Optional.of(sampleAgent));

            // Act & Assert
            assertThatThrownBy(() -> agentService.deleteAgent(AGENT_ID, "other-tenant", OWNER_ID))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Not authorized");
        }
    }

    @Nested
    @DisplayName("getAgent")
    class GetAgent {

        @Test
        @DisplayName("should return agent DTO when accessible")
        void getAgent_whenAccessible_shouldReturnDTO() {
            // Arrange
            when(agentRepository.findAccessibleById(AGENT_ID, TENANT_ID, AgentStatus.ACTIVE))
                .thenReturn(Optional.of(sampleAgent));
            when(agentMapper.toDTO(sampleAgent)).thenReturn(sampleAgentDTO);

            // Act
            AgentDTO result = agentService.getAgent(AGENT_ID, TENANT_ID);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.id()).isEqualTo(AGENT_ID);
        }

        @Test
        @DisplayName("should throw when agent not accessible")
        void getAgent_whenNotAccessible_shouldThrowException() {
            // Arrange
            when(agentRepository.findAccessibleById(AGENT_ID, TENANT_ID, AgentStatus.ACTIVE))
                .thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> agentService.getAgent(AGENT_ID, TENANT_ID))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Agent not found or not accessible");
        }
    }

    @Nested
    @DisplayName("getMyAgents")
    class GetMyAgents {

        @Test
        @DisplayName("should return paginated agents for owner")
        void getMyAgents_shouldReturnPage() {
            // Arrange
            Pageable pageable = PageRequest.of(0, 10);
            Page<AgentEntity> entityPage = new PageImpl<>(List.of(sampleAgent));
            when(agentRepository.findByTenantIdAndOwnerIdAndStatus(TENANT_ID, OWNER_ID, AgentStatus.ACTIVE, pageable))
                .thenReturn(entityPage);
            when(agentMapper.toDTO(sampleAgent)).thenReturn(sampleAgentDTO);

            // Act
            Page<AgentDTO> result = agentService.getMyAgents(TENANT_ID, OWNER_ID, pageable);

            // Assert
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).name()).isEqualTo("Test Agent");
        }
    }

    @Nested
    @DisplayName("getAccessibleAgents")
    class GetAccessibleAgents {

        @Test
        @DisplayName("should return accessible agents page")
        void getAccessibleAgents_shouldReturnPage() {
            // Arrange
            Pageable pageable = PageRequest.of(0, 10);
            Page<AgentEntity> entityPage = new PageImpl<>(List.of(sampleAgent));
            when(agentRepository.findAccessibleAgents(TENANT_ID, AgentStatus.ACTIVE, pageable))
                .thenReturn(entityPage);
            when(agentMapper.toDTO(sampleAgent)).thenReturn(sampleAgentDTO);

            // Act
            Page<AgentDTO> result = agentService.getAccessibleAgents(TENANT_ID, pageable);

            // Assert
            assertThat(result.getContent()).hasSize(1);
        }
    }

    @Nested
    @DisplayName("searchAgents")
    class SearchAgents {

        @Test
        @DisplayName("should return matching agents for query")
        void searchAgents_shouldReturnMatchingPage() {
            // Arrange
            Pageable pageable = PageRequest.of(0, 10);
            Page<AgentEntity> entityPage = new PageImpl<>(List.of(sampleAgent));
            when(agentRepository.searchAgents(TENANT_ID, "test", AgentStatus.ACTIVE, pageable))
                .thenReturn(entityPage);
            when(agentMapper.toDTO(sampleAgent)).thenReturn(sampleAgentDTO);

            // Act
            Page<AgentDTO> result = agentService.searchAgents(TENANT_ID, "test", pageable);

            // Assert
            assertThat(result.getContent()).hasSize(1);
        }
    }

    @Nested
    @DisplayName("getAgentsByCategory")
    class GetAgentsByCategory {

        @Test
        @DisplayName("should return agents in given category")
        void getAgentsByCategory_shouldReturnPage() {
            // Arrange
            Pageable pageable = PageRequest.of(0, 10);
            Page<AgentEntity> entityPage = new PageImpl<>(List.of(sampleAgent));
            when(agentRepository.findByCategoryIdAndStatus(CATEGORY_ID, AgentStatus.ACTIVE, pageable))
                .thenReturn(entityPage);
            when(agentMapper.toDTO(sampleAgent)).thenReturn(sampleAgentDTO);

            // Act
            Page<AgentDTO> result = agentService.getAgentsByCategory(CATEGORY_ID, pageable);

            // Assert
            assertThat(result.getContent()).hasSize(1);
        }
    }

    @Nested
    @DisplayName("getCategories")
    class GetCategories {

        @Test
        @DisplayName("should return all active categories sorted by display order")
        void getCategories_shouldReturnActiveCategoriesSorted() {
            // Arrange
            List<AgentCategoryEntity> entities = List.of(
                AgentCategoryEntity.builder().id(UUID.randomUUID()).name("Coding").displayOrder(1).build(),
                AgentCategoryEntity.builder().id(UUID.randomUUID()).name("Writing").displayOrder(2).build()
            );
            List<AgentCategoryDTO> dtos = List.of(
                AgentCategoryDTO.builder().name("Coding").displayOrder(1).build(),
                AgentCategoryDTO.builder().name("Writing").displayOrder(2).build()
            );
            when(categoryRepository.findByIsActiveTrueOrderByDisplayOrderAsc()).thenReturn(entities);
            when(agentMapper.toCategoryDTOList(entities)).thenReturn(dtos);

            // Act
            List<AgentCategoryDTO> result = agentService.getCategories();

            // Assert
            assertThat(result).hasSize(2);
            assertThat(result.get(0).name()).isEqualTo("Coding");
        }
    }

    @Nested
    @DisplayName("incrementUsage")
    class IncrementUsage {

        @Test
        @DisplayName("should delegate to repository to increment usage count")
        void incrementUsage_shouldCallRepository() {
            // Arrange - nothing extra needed

            // Act
            agentService.incrementUsage(AGENT_ID);

            // Assert
            verify(agentRepository).incrementUsageCount(AGENT_ID);
        }
    }
}
