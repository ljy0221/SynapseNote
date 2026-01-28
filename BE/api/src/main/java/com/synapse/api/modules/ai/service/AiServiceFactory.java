package com.synapse.api.modules.ai.service;

import com.synapse.api.modules.ai.enums.AiProvider;
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
            default -> services.get("openAiService");
        };
    }
}
