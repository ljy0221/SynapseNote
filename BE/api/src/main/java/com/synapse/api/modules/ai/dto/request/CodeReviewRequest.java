package com.synapse.api.modules.ai.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.synapse.api.modules.ai.enums.AiProvider;

import java.util.List;

public record CodeReviewRequest(
        @JsonProperty("provider") AiProvider provider,
        @JsonProperty("focusAreas") List<String> focusAreas,
        @JsonProperty("includeContext") Boolean includeContext, // true: 노트 내 전체 블록 컨텍스트 포함
        @JsonProperty("language") String language,
        @JsonProperty("codeContent") String codeContent) {
}
