package com.synapse.api.modules.note.dto;

import com.synapse.api.modules.note.entity.Note;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.UUID;

@Builder
public record NoteResponse(
        UUID id,
        String title,
        String directoryPath,
        Double pointX,
        Double pointY,
        UUID createdBy,
        String createdByName,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static NoteResponse from(Note note) {
        return NoteResponse.builder()
                .id(note.getId())
                .title(note.getTitle())
                .directoryPath(note.getDirectoryPath())
                .pointX(note.getPointX())
                .pointY(note.getPointY())
                .createdBy(note.getCreatedBy().getId())
                .createdByName(note.getCreatedBy().getName())
                .createdAt(note.getCreatedAt())
                .updatedAt(note.getUpdatedAt())
                .build();
    }
}