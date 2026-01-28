package com.synapse.api.modules.ai.dto.response;

import java.time.LocalDateTime;
import java.util.List;

public record CodeReviewResponse(
        String blockId,
        String language,
        String originalCode,
        List<ReviewItem> reviews,
        List<String> bestPractices,
        String summary,
        LocalDateTime reviewedAt
) {
    public record ReviewItem(
            String severity,
            String category,
            String issue,
            String suggestion,
            Integer lineNumber
    ) {}
}
