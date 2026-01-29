package com.synapse.api.modules.block.document;

import lombok.*;
import lombok.experimental.SuperBuilder;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.annotation.TypeAlias;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@TypeAlias("code") // MongoDB에서 _class 필드에 "code"로 저장됨
public class CodeBlock extends BaseBlock {

    /**
     * @Field("properties.xxx") 어노테이션의 역할:
     * Express(Yjs) 브릿지가 데이터를 { properties: { code: "...", language: "..." } } 형태로 저장해도,
     * Java에서는 this.code로 바로 접근할 수 있게 해줍니다.
     */

    @Field("properties.language")
    private String language;

    @Field("properties.code")
    private String code;

    @Field("properties.version")
    private String version;

    @Field("properties.executionMode")
    private String executionMode;

    // --- 아래 필드들은 Yjs 동기화 대상이 아니라 서버 실행 결과이므로 Root 레벨에 저장 ---

    @Builder.Default
    @Field("outputHistory")
    private List<ExecutionHistory> outputHistory = new ArrayList<>();

    @Field("lastOutput")
    private String lastOutput;

    @Field("lastExecutedAt")
    private LocalDateTime lastExecutedAt;


    // --- 비즈니스 로직 (기존 유지) ---

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

    // --- Inner Class ---

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