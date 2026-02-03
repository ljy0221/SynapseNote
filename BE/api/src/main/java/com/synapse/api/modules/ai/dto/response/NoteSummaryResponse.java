package com.synapse.api.modules.ai.dto.response;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record NoteSummaryResponse(
        UUID noteId,
        String summary,
        String style,
        int codeBlockCount,
        List<String> languages,
        LocalDateTime createdAt
) {
}
