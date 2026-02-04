package com.synapse.api.modules.ai.service;

import com.synapse.api.modules.ai.dto.request.NoteSummaryRequest;
import com.synapse.api.modules.ai.dto.response.NoteSummaryResponse;
import com.synapse.api.modules.ai.enums.AiProvider;
import com.synapse.api.modules.block.document.BaseBlock;
import com.synapse.api.modules.block.document.CodeBlock;
import com.synapse.api.modules.block.document.TextBlock;
import com.synapse.api.modules.block.repository.BlockRepository;
import com.synapse.api.modules.note.entity.Note;
import com.synapse.api.modules.note.repository.NoteRepository;
import com.synapse.api.modules.note.service.NoteValidator;
import com.synapse.api.util.exception.BusinessException;
import com.synapse.api.util.response.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class NoteSummaryService {

        private final AiServiceFactory aiServiceFactory;
        private final NoteValidator noteValidator;
        private final BlockRepository blockRepository;
        private final NoteRepository noteRepository;

        @Value("${ai.summary.provider}")
        private String summaryProvider;

        public NoteSummaryResponse summarizeNote(UUID noteId, UUID userId,
                        NoteSummaryRequest request) {
                // 1. AI 호출 (트랜잭션 외부 - DB 커넥션 점유하지 않음)
                String summaryText = generateSummaryText(noteId, userId, request);

                // 2. DB 저장 (트랜잭션 적용 - 최소한의 시간만 커넥션 점유)
                saveSummary(noteId, summaryText, request.style());

                // 3. 응답 생성 (통계 정보 포함)
                return buildResponse(noteId, summaryText, request.style());
        }

        /**
         * AI API를 호출하여 요약 텍스트를 생성합니다.
         * 트랜잭션 없음 - 네트워크 지연 동안 DB 커넥션을 점유하지 않습니다.
         */
        private String generateSummaryText(UUID noteId, UUID userId, NoteSummaryRequest request) {
                // 접근 권한 검증
                noteValidator.validateReadPermission(userId, noteId);

                // 노트의 모든 블록 조회 (삭제 안 된 것만)
                List<BaseBlock> blocks = blockRepository.findByNoteIdAndDeletedAtIsNullOrderByOrderAsc(noteId);

                String style = request.style() != null ? request.style() : "concise";
                String systemPrompt = buildSummarySystemPrompt(style);
                String userPrompt = buildSummaryUserPrompt(blocks, request.maxLength());

                AiProvider provider = request.provider() != null
                                ? request.provider()
                                : AiProvider.valueOf(summaryProvider.toUpperCase());

                AiService aiService = aiServiceFactory.getService(provider);
                String summary = aiService.complete(systemPrompt, userPrompt);

                log.info("AI summary generated: noteId={}, provider={}, blockCount={}, textLength={}",
                                noteId, provider, blocks.size(), summary.length());

                return summary;
        }

        /**
         * 생성된 요약을 노트에 저장합니다.
         * 트랜잭션 적용 - DB 작업만 수행하여 커넥션 점유 시간 최소화
         */
        @Transactional
        private void saveSummary(UUID noteId, String summary, String style) {
                Note note = noteRepository.findById(noteId)
                                .orElseThrow(() -> new BusinessException(ErrorCode.NOTE_NOT_FOUND));

                String finalStyle = style != null ? style : "concise";
                note.updateSummary(summary, finalStyle);

                log.info("Summary saved to database: noteId={}, style={}", noteId, finalStyle);
        }

        /**
         * 응답 객체를 생성합니다.
         */
        private NoteSummaryResponse buildResponse(UUID noteId, String summary, String style) {
                // 통계 정보 재조회 (캐시되어 있을 가능성 높음)
                List<BaseBlock> blocks = blockRepository.findByNoteIdAndDeletedAtIsNullOrderByOrderAsc(noteId);

                List<String> languages = blocks.stream()
                                .filter(block -> block instanceof CodeBlock)
                                .map(block -> ((CodeBlock) block).getProperties().getLanguage())
                                .distinct()
                                .toList();

                int codeBlockCount = (int) blocks.stream()
                                .filter(block -> block instanceof CodeBlock)
                                .count();

                String finalStyle = style != null ? style : "concise";

                return new NoteSummaryResponse(
                                noteId,
                                summary,
                                finalStyle,
                                codeBlockCount,
                                languages,
                                LocalDateTime.now());
        }

        private String buildSummarySystemPrompt(String style) {
                return """
                                당신은 기술 문서 작성 보조 도구입니다.
                                노트의 내용과 코드 블록을 요약하세요.

                                다음 사항에 집중하세요:
                                - 주요 목적과 핵심 포인트
                                - 코드 기능 (코드가 무엇을 하는지)
                                - 중요한 발견사항이나 결과

                                스타일: %s
                                - concise: 2-3문장
                                - detailed: 1-2단락
                                - bullet-points: 5-7개의 불릿 포인트

                                응답은 한국어로 작성하세요.
                                """.formatted(style);
        }

        private String buildSummaryUserPrompt(List<BaseBlock> blocks, Integer maxLength) {
                StringBuilder prompt = new StringBuilder();
                prompt.append("다음 노트를 요약해주세요:\n\n");

                // TextBlock 추출
                List<TextBlock> textBlocks = blocks.stream()
                                .filter(block -> block instanceof TextBlock)
                                .map(block -> (TextBlock) block)
                                .toList();

                if (!textBlocks.isEmpty()) {
                        prompt.append("## 텍스트 내용\n");
                        for (TextBlock textBlock : textBlocks) {
                                if (textBlock.getProperties() != null &&
                                                textBlock.getProperties().getContent() != null) {
                                        prompt.append(textBlock.getProperties().getContent()).append("\n\n");
                                }
                        }
                }

                // CodeBlock 추출
                List<CodeBlock> codeBlocks = blocks.stream()
                                .filter(block -> block instanceof CodeBlock)
                                .map(block -> (CodeBlock) block)
                                .toList();

                if (!codeBlocks.isEmpty()) {
                        prompt.append("## 코드 블록\n");
                        for (CodeBlock codeBlock : codeBlocks) {
                                String language = codeBlock.getProperties().getLanguage();
                                String code = codeBlock.getProperties().getCode();
                                prompt.append("### ").append(language).append(" 코드\n");
                                prompt.append("```").append(language).append("\n");
                                prompt.append(code).append("\n```\n\n");
                        }
                }

                int maxLen = maxLength != null ? maxLength : 500;
                prompt.append("최대 길이: ").append(maxLen).append("자\n");

                return prompt.toString();
        }
}
