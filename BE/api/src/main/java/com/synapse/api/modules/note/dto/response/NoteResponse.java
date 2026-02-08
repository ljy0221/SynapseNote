package com.synapse.api.modules.note.dto.response;

import com.synapse.api.modules.note.entity.Note;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.UUID;

@Builder
public record NoteResponse(
        UUID noteId,
        String title,
        String directoryPath,
        UUID createdBy,
        String createdByName,
        boolean bookmark,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {
    public static NoteResponse from(Note note) {
        return NoteResponse.builder()
                .noteId(note.getId())
                .title(note.getTitle())
                .directoryPath(note.getDirectoryPath())
                .createdBy(note.getCreatedBy().getId())
                .createdByName(note.getCreatedBy().getName())
                .bookmark(note.isBookmark())
                .createdAt(note.getCreatedAt())
                .updatedAt(note.getUpdatedAt())
                .build();
    }
}