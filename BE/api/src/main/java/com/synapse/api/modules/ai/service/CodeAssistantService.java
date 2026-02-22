package com.synapse.api.modules.ai.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.synapse.api.modules.ai.dto.request.CodeReviewRequest;
import com.synapse.api.modules.ai.dto.response.CodeReviewResponse;
import com.synapse.api.modules.ai.enums.AiProvider;
import com.synapse.api.modules.block.document.BaseBlock;
import com.synapse.api.modules.block.document.CodeBlock;
import com.synapse.api.modules.block.repository.BlockRepository;
import com.synapse.api.modules.note.service.NoteValidator;
import com.synapse.api.util.exception.BusinessException;
import com.synapse.api.util.response.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
@Slf4j
public class CodeAssistantService {

    private final AiServiceFactory aiServiceFactory;
    private final NoteValidator noteValidator;
    private final BlockRepository blockRepository;
    private final ObjectMapper objectMapper;

    @Value("${ai.code-review.provider}")
    private String codeReviewProvider;

    private static final int MAX_CODE_LENGTH = 5000;

    @Async("aiTaskExecutor")
    public CompletableFuture<CodeReviewResponse> reviewCode(UUID noteId, UUID blockId,
            UUID userId, CodeReviewRequest request) {

        // 1. 편집 권한 검증
        noteValidator.validateEditPermission(noteId, userId);

        // 2. 블록 조회 및 검증
        BaseBlock baseBlock = blockRepository.findByBlockIdAndDeletedAtIsNull(blockId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CODE_BLOCK_NOT_FOUND));

        if (!baseBlock.getNoteId().equals(noteId)) {
            throw new BusinessException(ErrorCode.NOTE_ACCESS_DENIED);
        }

        if (!(baseBlock instanceof CodeBlock codeBlock)) {
            throw new BusinessException(ErrorCode.INVALID_BLOCK_TYPE);
        }

        // 3. 코드 컨텐츠 확인
        String code = ((CodeBlock) baseBlock).getProperties().getCode();
        if (code == null || code.trim().isEmpty()) {
            throw new BusinessException(ErrorCode.AI_INVALID_REQUEST, "코드가 비어있습니다.");
        }

        // 4. 코드 길이 검증
        if (code.length() > MAX_CODE_LENGTH) {
            throw new BusinessException(ErrorCode.AI_INVALID_REQUEST,
                    "Code too large for review (max 5000 characters)");
        }

        // 5. 언어 설정
        String language = ((CodeBlock) baseBlock).getProperties().getLanguage();
        if (language == null || language.isEmpty()) {
            language = "text";
        }

        String systemPrompt = buildCodeReviewSystemPrompt(language);

        // 6. 컨텍스트 블록 조회 (옵션)
        List<CodeBlock> contextBlocks = new ArrayList<>();
        if (Boolean.TRUE.equals(request.includeContext())) {
            contextBlocks = blockRepository.findByNoteIdAndDeletedAtIsNullOrderByOrderAsc(noteId).stream()
                    .filter(block -> block instanceof CodeBlock)
                    .map(block -> (CodeBlock) block)
                    .filter(block -> !block.getBlockId().equals(blockId)) // 현재 블록 제외
                    .toList();
            log.info("Including {} context blocks for code review", contextBlocks.size());
        }

        String userPrompt = buildCodeReviewUserPrompt(code, language, request.focusAreas(), contextBlocks);

        AiProvider provider = request.provider() != null
                ? request.provider()
                : AiProvider.valueOf(codeReviewProvider.toUpperCase());

        AiService aiService = aiServiceFactory.getService(provider);
        String aiResponse = aiService.complete(systemPrompt, userPrompt);

        log.info("Code review completed: noteId={}, blockId={}, provider={}",
                noteId, blockId, provider);

        return CompletableFuture.completedFuture(
                parseCodeReviewResponse(blockId, language, code, aiResponse));
    }

    private String buildCodeReviewSystemPrompt(String language) {
        return """
                당신은 %s 언어 전문 시니어 개발자이자 코드 리뷰어입니다.
                주니어 개발자가 작성한 코드를 리뷰하고 피드백을 제공하는 역할을 맡았습니다.

                다음 원칙을 반드시 준수하세요:
                1. **전문적이고 객관적인 어조 유지**: 이모지는 절대 사용하지 마세요. 비격식적인 표현을 피하고 정중하고 명확하게 작성하세요.
                2. **구체적이고 건설적인 피드백**: '왜' 문제가 되는지 설명하고 '어떻게' 개선할 수 있는지 설명하세요.
                3. **핵심에 집중**: 사소한 스타일 문제보다는 보안, 성능, 아키텍처, 잠재적 버그 등 중요한 문제에 집중하세요.
                4. **현재 코드에 집중**: "실무에서는...", "프로덕션 환경이라면..." 같은 일반론적인 가정보다는, **현재 작성된 코드의 문맥 내에서** 직접적인 개선점을 제시하세요. 과도한 가정에 기반한 피드백은 지양하세요.

                응답은 반드시 유효한 JSON 형식으로만 작성하세요. 마크다운 코드 블록(```json 등)은 사용하지 마세요.
                """
                .formatted(language);
    }

    private String buildCodeReviewUserPrompt(String code, String language,
            List<String> focusAreas,
            List<CodeBlock> contextBlocks) {
        StringBuilder prompt = new StringBuilder();

        // 컨텍스트 블록이 있으면 먼저 추가
        if (contextBlocks != null && !contextBlocks.isEmpty()) {
            prompt.append("## 참고: 이 노트의 다른 코드 블록들\\n\\n");
            for (int i = 0; i < contextBlocks.size(); i++) {
                CodeBlock ctx = contextBlocks.get(i);
                prompt.append("### 컨텍스트 블록 ").append(i + 1)
                        .append(" (").append(ctx.getProperties().getLanguage()).append(")\\n");
                prompt.append("```").append(ctx.getProperties().getLanguage()).append("\\n");
                prompt.append(ctx.getProperties().getCode()).append("\\n```\\n\\n");
            }
            prompt.append("---\\n\\n");
        }

        // 리뷰 대상 코드
        prompt.append("## 리뷰 대상 코드\\n\\n");
        prompt.append("다음 ").append(language).append(" 코드를 리뷰해주세요:\\n\\n");
        prompt.append("```").append(language).append("\\n");
        prompt.append(code).append("\\n```\\n\\n");

        if (focusAreas != null && !focusAreas.isEmpty()) {
            prompt.append("집중 검토 영역: ").append(String.join(", ", focusAreas)).append("\\n\\n");
        }

        prompt.append(
                """
                        다음 JSON 형식으로 리뷰를 제공하세요:
                        {
                          "reviews": [
                            {
                              "severity": "error|warning|info",
                              "category": "security|performance|style|logic",
                              "issue": "문제점 설명(전문적인 용어 사용)",
                              "suggestion": "구체적인 개선 방안 설명 (코드는 제외)",
                              "suggestionCode": "개선된 코드 (필요한 경우에만 작성, 마크다운 없이 순수 코드만)",
                              "lineNumber": null
                            }
                          ],
                          "bestPractices": ["모범 사례 1", "모범 사례 2"]
                        }
                        """);

        return prompt.toString();
    }

    private CodeReviewResponse parseCodeReviewResponse(UUID blockId,
            String language,
            String code,
            String aiResponse) {
        try {
            String jsonContent = extractJsonFromMarkdown(aiResponse);
            JsonNode root = objectMapper.readTree(jsonContent);

            List<CodeReviewResponse.ReviewItem> reviews = parseReviewItems(root.get("reviews"));
            List<String> bestPractices = parseBestPractices(root.get("bestPractices"));

            return new CodeReviewResponse(
                    blockId,
                    language,
                    code,
                    reviews,
                    bestPractices,
                    LocalDateTime.now());

        } catch (JsonProcessingException e) {
            log.error("JSON parsing failed: response={}", aiResponse, e);
            throw new BusinessException(
                    ErrorCode.AI_INVALID_RESPONSE,
                    "AI 응답을 JSON으로 파싱할 수 없습니다.");
        } catch (NullPointerException e) {
            log.error("Required field missing in AI response: response={}", aiResponse, e);
            throw new BusinessException(
                    ErrorCode.AI_INVALID_RESPONSE,
                    "AI 응답에 필수 필드가 없습니다.");
        } catch (Exception e) {
            log.error("Unexpected error parsing AI response: response={}", aiResponse, e);
            throw new BusinessException(
                    ErrorCode.AI_INVALID_RESPONSE,
                    "AI 응답 처리 중 예상치 못한 오류가 발생했습니다.");
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
                    item.path("suggestionCode").asText(null),
                    item.path("lineNumber").isNull() ? null : item.path("lineNumber").asInt()));
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
