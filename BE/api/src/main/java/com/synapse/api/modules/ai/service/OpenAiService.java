package com.synapse.api.modules.ai.service;

import com.synapse.api.modules.ai.dto.internal.AiMessage;
import com.synapse.api.modules.ai.dto.internal.AiRequest;
import com.synapse.api.modules.ai.dto.internal.AiResponse;
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

import java.util.List;

@Service("openAiService")
@RequiredArgsConstructor
@Slf4j
public class OpenAiService implements AiService {

    private final RestClient restClient;

    @Value("${ai.gms.api.key}")
    private String apiKey;

    @Value("${ai.gms.api.url}")
    private String apiUrl;

    @Value("${ai.gms.model}")
    private String model;

    @Value("${ai.gms.temperature}")
    private double temperature;

    @Value("${ai.gms.max.tokens}")
    private int maxTokens;

    @Override
    public String complete(String systemPrompt, String userPrompt) {
        AiRequest request = buildRequest(systemPrompt, userPrompt);

        try {
            AiResponse response = restClient.post()
                    .uri(apiUrl)
                    .header("Authorization", "Bearer " + apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .body(AiResponse.class);

            if (response == null || response.choices().isEmpty()) {
                throw new BusinessException(ErrorCode.AI_INVALID_RESPONSE);
            }

            log.info("OpenAI response received: length={}", response.choices().get(0).message().content().length());
            return response.choices().get(0).message().content();

        } catch (HttpStatusCodeException e) {
            log.error("GMS API error: status={}, url={}, request={}, response={}",
                e.getStatusCode(),
                apiUrl,
                request,
                e.getResponseBodyAsString(),
                e
            );
            throw new BusinessException(ErrorCode.AI_SERVICE_ERROR);
        } catch (ResourceAccessException e) {
            log.error("OpenAI network error", e);
            throw new BusinessException(ErrorCode.AI_TIMEOUT);
        }
    }

    private AiRequest buildRequest(String systemPrompt, String userPrompt) {
        return new AiRequest(
                model,
                List.of(
                        AiMessage.system(systemPrompt),
                        AiMessage.user(userPrompt)
                ),
                temperature,
                maxTokens
        );
    }
}
