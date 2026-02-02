package com.synapse.api.modules.ai.dto.request;

import com.synapse.api.modules.ai.enums.AiProvider;

public record NoteSummaryRequest(
        AiProvider provider,
        String style,
        Integer maxLength
) {
}
