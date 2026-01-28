package com.synapse.api.modules.mindmap.controller;

import com.synapse.api.modules.mindmap.dto.request.MindmapEdgeRequest;
import com.synapse.api.modules.mindmap.dto.request.AddMindmapNodeRequest;
import com.synapse.api.modules.mindmap.dto.request.UpdateMindmapPositionsRequest;
import com.synapse.api.modules.mindmap.dto.response.MindmapResponse;
import com.synapse.api.modules.mindmap.service.MindmapService;
import com.synapse.api.util.response.DataResponse;
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

    @PutMapping("/v1/mindmaps/nodes")
    public DataResponse<Void> addMindmapNode(@AuthenticationPrincipal CustomUserDetails userDetails,
                                             @RequestBody AddMindmapNodeRequest request) {
        mindmapService.addMindMapNode(userDetails.id(), request);
        return DataResponse.of(null);
    }

    @PostMapping("/v1/mindmaps/edges")
    public DataResponse<Void> addMindmapEdge(@AuthenticationPrincipal CustomUserDetails userDetails,
                                             @RequestBody MindmapEdgeRequest request) {
        mindmapService.addMindMapEdge(userDetails.id(), request);
        return DataResponse.of(null);
    }

    @PutMapping("/v1/mindmaps/nodes/positions")
    public DataResponse<Void> updateNodePositions(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody UpdateMindmapPositionsRequest request
    ) {
        mindmapService.updateNodePositions(userDetails.id(), request);
        return DataResponse.of(null);
    }


    @GetMapping("/v1/mindmaps")
    public DataResponse<MindmapResponse> getMindmap(@AuthenticationPrincipal CustomUserDetails userDetails) {
        MindmapResponse response = mindmapService.getMindmap(userDetails.id());

        return DataResponse.of(response);
    }

    @DeleteMapping("/v1/mindmaps/nodes/{nodeId}")
    public DataResponse<Void> deleteNode(@AuthenticationPrincipal CustomUserDetails userDetails,
                                           @PathVariable UUID nodeId) {
        mindmapService.deleteNode(userDetails.id(), nodeId);
        return DataResponse.of(null);
    }

    @DeleteMapping("/v1/mindmaps")
    public DataResponse<Void> deleteMindmap(@AuthenticationPrincipal CustomUserDetails userDetails) {
        mindmapService.deleteMindmap(userDetails.id());
        return DataResponse.of(null);
    }

    @DeleteMapping("/v1/mindmaps/connection")
    public DataResponse<Void> deleteConnection(@AuthenticationPrincipal CustomUserDetails userDetails,
                                                 @RequestBody MindmapEdgeRequest request) {
        mindmapService.deleteConnection(userDetails.id(), request);
        return DataResponse.of(null);
    }
}
