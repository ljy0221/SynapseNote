package com.synapse.api.modules.ai.service;

import com.synapse.api.modules.ai.enums.AiProvider;
import com.synapse.api.util.exception.BusinessException;
import com.synapse.api.util.response.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class AiServiceFactory {

    private final Map<String, AiService> services;

    public AiService getService(AiProvider provider) {
        return switch (provider) {
            case OPENAI -> services.get("openAiService");
            case GEMINI -> services.get("geminiService");
            case ANTHROPIC -> services.get("claudeService");
        };
    }
}
