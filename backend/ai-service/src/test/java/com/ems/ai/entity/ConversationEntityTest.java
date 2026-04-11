package com.ems.ai.entity;

import com.ems.ai.entity.ConversationEntity.ConversationStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class ConversationEntityTest {

    @Nested
    @DisplayName("incrementMessageCount")
    class IncrementMessageCount {

        @Test
        @DisplayName("should increment from zero to one")
        void incrementMessageCount_fromZero_shouldBeOne() {
            // Arrange
            ConversationEntity conversation = ConversationEntity.builder()
                .id(UUID.randomUUID())
                .messageCount(0)
                .messages(new ArrayList<>())
                .build();

            // Act
            conversation.incrementMessageCount();

            // Assert
            assertThat(conversation.getMessageCount()).isEqualTo(1);
            assertThat(conversation.getLastMessageAt()).isNotNull();
        }

        @Test
        @DisplayName("should increment from existing count")
        void incrementMessageCount_fromExisting_shouldIncrement() {
            // Arrange
            ConversationEntity conversation = ConversationEntity.builder()
                .id(UUID.randomUUID())
                .messageCount(5)
                .messages(new ArrayList<>())
                .build();

            // Act
            conversation.incrementMessageCount();

            // Assert
            assertThat(conversation.getMessageCount()).isEqualTo(6);
        }

        @Test
        @DisplayName("should handle null messageCount gracefully")
        void incrementMessageCount_whenNull_shouldHandleGracefully() {
            // Arrange
            ConversationEntity conversation = ConversationEntity.builder()
                .id(UUID.randomUUID())
                .messages(new ArrayList<>())
                .build();
            conversation.setMessageCount(null);

            // Act
            conversation.incrementMessageCount();

            // Assert
            assertThat(conversation.getMessageCount()).isEqualTo(1);
        }

        @Test
        @DisplayName("should update lastMessageAt timestamp")
        void incrementMessageCount_shouldUpdateLastMessageAt() {
            // Arrange
            ConversationEntity conversation = ConversationEntity.builder()
                .id(UUID.randomUUID())
                .messageCount(0)
                .messages(new ArrayList<>())
                .build();

            // Act
            conversation.incrementMessageCount();

            // Assert
            assertThat(conversation.getLastMessageAt()).isNotNull();
        }
    }

    @Nested
    @DisplayName("addTokens")
    class AddTokens {

        @Test
        @DisplayName("should add tokens from zero")
        void addTokens_fromZero_shouldSetCorrectly() {
            // Arrange
            ConversationEntity conversation = ConversationEntity.builder()
                .id(UUID.randomUUID())
                .totalTokens(0)
                .messages(new ArrayList<>())
                .build();

            // Act
            conversation.addTokens(100);

            // Assert
            assertThat(conversation.getTotalTokens()).isEqualTo(100);
        }

        @Test
        @DisplayName("should accumulate tokens")
        void addTokens_fromExisting_shouldAccumulate() {
            // Arrange
            ConversationEntity conversation = ConversationEntity.builder()
                .id(UUID.randomUUID())
                .totalTokens(50)
                .messages(new ArrayList<>())
                .build();

            // Act
            conversation.addTokens(75);

            // Assert
            assertThat(conversation.getTotalTokens()).isEqualTo(125);
        }

        @Test
        @DisplayName("should handle null totalTokens gracefully")
        void addTokens_whenNull_shouldHandleGracefully() {
            // Arrange
            ConversationEntity conversation = ConversationEntity.builder()
                .id(UUID.randomUUID())
                .messages(new ArrayList<>())
                .build();
            conversation.setTotalTokens(null);

            // Act
            conversation.addTokens(50);

            // Assert
            assertThat(conversation.getTotalTokens()).isEqualTo(50);
        }
    }

    @Nested
    @DisplayName("builder defaults")
    class BuilderDefaults {

        @Test
        @DisplayName("should default status to ACTIVE")
        void builder_shouldDefaultStatusToActive() {
            // Arrange & Act
            ConversationEntity conversation = ConversationEntity.builder()
                .id(UUID.randomUUID())
                .messages(new ArrayList<>())
                .build();

            // Assert
            assertThat(conversation.getStatus()).isEqualTo(ConversationStatus.ACTIVE);
        }

        @Test
        @DisplayName("should default messageCount to 0")
        void builder_shouldDefaultMessageCountToZero() {
            // Arrange & Act
            ConversationEntity conversation = ConversationEntity.builder()
                .id(UUID.randomUUID())
                .messages(new ArrayList<>())
                .build();

            // Assert
            assertThat(conversation.getMessageCount()).isEqualTo(0);
        }

        @Test
        @DisplayName("should default totalTokens to 0")
        void builder_shouldDefaultTotalTokensToZero() {
            // Arrange & Act
            ConversationEntity conversation = ConversationEntity.builder()
                .id(UUID.randomUUID())
                .messages(new ArrayList<>())
                .build();

            // Assert
            assertThat(conversation.getTotalTokens()).isEqualTo(0);
        }
    }
}
