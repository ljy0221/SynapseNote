package com.synapse.api.module.note.dto;

import com.synapse.api.module.note.document.CodeBlock;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
@Builder
public class ExecutionHistoryResponse {
    private String output;
    private LocalDateTime executedAt;
    private int executionTimeMs;
    private String status;

    public static ExecutionHistoryResponse from(CodeBlock.ExecutionHistory history) {
        return ExecutionHistoryResponse.builder()
                .output(history.getOutput())
                .executedAt(history.getExecutedAt())
                .executionTimeMs(history.getExecutionTimeMs())
                .status(history.getStatus())
                .build();
    }
}
