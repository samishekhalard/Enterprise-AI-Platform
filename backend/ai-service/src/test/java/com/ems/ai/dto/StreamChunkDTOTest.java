package com.ems.ai.dto;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class StreamChunkDTOTest {

    @Test
    @DisplayName("content() should create chunk with type=content and done=false")
    void content_shouldCreateContentChunk() {
        // Arrange & Act
        StreamChunkDTO chunk = StreamChunkDTO.content("Hello world");

        // Assert
        assertThat(chunk.type()).isEqualTo("content");
        assertThat(chunk.content()).isEqualTo("Hello world");
        assertThat(chunk.done()).isFalse();
        assertThat(chunk.messageId()).isNull();
        assertThat(chunk.tokenCount()).isNull();
        assertThat(chunk.error()).isNull();
    }

    @Test
    @DisplayName("done() should create chunk with type=done and done=true")
    void done_shouldCreateDoneChunk() {
        // Arrange & Act
        StreamChunkDTO chunk = StreamChunkDTO.done("msg-123", 42);

        // Assert
        assertThat(chunk.type()).isEqualTo("done");
        assertThat(chunk.content()).isNull();
        assertThat(chunk.done()).isTrue();
        assertThat(chunk.messageId()).isEqualTo("msg-123");
        assertThat(chunk.tokenCount()).isEqualTo(42);
        assertThat(chunk.error()).isNull();
    }

    @Test
    @DisplayName("error() should create chunk with type=error and done=true")
    void error_shouldCreateErrorChunk() {
        // Arrange & Act
        StreamChunkDTO chunk = StreamChunkDTO.error("Connection timeout");

        // Assert
        assertThat(chunk.type()).isEqualTo("error");
        assertThat(chunk.content()).isNull();
        assertThat(chunk.done()).isTrue();
        assertThat(chunk.messageId()).isNull();
        assertThat(chunk.tokenCount()).isNull();
        assertThat(chunk.error()).isEqualTo("Connection timeout");
    }

    @Test
    @DisplayName("start() should create chunk with type=start and done=false")
    void start_shouldCreateStartChunk() {
        // Arrange & Act
        StreamChunkDTO chunk = StreamChunkDTO.start();

        // Assert
        assertThat(chunk.type()).isEqualTo("start");
        assertThat(chunk.content()).isNull();
        assertThat(chunk.done()).isFalse();
        assertThat(chunk.messageId()).isNull();
        assertThat(chunk.error()).isNull();
    }
}
