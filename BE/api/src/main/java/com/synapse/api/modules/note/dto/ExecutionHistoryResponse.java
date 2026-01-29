package com.synapse.api.modules.note.dto;

import com.synapse.api.modules.block.document.CodeBlock;
import lombok.Builder;

import java.time.LocalDateTime;

@Builder
public record ExecutionHistoryResponse(
        String output,
        LocalDateTime executedAt,
        int executionTimeMs,
        String status
) {
    public static ExecutionHistoryResponse from(CodeBlock.ExecutionHistory history) {
        return ExecutionHistoryResponse.builder()
                .output(history.getOutput())
                .executedAt(history.getExecutedAt())
                .executionTimeMs(history.getExecutionTimeMs())
                .status(history.getStatus())
                .build();
    }
}