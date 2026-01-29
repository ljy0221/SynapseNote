package com.synapse.api.modules.block.dto.response;

import com.synapse.api.modules.block.document.BaseBlock;
import lombok.Builder;
import org.springframework.data.domain.Page;

import java.util.List;

@Builder
public record BlockPageResponse(
        List<BlockResponse> content,
        int currentPage,
        int totalPages,
        long totalElements,
        int size,
        boolean hasNext,
        boolean hasPrevious) {

    public static BlockPageResponse from(Page<BaseBlock> page, String notePath) {
        return BlockPageResponse.builder()
                .content(page.getContent().stream()
                        .map(block -> BlockResponse.from(block, notePath))
                        .toList())
                .currentPage(page.getNumber() + 1) // 1-based
                .totalPages(page.getTotalPages())
                .totalElements(page.getTotalElements())
                .size(page.getSize())
                .hasNext(page.hasNext())
                .hasPrevious(page.hasPrevious())
                .build();
    }
}
