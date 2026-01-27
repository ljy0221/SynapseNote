package com.synapse.api.module.note.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ExecutionHistoryRequest {
    private String output;
    private int executionTimeMs;
    private String status;
}
