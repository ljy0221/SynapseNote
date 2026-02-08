package com.synapse.api.modules.ai.service;

import com.synapse.api.modules.ai.enums.AiProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

@Component
public class AiServiceFactory {

    private final AiService openAiService;
    private final AiService geminiService;
    private final AiService claudeService;

    public AiServiceFactory(
            @Qualifier("openAiService") AiService openAiService,
            @Qualifier("geminiService") AiService geminiService,
            @Qualifier("claudeService") AiService claudeService
    ) {
        this.openAiService = openAiService;
        this.geminiService = geminiService;
        this.claudeService = claudeService;
    }

    public AiService getService(AiProvider provider) {
        return switch (provider) {
            case OPENAI -> openAiService;
            case GEMINI -> geminiService;
            case ANTHROPIC -> claudeService;
        };
    }
}
