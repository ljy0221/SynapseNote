package com.synapse.api.modules.note.dto;

import com.synapse.api.modules.block.document.BaseBlock; // [New] 모든 블록의 부모
import com.synapse.api.modules.note.document.NoteMetadata;
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

        // 메타데이터 영역
        String type,      // page, canvas
        Boolean favorite,
        int version,

        // [핵심 변경] CodeBlock -> BaseBlock (텍스트, 이미지 포함)
        // 필드명도 codeBlocks -> blocks로 변경하는 것이 프론트엔드 입장에서 자연스럽습니다.
        List<BaseBlock> blocks
) {
    // [변경] blocks 리스트를 별도 파라미터로 받아야 합니다.
    public static NoteDetailResponse from(Note note, NoteMetadata noteMetadata, List<BaseBlock> blocks) {
        boolean hasContent = noteMetadata != null;

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

                // NoteMetadata 필드 매핑
                .type(hasContent ? noteMetadata.getType() : "page")
                .favorite(hasContent ? noteMetadata.getFavorite() : false)
                .version(hasContent ? noteMetadata.getVersion() : 1)

                // [핵심] 전달받은 블록 리스트 매핑
                // blocks가 null이면 빈 리스트 반환
                .blocks(blocks != null ? blocks : List.of())
                .build();
    }
}