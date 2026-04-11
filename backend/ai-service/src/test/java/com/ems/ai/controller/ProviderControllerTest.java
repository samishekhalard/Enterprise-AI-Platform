package com.ems.ai.controller;

import com.ems.ai.dto.ModelInfoDTO;
import com.ems.ai.dto.ProviderInfoDTO;
import com.ems.ai.entity.AgentEntity.LlmProvider;
import com.ems.ai.provider.LlmProviderFactory;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.bean.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ProviderController.class)
class ProviderControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private LlmProviderFactory providerFactory;

    @Nested
    @DisplayName("GET /api/v1/providers")
    class GetProviders {

        @Test
        @DisplayName("should return all available providers")
        void getProviders_shouldReturnAll() throws Exception {
            // Arrange
            List<ProviderInfoDTO> providers = List.of(
                ProviderInfoDTO.builder()
                    .provider(LlmProvider.OPENAI)
                    .displayName("OpenAI")
                    .enabled(true)
                    .models(List.of(
                        ModelInfoDTO.builder()
                            .id("gpt-4o")
                            .name("GPT-4o")
                            .maxTokens(128000)
                            .isDefault(true)
                            .build()))
                    .supportsStreaming(true)
                    .supportsEmbeddings(true)
                    .build(),
                ProviderInfoDTO.builder()
                    .provider(LlmProvider.ANTHROPIC)
                    .displayName("Anthropic Claude")
                    .enabled(false)
                    .models(List.of())
                    .supportsStreaming(true)
                    .supportsEmbeddings(false)
                    .build()
            );
            when(providerFactory.getAvailableProviders()).thenReturn(providers);

            // Act & Assert
            mockMvc.perform(get("/api/v1/providers")
                    .with(jwt().authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_TENANT_ADMIN"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].provider", is("OPENAI")))
                .andExpect(jsonPath("$[0].displayName", is("OpenAI")))
                .andExpect(jsonPath("$[0].enabled", is(true)))
                .andExpect(jsonPath("$[1].provider", is("ANTHROPIC")))
                .andExpect(jsonPath("$[1].enabled", is(false)));
        }
    }

    @Nested
    @DisplayName("GET /api/v1/providers/enabled")
    class GetEnabledProviders {

        @Test
        @DisplayName("should return only enabled providers")
        void getEnabledProviders_shouldReturnOnlyEnabled() throws Exception {
            // Arrange
            List<ProviderInfoDTO> enabledProviders = List.of(
                ProviderInfoDTO.builder()
                    .provider(LlmProvider.OPENAI)
                    .displayName("OpenAI")
                    .enabled(true)
                    .models(List.of())
                    .supportsStreaming(true)
                    .supportsEmbeddings(true)
                    .build()
            );
            when(providerFactory.getEnabledProviders()).thenReturn(enabledProviders);

            // Act & Assert
            mockMvc.perform(get("/api/v1/providers/enabled")
                    .with(jwt().authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_TENANT_ADMIN"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].enabled", is(true)));
        }

        @Test
        @DisplayName("should return empty list when no providers enabled")
        void getEnabledProviders_whenNoneEnabled_shouldReturnEmpty() throws Exception {
            // Arrange
            when(providerFactory.getEnabledProviders()).thenReturn(List.of());

            // Act & Assert
            mockMvc.perform(get("/api/v1/providers/enabled")
                    .with(jwt().authorities(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_TENANT_ADMIN"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
        }
    }
}
