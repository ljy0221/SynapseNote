package com.synapse.api.modules.ai.controller;

import com.synapse.api.modules.ai.dto.request.CodeReviewRequest;
import com.synapse.api.modules.ai.dto.request.NoteSummaryRequest;
import com.synapse.api.modules.ai.dto.response.CodeReviewResponse;
import com.synapse.api.modules.ai.dto.response.NoteSummaryResponse;
import com.synapse.api.modules.ai.service.CodeAssistantService;
import com.synapse.api.modules.ai.service.NoteSummaryService;
import com.synapse.api.util.response.DataResponse;
import com.synapse.api.util.security.CustomMemberDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Slf4j
public class AiController {

    private final CodeAssistantService codeAssistantService;
    private final NoteSummaryService noteSummaryService;

    @PostMapping("/v1/notes/{noteId}/blocks/{blockId}/ai/review")
    public CompletableFuture<DataResponse<CodeReviewResponse>> reviewCode(
            @AuthenticationPrincipal CustomMemberDetails details,
            @PathVariable UUID noteId,
            @PathVariable UUID blockId,
            @Valid @RequestBody CodeReviewRequest request) {

        UUID userId = details.id();
        log.info("Code review requested: noteId={}, blockId={}, user={}, language={}",
                noteId, blockId, userId, request.language());

        return codeAssistantService.reviewCode(noteId, blockId, userId, request)
                .thenApply(DataResponse::of);
    }

    @PostMapping("/v1/notes/{noteId}/ai/summary")
    public CompletableFuture<DataResponse<NoteSummaryResponse>> summarizeNote(
            @AuthenticationPrincipal CustomMemberDetails details,
            @PathVariable UUID noteId,
            @Valid @RequestBody NoteSummaryRequest request) {

        UUID userId = details.id();
        log.info("Note summary requested: noteId={}, user={}", noteId, userId);

        return noteSummaryService.summarizeNote(noteId, userId, request)
                .thenApply(DataResponse::of);
    }
}
