package com.synapse.api.modules.ai.dto.response;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record CodeReviewResponse(
                UUID blockId,
                String language,
                String originalCode,
                List<ReviewItem> reviews,
                List<String> bestPractices,
                String summary,
                LocalDateTime reviewedAt) {
        public record ReviewItem(
                        String severity,
                        String category,
                        String issue,
                        String suggestion,
                        String suggestionCode,
                        Integer lineNumber) {
        }
}
