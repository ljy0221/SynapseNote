package com.synapse.api.modules.ai.service;

public interface AiService {
    String complete(String systemPrompt, String userPrompt);
}
