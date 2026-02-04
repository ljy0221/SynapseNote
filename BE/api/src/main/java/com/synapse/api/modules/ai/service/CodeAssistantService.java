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
    private final NoteValidator noteValidator;
    private final BlockRepository blockRepository;
    private final ObjectMapper objectMapper;

    @Value("${ai.code-review.provider}")
    private String codeReviewProvider;

    private static final int MAX_CODE_LENGTH = 5000;

    @Transactional(readOnly = true)
    public CodeReviewResponse reviewCode(UUID noteId, UUID blockId,
            UUID userId, CodeReviewRequest request) {
        // 편집 권한 검증
        noteValidator.validateEditPermission(noteId, userId);

        // 블록 조회
        BaseBlock baseBlock = blockRepository.findByBlockIdAndDeletedAtIsNull(blockId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CODE_BLOCK_NOT_FOUND));

        // 노트 소유권 확인
        if (!baseBlock.getNoteId().equals(noteId)) {
            throw new BusinessException(ErrorCode.NOTE_ACCESS_DENIED);
        }

        // CodeBlock 타입 확인
        if (!(baseBlock instanceof CodeBlock codeBlock)) {
            throw new BusinessException(ErrorCode.INVALID_BLOCK_TYPE);
        }

        // 코드 길이 검증
        String code = codeBlock.getProperties().getCode();
        if (code.length() > MAX_CODE_LENGTH) {
            throw new BusinessException(ErrorCode.AI_INVALID_REQUEST,
                    "Code too large for review (max 5000 characters)");
        }

        // 언어 설정: 요청 파라미터 우선, 없으면 DB 저장값 사용
        String language = (request.language() != null && !request.language().isEmpty())
                ? request.language()
                : codeBlock.getProperties().getLanguage();
        String systemPrompt = buildCodeReviewSystemPrompt(language);

        // 세션 모드: 전체 블록 컨텍스트 포함
        List<CodeBlock> contextBlocks = null;
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

        log.info("Code review completed: noteId={}, blockId={}, provider={}, contextBlocks={}",
                noteId, blockId, provider, contextBlocks != null ? contextBlocks.size() : 0);

        return parseCodeReviewResponse(blockId, language, code, aiResponse);
    }

    private String buildCodeReviewSystemPrompt(String language) {
        return """
                당신은 %s 언어 전문 코드 리뷰어입니다.
                다음 관점에서 코드를 분석하세요:
                - 보안 취약점
                - 성능 이슈
                - 코드 품질 및 가독성
                - 모범 사례

                다음 내용을 포함한 구조화된 피드백을 제공하세요:
                1. 구체적인 문제점 (심각도: error, warning, info)
                2. 모범 사례 권장사항
                3. 전체 요약

                간결하면서도 실행 가능한 조언을 제공하세요.
                응답은 반드시 유효한 JSON 형식으로만 작성하세요. 마크다운 코드 블록은 사용하지 마세요.
                """.formatted(language);
    }

    private String buildCodeReviewUserPrompt(String code, String language,
            List<String> focusAreas,
            List<CodeBlock> contextBlocks) {
        StringBuilder prompt = new StringBuilder();

        // 컨텍스트 블록이 있으면 먼저 추가
        if (contextBlocks != null && !contextBlocks.isEmpty()) {
            prompt.append("## 참고: 이 노트의 다른 코드 블록들\n\n");
            for (int i = 0; i < contextBlocks.size(); i++) {
                CodeBlock ctx = contextBlocks.get(i);
                prompt.append("### 컨텍스트 블록 ").append(i + 1)
                        .append(" (").append(ctx.getProperties().getLanguage()).append(")\n");
                prompt.append("```").append(ctx.getProperties().getLanguage()).append("\n");
                prompt.append(ctx.getProperties().getCode()).append("\n```\n\n");
            }
            prompt.append("---\n\n");
        }

        // 리뷰 대상 코드
        prompt.append("## 리뷰 대상 코드\n\n");
        prompt.append("다음 ").append(language).append(" 코드를 리뷰해주세요:\n\n");
        prompt.append("```").append(language).append("\n");
        prompt.append(code).append("\n```\n\n");

        if (focusAreas != null && !focusAreas.isEmpty()) {
            prompt.append("집중 검토 영역: ").append(String.join(", ", focusAreas)).append("\n\n");
        }

        prompt.append("""
                다음 JSON 형식으로 리뷰를 제공하세요:
                {
                  "reviews": [
                    {
                      "severity": "error|warning|info",
                      "category": "security|performance|style|logic",
                      "issue": "문제점 설명",
                      "suggestion": "개선 방법",
                      "lineNumber": null
                    }
                  ],
                  "bestPractices": ["모범 사례 1", "모범 사례 2"],
                  "summary": "전체 평가 요약"
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
            String summary = root.get("summary").asText();

            return new CodeReviewResponse(
                    blockId,
                    language,
                    code,
                    reviews,
                    bestPractices,
                    summary,
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
