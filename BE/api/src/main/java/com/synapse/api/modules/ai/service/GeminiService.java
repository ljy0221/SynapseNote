package com.synapse.api.modules.ai.service;

import com.synapse.api.modules.ai.dto.gemini.GeminiRequest;
import com.synapse.api.modules.ai.dto.gemini.GeminiResponse;
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

@Service("geminiService")
@RequiredArgsConstructor
@Slf4j
public class GeminiService implements AiService {

    private final RestClient restClient;

    @Value("${ai.gms.api.key}")
    private String apiKey;

    @Value("${ai.gemini.api.url}")
    private String apiUrl;

    @Value("${ai.gemini.model}")
    private String model;

    @Override
    public String complete(String systemPrompt, String userPrompt) {
        GeminiRequest request = GeminiRequest.create(systemPrompt, userPrompt);

        try {
            String fullUrl = apiUrl.replace("{model}", model);
            
            GeminiResponse response = restClient.post()
                    .uri(fullUrl)
                    .header("x-goog-api-key", apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .body(GeminiResponse.class);

            if (response == null || response.candidates().isEmpty()) {
                throw new BusinessException(ErrorCode.AI_INVALID_RESPONSE);
            }

            log.info("Gemini response received: length={}", response.getText().length());
            return response.getText();

        } catch (HttpStatusCodeException e) {
            log.error("Gemini API error: status={}, url={}, request={}, response={}",
                e.getStatusCode(),
                apiUrl,
                request,
                e.getResponseBodyAsString(),
                e
            );
            throw new BusinessException(ErrorCode.AI_SERVICE_ERROR);
        } catch (ResourceAccessException e) {
            log.error("Gemini network error", e);
            throw new BusinessException(ErrorCode.AI_TIMEOUT);
        }
    }
}
