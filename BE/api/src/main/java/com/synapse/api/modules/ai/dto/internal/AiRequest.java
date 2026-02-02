package com.synapse.api.modules.ai.dto.internal;

import java.util.List;

public record AiRequest(
        String model,
        List<AiMessage> messages,
        double temperature,
        int maxTokens
) {
}
