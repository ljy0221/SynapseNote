package com.synapse.api.modules.mindmap.controller;

import com.synapse.api.modules.mindmap.dto.request.SyncMindmapRequest;
import com.synapse.api.modules.mindmap.dto.response.MindmapResponse;
import com.synapse.api.modules.mindmap.service.MindmapService;
import com.synapse.api.util.response.DataResponse;
import com.synapse.api.util.response.StatusResponse;
import com.synapse.api.util.security.CustomMemberDetails;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class MindmapController {
    private final MindmapService mindmapService;

    @PostMapping("/v1/mindmaps")
    public StatusResponse syncMindmap(
            @AuthenticationPrincipal CustomMemberDetails userDetails,
            @RequestBody SyncMindmapRequest request) {
        mindmapService.syncMindmap(userDetails.id(), request);
        return StatusResponse.of();
    }

    @GetMapping("/v1/mindmaps")
    public DataResponse<MindmapResponse> getMindmap(@AuthenticationPrincipal CustomMemberDetails userDetails) {
        MindmapResponse response = mindmapService.getMindmap(userDetails.id());

        return DataResponse.of(response);
    }
}
