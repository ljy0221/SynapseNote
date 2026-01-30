package com.synapse.api.modules.note.dto.request;

public record ExecutionHistoryRequest(
        String output,
        int executionTimeMs,
        String status
) {
}