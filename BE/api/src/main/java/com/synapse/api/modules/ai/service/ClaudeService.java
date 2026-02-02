package com.synapse.api.modules.ai.service;

import com.synapse.api.modules.ai.dto.claude.ClaudeRequest;
import com.synapse.api.modules.ai.dto.claude.ClaudeResponse;
import com.synapse.api.util.exception.BusinessException;
import com.synapse.api.util.response.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;

@Service("claudeService")
@RequiredArgsConstructor
@Slf4j
public class ClaudeService implements AiService {

    private final RestClient restClient;

    @Value("${ai.claude.api.key}")
    private String apiKey;

    @Value("${ai.claude.api.url}")
    private String apiUrl;

    @Value("${ai.claude.model}")
    private String model;

    @Value("${ai.claude.max.tokens}")
    private int maxTokens;

    @Value("${ai.claude.anthropic.version}")
    private String anthropicVersion;

    @Override
    public String complete(String systemPrompt, String userPrompt) {
        ClaudeRequest request = ClaudeRequest.create(model, systemPrompt, userPrompt, maxTokens);

        try {
            ClaudeResponse response = restClient.post()
                    .uri(apiUrl)
                    .header("x-api-key", apiKey)
                    .header("anthropic-version", anthropicVersion)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .body(ClaudeResponse.class);

            if (response == null || response.content().isEmpty()) {
                throw new BusinessException(ErrorCode.AI_INVALID_RESPONSE);
            }

            log.info("Claude response received: length={}", response.getText().length());
            return response.getText();

        } catch (HttpStatusCodeException e) {
            log.error("Claude API error: status={}, url={}, request={}, response={}",
                e.getStatusCode(),
                apiUrl,
                request,
                e.getResponseBodyAsString(),
                e
            );
            throw new BusinessException(ErrorCode.AI_SERVICE_ERROR);
        } catch (ResourceAccessException e) {
            log.error("Claude network error", e);
            throw new BusinessException(ErrorCode.AI_TIMEOUT);
        }
    }
}
