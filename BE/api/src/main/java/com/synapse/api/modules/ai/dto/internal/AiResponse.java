package com.synapse.api.modules.ai.dto.internal;

import java.util.List;

public record AiResponse(
        List<Choice> choices
) {
    public record Choice(
            AiMessage message
    ) {}
}
