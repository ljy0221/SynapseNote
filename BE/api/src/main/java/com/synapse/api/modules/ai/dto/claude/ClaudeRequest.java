package com.synapse.api.modules.ai.dto.claude;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public record ClaudeRequest(
        String model,
        @JsonProperty("max_tokens")
        int maxTokens,
        List<Message> messages,
        String system  // system prompt는 별도 필드
) {
    public record Message(
            String role,
            String content
    ) {}

    public static ClaudeRequest create(String model, String systemPrompt, String userPrompt, int maxTokens) {
        return new ClaudeRequest(
                model,
                maxTokens,
                List.of(new Message("user", userPrompt)),
                systemPrompt
        );
    }
}
