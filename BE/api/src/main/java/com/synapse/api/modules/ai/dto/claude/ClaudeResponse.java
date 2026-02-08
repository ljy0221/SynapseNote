package com.synapse.api.modules.ai.dto.claude;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ClaudeResponse(
        List<Content> content
) {
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Content(
            String type,
            String text
    ) {}

    public String getText() {
        if (content == null || content.isEmpty()) {
            return "";
        }
        return content.get(0).text();
    }
}
