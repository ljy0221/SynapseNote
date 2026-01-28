package com.synapse.api.modules.ai.dto.request;

import com.synapse.api.modules.ai.enums.AiProvider;

import java.util.List;

public record CodeReviewRequest(
        AiProvider provider,
        List<String> focusAreas
) {
}
