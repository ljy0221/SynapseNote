package com.synapse.api.modules.ai.dto.request;

import com.synapse.api.modules.ai.enums.AiProvider;

import java.util.List;

public record CodeReviewRequest(
        AiProvider provider,
        List<String> focusAreas,
        Boolean includeContext  // true: 노트 내 전체 블록 컨텍스트 포함
) {
}
