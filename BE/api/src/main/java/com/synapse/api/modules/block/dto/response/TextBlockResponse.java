package com.synapse.api.modules.block.dto.response;

import com.synapse.api.modules.block.document.BlockType;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Builder
public record TextBlockResponse(
        String id,
        BlockType type,
        UUID noteId,
        UUID blockId,
        Double order,
        boolean bookmark,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        TextProperties properties
) implements BlockDetailResponse {

    @Builder
    public record TextProperties(
            String content,
            Attributes attributes
    ) {
        @Builder
        public record Attributes(
                String align,
                String color,
                boolean bold,
                Map<String, Object> additionalAttributes
        ) {}
    }
}
