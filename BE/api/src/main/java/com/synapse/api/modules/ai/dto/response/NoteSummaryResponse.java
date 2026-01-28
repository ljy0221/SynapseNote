package com.synapse.api.modules.ai.dto.response;

import java.time.LocalDateTime;
import java.util.List;

public record NoteSummaryResponse(
        String noteId,
        String summary,
        String style,
        int codeBlockCount,
        List<String> languages,
        LocalDateTime createdAt
) {
}
