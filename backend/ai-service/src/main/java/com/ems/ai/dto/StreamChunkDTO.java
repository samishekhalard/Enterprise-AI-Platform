package com.ems.ai.dto;

public record StreamChunkDTO(
    String type,
    String content,
    Boolean done,
    String messageId,
    Integer tokenCount,
    String error
) {
    public static StreamChunkDTO content(String content) {
        return new StreamChunkDTO("content", content, false, null, null, null);
    }

    public static StreamChunkDTO done(String messageId, int tokenCount) {
        return new StreamChunkDTO("done", null, true, messageId, tokenCount, null);
    }

    public static StreamChunkDTO error(String error) {
        return new StreamChunkDTO("error", null, true, null, null, error);
    }

    public static StreamChunkDTO start() {
        return new StreamChunkDTO("start", null, false, null, null, null);
    }
}
