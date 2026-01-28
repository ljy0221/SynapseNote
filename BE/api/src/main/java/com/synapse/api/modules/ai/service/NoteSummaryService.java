package com.synapse.api.modules.ai.service;

import com.synapse.api.modules.ai.dto.request.NoteSummaryRequest;
import com.synapse.api.modules.ai.dto.response.NoteSummaryResponse;
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

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class NoteSummaryService {

    private final AiServiceFactory aiServiceFactory;
    private final NoteService noteService;
    private final NoteContentRepository noteContentRepository;

    @Value("${ai.default.provider}")
    private String defaultProvider;

    @Transactional
    public NoteSummaryResponse summarizeNote(UUID noteId, UUID userId,
                                              NoteSummaryRequest request) {
        noteService.validateAccess(noteId, userId);

        NoteContent noteContent = noteContentRepository.findByNoteId(noteId.toString())
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTE_CONTENT_NOT_FOUND));

        String style = request.style() != null ? request.style() : "concise";
        String systemPrompt = buildSummarySystemPrompt(style);
        String userPrompt = buildSummaryUserPrompt(noteContent, request.maxLength());

        AiProvider provider = request.provider() != null
                ? request.provider()
                : AiProvider.valueOf(defaultProvider.toUpperCase());

        AiService aiService = aiServiceFactory.getService(provider);
        String summary = aiService.complete(systemPrompt, userPrompt);

        noteContent.updateSummary(summary, style, provider.name());
        noteContentRepository.save(noteContent);

        log.info("Note summary created: noteId={}, provider={}", noteId, provider);

        List<String> languages = noteContent.getCodeBlocks().stream()
                .map(CodeBlock::getLanguage)
                .distinct()
                .toList();

        return new NoteSummaryResponse(
                noteId.toString(),
                summary,
                style,
                noteContent.getCodeBlocks().size(),
                languages,
                noteContent.getSummarizedAt()
        );
    }

    public NoteSummaryResponse getSummary(UUID noteId, UUID userId) {
        noteService.validateAccess(noteId, userId);

        NoteContent noteContent = noteContentRepository.findByNoteId(noteId.toString())
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTE_CONTENT_NOT_FOUND));

        if (noteContent.getSummary() == null) {
            throw new BusinessException(ErrorCode.NOTE_SUMMARY_NOT_FOUND);
        }

        List<String> languages = noteContent.getCodeBlocks().stream()
                .map(CodeBlock::getLanguage)
                .distinct()
                .toList();

        return new NoteSummaryResponse(
                noteId.toString(),
                noteContent.getSummary(),
                noteContent.getSummaryStyle(),
                noteContent.getCodeBlocks().size(),
                languages,
                noteContent.getSummarizedAt()
        );
    }

    private String buildSummarySystemPrompt(String style) {
        return """
                You are a technical documentation assistant.
                Summarize the note's content and code blocks.

                Focus on:
                - Main purpose and key points
                - Code functionality (what the code does)
                - Important findings or results

                Style: %s
                - concise: 2-3 sentences
                - detailed: 1-2 paragraphs
                - bullet-points: 5-7 bullet points
                """.formatted(style);
    }

    private String buildSummaryUserPrompt(NoteContent content, Integer maxLength) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("Summarize this note:\n\n");

        if (content.getContent() != null && !content.getContent().isBlank()) {
            prompt.append("## Note Content\n");
            prompt.append(content.getContent()).append("\n\n");
        }

        if (!content.getCodeBlocks().isEmpty()) {
            prompt.append("## Code Blocks\n");
            for (CodeBlock block : content.getCodeBlocks()) {
                prompt.append("### ").append(block.getLanguage()).append(" Code\n");
                prompt.append("```").append(block.getLanguage()).append("\n");
                prompt.append(block.getCode()).append("\n```\n\n");
            }
        }

        int maxLen = maxLength != null ? maxLength : 500;
        prompt.append("Maximum length: ").append(maxLen).append(" words\n");

        return prompt.toString();
    }
}
