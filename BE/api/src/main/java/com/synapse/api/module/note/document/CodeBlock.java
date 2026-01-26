package com.synapse.api.module.note.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CodeBlock {

    private String id;
    private String language;
    private String version;
    private String code;
    private String executionMode;

    @Builder.Default
    private List<ExecutionHistory> outputHistory = new ArrayList<>();

    private String lastOutput;
    private LocalDateTime lastExecutedAt;

    public static CodeBlock create(String language, String version, String code, String executionMode) {
        return CodeBlock.builder()
                .id(UUID.randomUUID().toString())
                .language(language)
                .version(version)
                .code(code)
                .executionMode(executionMode)
                .outputHistory(new ArrayList<>())
                .build();
    }

    public void execute(String output, int executionTimeMs, String status) {
        ExecutionHistory history = ExecutionHistory.builder()
                .output(output)
                .executedAt(LocalDateTime.now())
                .executionTimeMs(executionTimeMs)
                .status(status)
                .build();

        this.outputHistory.add(history);
        this.lastOutput = output;
        this.lastExecutedAt = LocalDateTime.now();
    }

    public void updateCode(String code) {
        this.code = code;
    }

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ExecutionHistory {
        private String output;
        private LocalDateTime executedAt;
        private int executionTimeMs;
        private String status;
    }
}
