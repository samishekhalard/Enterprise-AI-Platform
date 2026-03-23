package com.ems.ai.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Builder;

@Builder
public record SendMessageRequest(
    @NotBlank(message = "Message content is required")
    String content,

    Boolean stream
) {
    public SendMessageRequest {
        if (stream == null) {
            stream = true;
        }
    }
}
