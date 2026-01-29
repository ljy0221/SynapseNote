package com.synapse.api.modules.note.dto.response;

import lombok.Builder;
import org.springframework.data.domain.Page;

import java.util.List;

@Builder
public record NotePageResponse(
        List<NoteResponse> content,
        int currentPage,
        int totalPages,
        long totalElements,
        int size,
        boolean hasNext,
        boolean hasPrevious) {
    public static NotePageResponse from(Page<NoteResponse> page) {
        return NotePageResponse.builder()
                .content(page.getContent())
                .currentPage(page.getNumber())
                .totalPages(page.getTotalPages())
                .totalElements(page.getTotalElements())
                .size(page.getSize())
                .hasNext(page.hasNext())
                .hasPrevious(page.hasPrevious())
                .build();
    }
}
