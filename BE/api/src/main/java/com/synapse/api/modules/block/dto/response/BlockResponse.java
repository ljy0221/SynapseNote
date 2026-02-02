package com.synapse.api.modules.block.dto.response;

import com.synapse.api.modules.block.document.BaseBlock;
import com.synapse.api.modules.block.document.CodeBlock;
import com.synapse.api.modules.block.document.TextBlock;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.UUID;

@Builder
public record BlockResponse(
        UUID blockId,
        UUID noteId,
        String notePath,
        String type,
        Object content, // CodeBlock.CodeProperties or TextBlock.TextProperties
        boolean bookmark,
        Double order,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {

    public static BlockResponse from(BaseBlock block, String notePath) {
        Object content = null;
        if (block instanceof CodeBlock codeBlock) {
            content = codeBlock.getProperties().getCode();
        } else if (block instanceof TextBlock textBlock) {
            content = textBlock.getProperties().getContent();
        }

        return BlockResponse.builder()
                .blockId(block.getBlockId())
                .noteId(block.getNoteId())
                .notePath(notePath)
                .type(block.getType())
                .content(content)
                .bookmark(block.isBookmark())
                .order(block.getOrder())
                .createdAt(block.getCreatedAt())
                .updatedAt(block.getUpdatedAt())
                .build();
    }
}
