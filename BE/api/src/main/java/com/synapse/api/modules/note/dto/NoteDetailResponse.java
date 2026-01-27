package com.synapse.api.modules.note.dto;

import com.synapse.api.modules.note.document.CodeBlock;
import com.synapse.api.modules.note.document.NoteContent;
import com.synapse.api.modules.note.entity.Note;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Builder
public record NoteDetailResponse(
        UUID id,
        String title,
        String directoryPath,
        Double pointX,
        Double pointY,
        UUID createdBy,
        String createdByName,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        String content,
        String type,
        Boolean favorite,
        List<CodeBlock> codeBlocks,
        int version
) {
    public static NoteDetailResponse from(Note note, NoteContent noteContent) {
        boolean hasContent = noteContent != null;

        return NoteDetailResponse.builder()
                .id(note.getId())
                .title(note.getTitle())
                .directoryPath(note.getDirectoryPath())
                .pointX(note.getPointX())
                .pointY(note.getPointY())
                .createdBy(note.getCreatedBy().getId())
                .createdByName(note.getCreatedBy().getName())
                .createdAt(note.getCreatedAt())
                .updatedAt(note.getUpdatedAt())
                .content(hasContent ? noteContent.getContent() : "")
                .type(hasContent ? noteContent.getType() : "text")
                .favorite(hasContent ? noteContent.getFavorite() : false)
                .codeBlocks(hasContent ? noteContent.getCodeBlocks() : List.of())
                .version(hasContent ? noteContent.getVersion() : 0)
                .build();
    }
}