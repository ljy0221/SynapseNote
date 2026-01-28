package com.synapse.api.modules.ai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.synapse.api.modules.ai.dto.request.CodeReviewRequest;
import com.synapse.api.modules.ai.dto.response.CodeReviewResponse;
import com.synapse.api.modules.ai.enums.AiProvider;
import com.synapse.api.modules.note.document.CodeBlock;
import com.synapse.api.modules.note.document.NoteContent;
import com.synapse.api.modules.note.repository.NoteContentRepository;
import com.synapse.api.modules.note.service.NoteService;
import com.synapse.api.util.exception.BusinessException;
import com.synapse.api.util.response.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CodeAssistantService {

    private final AiServiceFactory aiServiceFactory;
    private final NoteService noteService;
    private final NoteContentRepository noteContentRepository;
    private final ObjectMapper objectMapper;

    @Value("${ai.default.provider}")
    private String defaultProvider;

    private static final int MAX_CODE_LENGTH = 5000;

    @Transactional(readOnly = true)
    public CodeReviewResponse reviewCode(UUID noteId, String blockId,
                                          UUID userId, CodeReviewRequest request) {
        noteService.validateEditPermission(noteId, userId);

        NoteContent noteContent = noteContentRepository.findByNoteId(noteId.toString())
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTE_CONTENT_NOT_FOUND));

        CodeBlock codeBlock = noteContent.getCodeBlocks().stream()
                .filter(b -> b.getId().equals(blockId))
                .findFirst()
                .orElseThrow(() -> new BusinessException(ErrorCode.CODE_BLOCK_NOT_FOUND));

        if (codeBlock.getCode().length() > MAX_CODE_LENGTH) {
            throw new BusinessException(ErrorCode.AI_INVALID_REQUEST,
                    "Code too large for review (max 5000 characters)");
        }

        String systemPrompt = buildCodeReviewSystemPrompt(codeBlock.getLanguage());
        String userPrompt = buildCodeReviewUserPrompt(codeBlock, request.focusAreas());

        AiProvider provider = request.provider() != null
                ? request.provider()
                : AiProvider.valueOf(defaultProvider.toUpperCase());

        AiService aiService = aiServiceFactory.getService(provider);
        String aiResponse = aiService.complete(systemPrompt, userPrompt);

        log.info("Code review completed: noteId={}, blockId={}, provider={}", noteId, blockId, provider);

        return parseCodeReviewResponse(blockId, codeBlock, aiResponse);
    }

    private String buildCodeReviewSystemPrompt(String language) {
        return """
                You are an expert code reviewer for %s.
                Analyze the code for:
                - Security vulnerabilities
                - Performance issues
                - Code quality and readability
                - Best practices

                Provide structured feedback with:
                1. Specific issues (with severity: error, warning, info)
                2. Best practice recommendations
                3. Overall summary

                Be concise but actionable.
                Respond ONLY with valid JSON, no markdown code blocks.
                """.formatted(language);
    }

    private String buildCodeReviewUserPrompt(CodeBlock block, List<String> focusAreas) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("Review this ").append(block.getLanguage()).append(" code:\n\n");
        prompt.append("```").append(block.getLanguage()).append("\n");
        prompt.append(block.getCode()).append("\n```\n\n");

        if (focusAreas != null && !focusAreas.isEmpty()) {
            prompt.append("Focus on: ").append(String.join(", ", focusAreas)).append("\n\n");
        }

        prompt.append("""
                Provide your review in JSON format:
                {
                  "reviews": [
                    {
                      "severity": "error|warning|info",
                      "category": "security|performance|style|logic",
                      "issue": "description of the issue",
                      "suggestion": "how to fix it",
                      "lineNumber": null
                    }
                  ],
                  "bestPractices": ["practice 1", "practice 2"],
                  "summary": "brief overall assessment"
                }
                """);

        return prompt.toString();
    }

    private CodeReviewResponse parseCodeReviewResponse(String blockId,
                                                         CodeBlock block,
                                                         String aiResponse) {
        try {
            String jsonContent = extractJsonFromMarkdown(aiResponse);
            JsonNode root = objectMapper.readTree(jsonContent);

            List<CodeReviewResponse.ReviewItem> reviews = parseReviewItems(root.get("reviews"));
            List<String> bestPractices = parseBestPractices(root.get("bestPractices"));
            String summary = root.get("summary").asText();

            return new CodeReviewResponse(
                    blockId,
                    block.getLanguage(),
                    block.getCode(),
                    reviews,
                    bestPractices,
                    summary,
                    LocalDateTime.now()
            );

        } catch (Exception e) {
            log.error("Failed to parse AI response", e);
            throw new BusinessException(ErrorCode.AI_INVALID_RESPONSE);
        }
    }

    private List<CodeReviewResponse.ReviewItem> parseReviewItems(JsonNode reviewsNode) {
        List<CodeReviewResponse.ReviewItem> items = new ArrayList<>();
        if (reviewsNode == null || !reviewsNode.isArray()) {
            return items;
        }

        for (JsonNode item : reviewsNode) {
            items.add(new CodeReviewResponse.ReviewItem(
                    item.path("severity").asText("info"),
                    item.path("category").asText("style"),
                    item.path("issue").asText(),
                    item.path("suggestion").asText(),
                    item.path("lineNumber").isNull() ? null : item.path("lineNumber").asInt()
            ));
        }
        return items;
    }

    private List<String> parseBestPractices(JsonNode practicesNode) {
        List<String> practices = new ArrayList<>();
        if (practicesNode == null || !practicesNode.isArray()) {
            return practices;
        }

        for (JsonNode item : practicesNode) {
            practices.add(item.asText());
        }
        return practices;
    }

    private String extractJsonFromMarkdown(String response) {
        String trimmed = response.trim();

        if (trimmed.startsWith("```json")) {
            trimmed = trimmed.substring(7);
            int endIdx = trimmed.indexOf("```");
            if (endIdx > 0) {
                trimmed = trimmed.substring(0, endIdx);
            }
        } else if (trimmed.startsWith("```")) {
            trimmed = trimmed.substring(3);
            int endIdx = trimmed.indexOf("```");
            if (endIdx > 0) {
                trimmed = trimmed.substring(0, endIdx);
            }
        }

        return trimmed.trim();
    }
}
