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
            case ANTHROPIC, GEMINI ->
                    throw new BusinessException(ErrorCode.AI_PROVIDER_NOT_SUPPORTED,
                            String.format("%s 프로바이더는 아직 지원하지 않습니다.", provider.name()));
        };
    }
}
