package com.synapse.api.modules.block.document;

import lombok.*;
import lombok.experimental.SuperBuilder;
import org.springframework.data.annotation.TypeAlias;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@TypeAlias("code") // MongoDB _class: "code"
public class CodeBlock extends BaseBlock {

    // [핵심] DB의 Nested Document 구조와 1:1 매핑
    private CodeProperties properties;

    // 실행 히스토리는 Yjs 동기화 대상 아님 -> Root 레벨 유지
    @Builder.Default
    private List<ExecutionHistory> outputHistory = new ArrayList<>();

    private String lastOutput;
    private LocalDateTime lastExecutedAt;

    @Override
    public String getType() {
        return "code";
    }

    // --- 비즈니스 로직 ---
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

    // --- Inner Classes ---

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CodeProperties {
        private String language;
        private String code;
        private String version;
        private String executionMode;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExecutionHistory {
        private String output;
        private LocalDateTime executedAt;
        private int executionTimeMs;
        private String status;
    }
}