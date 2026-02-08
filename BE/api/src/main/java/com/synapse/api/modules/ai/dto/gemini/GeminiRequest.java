package com.synapse.api.modules.ai.dto.gemini;

import java.util.List;

public record GeminiRequest(
        List<Content> contents
) {
    public record Content(
            List<Part> parts
    ) {}

    public record Part(
            String text
    ) {}

    public static GeminiRequest create(String systemPrompt, String userPrompt) {
        // Gemini는 system과 user를 하나의 content로 합침
        String combinedText = systemPrompt + "\n\n" + userPrompt;
        return new GeminiRequest(
                List.of(
                        new Content(
                                List.of(new Part(combinedText))
                        )
                )
        );
    }
}
