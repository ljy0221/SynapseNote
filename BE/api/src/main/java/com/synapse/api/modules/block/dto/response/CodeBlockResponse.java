package com.synapse.api.modules.block.dto.response;

import com.synapse.api.modules.block.document.BlockType;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Builder
public record CodeBlockResponse(
        String id,
        BlockType type,
        UUID noteId,
        UUID blockId,
        Double order,
        boolean bookmark,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        CodeProperties properties,

        List<OutputHistoryItem> outputHistory,
        String lastOutput,
        LocalDateTime lastExecutedAt
) implements BlockDetailResponse {

    @Builder
    public record CodeProperties(
            String language,
            String code,
            String version,
            String executionMode
    ) {}

    @Builder
    public record OutputHistoryItem(
            String output,
            LocalDateTime executedAt,
            long executionTimeMs,
            String status
    ) {}
}