package com.synapse.api.modules.ai.dto.internal;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public record AiRequest(
        String model,
        List<AiMessage> messages,
        double temperature,

        @JsonProperty("max_tokens")
        int maxTokens
) {
}
