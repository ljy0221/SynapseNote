package com.synapse.api.modules.note.dto;

import com.synapse.api.modules.note.document.CodeBlock;
import com.synapse.api.modules.note.document.NoteContent;
import com.synapse.api.modules.note.entity.Note;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NoteDetailResponse {

    private UUID id;
    private String title;
    private String directoryPath;
    private Double pointX;
    private Double pointY;
    private UUID createdBy;
    private String createdByName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private String content;
    private String type;
    private Boolean favorite;
    private List<CodeBlock> codeBlocks;
    private int version;

    public static NoteDetailResponse from(Note note, NoteContent noteContent) {
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
                .content(noteContent != null ? noteContent.getContent() : "")
                .type(noteContent != null ? noteContent.getType() : "text")
                .favorite(noteContent != null ? noteContent.getFavorite() : false)
                .codeBlocks(noteContent != null ? noteContent.getCodeBlocks() : List.of())
                .version(noteContent != null ? noteContent.getVersion() : 0)
                .build();
    }
}
