package com.synapse.api.modules.ai.dto.internal;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record AiResponse(
        List<Choice> choices
) {
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Choice(
            AiMessage message
    ) {}
}
