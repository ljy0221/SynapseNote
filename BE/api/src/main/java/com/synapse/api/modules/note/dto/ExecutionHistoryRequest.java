package com.synapse.api.modules.note.dto;

public record ExecutionHistoryRequest(
        String output,
        int executionTimeMs,
        String status
) {
}