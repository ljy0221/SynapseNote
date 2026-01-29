package com.synapse.api.modules.mindmap.controller;

import com.synapse.api.modules.mindmap.dto.request.MindmapEdgeRequest;
import com.synapse.api.modules.mindmap.dto.request.AddMindmapNodeRequest;
import com.synapse.api.modules.mindmap.dto.request.UpdateMindmapPositionsRequest;
import com.synapse.api.modules.mindmap.dto.response.MindmapResponse;
import com.synapse.api.modules.mindmap.service.MindmapService;
import com.synapse.api.util.response.DataResponse;
import com.synapse.api.util.response.StatusResponse;
import com.synapse.api.util.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class MindmapController {
    private final MindmapService mindmapService;

    @PostMapping("/v1/mindmaps/nodes")
    public StatusResponse addMindmapNode(@AuthenticationPrincipal CustomUserDetails userDetails,
                                             @RequestBody AddMindmapNodeRequest request) {
        mindmapService.addMindMapNode(userDetails.id(), request);
        return StatusResponse.of();
    }

    @PostMapping("/v1/mindmaps/edges")
    public StatusResponse addMindmapEdge(@AuthenticationPrincipal CustomUserDetails userDetails,
                                             @RequestBody MindmapEdgeRequest request) {
        mindmapService.addMindMapEdge(userDetails.id(), request);
        return StatusResponse.of();
    }

    @PutMapping("/v1/mindmaps/nodes/positions")
    public StatusResponse updateNodePositions(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody UpdateMindmapPositionsRequest request
    ) {
        mindmapService.updateNodePositions(userDetails.id(), request);
        return StatusResponse.of();
    }


    @GetMapping("/v1/mindmaps")
    public DataResponse<MindmapResponse> getMindmap(@AuthenticationPrincipal CustomUserDetails userDetails) {
        MindmapResponse response = mindmapService.getMindmap(userDetails.id());

        return DataResponse.of(response);
    }

    @DeleteMapping("/v1/mindmaps/nodes/{nodeId}")
    public StatusResponse deleteNode(@AuthenticationPrincipal CustomUserDetails userDetails,
                                           @PathVariable UUID nodeId) {
        mindmapService.deleteNode(userDetails.id(), nodeId);
        return StatusResponse.of();
    }

    @DeleteMapping("/v1/mindmaps")
    public StatusResponse deleteMindmap(@AuthenticationPrincipal CustomUserDetails userDetails) {
        mindmapService.deleteMindmap(userDetails.id());
        return StatusResponse.of();
    }

    @DeleteMapping("/v1/mindmaps/connection")
    public StatusResponse deleteConnection(@AuthenticationPrincipal CustomUserDetails userDetails,
                                                 @RequestBody MindmapEdgeRequest request) {
        mindmapService.deleteConnection(userDetails.id(), request);
        return StatusResponse.of();
    }
}
