package com.synapse.api.modules.note.dto.response;

import com.synapse.api.modules.block.document.BaseBlock;
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
        boolean bookmark,
        Long version, // 메타데이터 버전

        UUID createdBy,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,

        // [변경] 블록 리스트 (Code, Text, Image 섞여있음)
        List<BaseBlock> blocks
) {
    public static NoteDetailResponse from(Note note, List<BaseBlock> blocks) {
        return NoteDetailResponse.builder()
                .id(note.getId())
                .title(note.getTitle())
                .directoryPath(note.getDirectoryPath())
                .pointX(note.getPointX())
                .pointY(note.getPointY())
                .bookmark(note.isBookmark())
                .version(note.getVersion())
                .createdBy(note.getCreatedBy().getId())
                .createdAt(note.getCreatedAt())
                .updatedAt(note.getUpdatedAt())
                .blocks(blocks != null ? blocks : List.of())
                .build();
    }
}