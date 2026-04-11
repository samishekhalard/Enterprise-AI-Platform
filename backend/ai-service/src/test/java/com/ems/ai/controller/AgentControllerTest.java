package com.ems.ai.controller;

import com.ems.ai.dto.*;
import com.ems.ai.entity.AgentEntity.AgentStatus;
import com.ems.ai.entity.AgentEntity.LlmProvider;
import com.ems.ai.service.AgentService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.bean.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AgentController.class)
class AgentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AgentService agentService;

    private static final String TENANT_ID = "tenant-1";
    private static final UUID AGENT_ID = UUID.randomUUID();
    private static final UUID OWNER_ID = UUID.randomUUID();

    private AgentDTO buildSampleAgentDTO() {
        return AgentDTO.builder()
            .id(AGENT_ID)
            .tenantId(TENANT_ID)
            .ownerId(OWNER_ID)
            .name("Test Agent")
            .description("A test agent")
            .systemPrompt("You are helpful")
            .provider(LlmProvider.OPENAI)
            .model("gpt-4o")
            .ragEnabled(false)
            .isPublic(false)
            .isSystem(false)
            .status(AgentStatus.ACTIVE)
            .usageCount(0L)
            .knowledgeSourceCount(0)
            .createdAt(Instant.now())
            .build();
    }

    @Nested
    @DisplayName("POST /api/v1/agents")
    class CreateAgent {

        @Test
        @DisplayName("should create agent and return 201")
        void createAgent_withValidRequest_shouldReturn201() throws Exception {
            // Arrange
            AgentDTO agentDTO = buildSampleAgentDTO();
            when(agentService.createAgent(eq(TENANT_ID), any(UUID.class), any(CreateAgentRequest.class)))
                .thenReturn(agentDTO);

            CreateAgentRequest request = CreateAgentRequest.builder()
                .name("Test Agent")
                .systemPrompt("You are helpful")
                .provider(LlmProvider.OPENAI)
                .model("gpt-4o")
                .build();

            // Act & Assert
            mockMvc.perform(post("/api/v1/agents")
                    .with(jwt().jwt(j -> j.subject(OWNER_ID.toString())))
                    .header("X-Tenant-ID", TENANT_ID)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name", is("Test Agent")))
                .andExpect(jsonPath("$.provider", is("OPENAI")))
                .andExpect(jsonPath("$.model", is("gpt-4o")));

            verify(agentService).createAgent(eq(TENANT_ID), eq(OWNER_ID), any());
        }

        @Test
        @DisplayName("should return 400 when name is blank")
        void createAgent_withBlankName_shouldReturn400() throws Exception {
            // Arrange
            CreateAgentRequest request = CreateAgentRequest.builder()
                .name("")
                .systemPrompt("prompt")
                .provider(LlmProvider.OPENAI)
                .model("gpt-4o")
                .build();

            // Act & Assert
            mockMvc.perform(post("/api/v1/agents")
                    .with(jwt().jwt(j -> j.subject(OWNER_ID.toString())))
                    .header("X-Tenant-ID", TENANT_ID)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("should return 401 when not authenticated")
        void createAgent_whenNotAuthenticated_shouldReturn401() throws Exception {
            // Arrange
            CreateAgentRequest request = CreateAgentRequest.builder()
                .name("Agent")
                .systemPrompt("prompt")
                .provider(LlmProvider.OPENAI)
                .model("gpt-4o")
                .build();

            // Act & Assert
            mockMvc.perform(post("/api/v1/agents")
                    .header("X-Tenant-ID", TENANT_ID)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("GET /api/v1/agents/{id}")
    class GetAgent {

        @Test
        @DisplayName("should return agent by ID")
        void getAgent_shouldReturnAgent() throws Exception {
            // Arrange
            AgentDTO agentDTO = buildSampleAgentDTO();
            when(agentService.getAgent(AGENT_ID, TENANT_ID)).thenReturn(agentDTO);

            // Act & Assert
            mockMvc.perform(get("/api/v1/agents/{id}", AGENT_ID)
                    .with(jwt().jwt(j -> j.subject(OWNER_ID.toString())))
                    .header("X-Tenant-ID", TENANT_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(AGENT_ID.toString())))
                .andExpect(jsonPath("$.name", is("Test Agent")));
        }
    }

    @Nested
    @DisplayName("PUT /api/v1/agents/{id}")
    class UpdateAgent {

        @Test
        @DisplayName("should update agent and return 200")
        void updateAgent_shouldReturn200() throws Exception {
            // Arrange
            AgentDTO agentDTO = buildSampleAgentDTO();
            when(agentService.updateAgent(eq(AGENT_ID), eq(TENANT_ID), eq(OWNER_ID), any(UpdateAgentRequest.class)))
                .thenReturn(agentDTO);

            UpdateAgentRequest request = UpdateAgentRequest.builder()
                .name("Updated Agent")
                .build();

            // Act & Assert
            mockMvc.perform(put("/api/v1/agents/{id}", AGENT_ID)
                    .with(jwt().jwt(j -> j.subject(OWNER_ID.toString())))
                    .header("X-Tenant-ID", TENANT_ID)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("Test Agent")));
        }
    }

    @Nested
    @DisplayName("DELETE /api/v1/agents/{id}")
    class DeleteAgent {

        @Test
        @DisplayName("should delete agent and return 204")
        void deleteAgent_shouldReturn204() throws Exception {
            // Arrange
            doNothing().when(agentService).deleteAgent(AGENT_ID, TENANT_ID, OWNER_ID);

            // Act & Assert
            mockMvc.perform(delete("/api/v1/agents/{id}", AGENT_ID)
                    .with(jwt().jwt(j -> j.subject(OWNER_ID.toString())))
                    .header("X-Tenant-ID", TENANT_ID))
                .andExpect(status().isNoContent());

            verify(agentService).deleteAgent(AGENT_ID, TENANT_ID, OWNER_ID);
        }
    }

    @Nested
    @DisplayName("GET /api/v1/agents/my")
    class GetMyAgents {

        @Test
        @DisplayName("should return paginated list of user agents")
        void getMyAgents_shouldReturnPage() throws Exception {
            // Arrange
            AgentDTO agentDTO = buildSampleAgentDTO();
            Page<AgentDTO> page = new PageImpl<>(List.of(agentDTO));
            when(agentService.getMyAgents(eq(TENANT_ID), eq(OWNER_ID), any(Pageable.class)))
                .thenReturn(page);

            // Act & Assert
            mockMvc.perform(get("/api/v1/agents/my")
                    .with(jwt().jwt(j -> j.subject(OWNER_ID.toString())))
                    .header("X-Tenant-ID", TENANT_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].name", is("Test Agent")));
        }
    }

    @Nested
    @DisplayName("GET /api/v1/agents")
    class GetAccessibleAgents {

        @Test
        @DisplayName("should return all accessible agents for tenant")
        void getAccessibleAgents_shouldReturnPage() throws Exception {
            // Arrange
            AgentDTO agentDTO = buildSampleAgentDTO();
            Page<AgentDTO> page = new PageImpl<>(List.of(agentDTO));
            when(agentService.getAccessibleAgents(eq(TENANT_ID), any(Pageable.class)))
                .thenReturn(page);

            // Act & Assert
            mockMvc.perform(get("/api/v1/agents")
                    .with(jwt().jwt(j -> j.subject(OWNER_ID.toString())))
                    .header("X-Tenant-ID", TENANT_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)));
        }
    }

    @Nested
    @DisplayName("GET /api/v1/agents/search")
    class SearchAgents {

        @Test
        @DisplayName("should return search results for query")
        void searchAgents_shouldReturnMatchingPage() throws Exception {
            // Arrange
            AgentDTO agentDTO = buildSampleAgentDTO();
            Page<AgentDTO> page = new PageImpl<>(List.of(agentDTO));
            when(agentService.searchAgents(eq(TENANT_ID), eq("test"), any(Pageable.class)))
                .thenReturn(page);

            // Act & Assert
            mockMvc.perform(get("/api/v1/agents/search")
                    .with(jwt().jwt(j -> j.subject(OWNER_ID.toString())))
                    .header("X-Tenant-ID", TENANT_ID)
                    .param("query", "test"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)));
        }
    }

    @Nested
    @DisplayName("GET /api/v1/agents/categories")
    class GetCategories {

        @Test
        @DisplayName("should return all active agent categories")
        void getCategories_shouldReturnList() throws Exception {
            // Arrange
            List<AgentCategoryDTO> categories = List.of(
                AgentCategoryDTO.builder().id(UUID.randomUUID()).name("Coding").displayOrder(1).build(),
                AgentCategoryDTO.builder().id(UUID.randomUUID()).name("Writing").displayOrder(2).build()
            );
            when(agentService.getCategories()).thenReturn(categories);

            // Act & Assert
            mockMvc.perform(get("/api/v1/agents/categories")
                    .with(jwt().jwt(j -> j.subject(OWNER_ID.toString()))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].name", is("Coding")))
                .andExpect(jsonPath("$[1].name", is("Writing")));
        }
    }
}
