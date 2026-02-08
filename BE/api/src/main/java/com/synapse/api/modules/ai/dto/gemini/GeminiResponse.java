package com.synapse.api.modules.ai.dto.gemini;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record GeminiResponse(
        List<Candidate> candidates
) {
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Candidate(
            Content content
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Content(
            List<Part> parts
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Part(
            String text
    ) {}

    public String getText() {
        if (candidates == null || candidates.isEmpty()) {
            return "";
        }
        Candidate candidate = candidates.get(0);
        if (candidate.content() == null || candidate.content().parts() == null || candidate.content().parts().isEmpty()) {
            return "";
        }
        return candidate.content().parts().get(0).text();
    }
}
