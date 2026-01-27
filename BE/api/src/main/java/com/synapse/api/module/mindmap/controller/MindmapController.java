package com.synapse.api.module.mindmap.controller;

import com.synapse.api.module.mindmap.dto.request.MindmapEdgeRequest;
import com.synapse.api.module.mindmap.dto.request.AddMindmapNodeRequest;
import com.synapse.api.module.mindmap.dto.request.UpdateMindmapPositionsRequest;
import com.synapse.api.module.mindmap.dto.response.MindmapResponse;
import com.synapse.api.module.mindmap.service.MindmapService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class MindmapController {
    private final MindmapService mindmapService;

    @PutMapping("/v1/mindmaps/nodes")
    public ResponseEntity<Void> addMindMapNode(@RequestHeader("X-User-Id") UUID userId,
                                           @RequestBody AddMindmapNodeRequest request) {
        mindmapService.addMindMapNode(userId, request);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/v1/mindmaps/edges")
    public ResponseEntity<Void> addMindMapEdge(@RequestHeader("X-User-Id") UUID userId,
                                           @RequestBody MindmapEdgeRequest request) {
        mindmapService.addMindMapEdge(userId, request);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/v1/mindmaps/nodes/positions")
    public ResponseEntity<Void> updateNodePositions(
            @RequestHeader("X-User-Id") UUID userId,
            @RequestBody UpdateMindmapPositionsRequest request
    ) {
        mindmapService.updateNodePositions(userId, request);
        return ResponseEntity.noContent().build();
    }


    @GetMapping("/v1/mindmaps")
    public ResponseEntity<MindmapResponse> getMindMap(@RequestHeader("X-User-Id") UUID userId) {
        MindmapResponse response = mindmapService.getMindmap(userId);

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/v1/mindmaps/nodes/{nodeId}")
    public ResponseEntity<Void> deleteNode(@RequestHeader("X-User-Id") UUID userId,
                                           @PathVariable UUID nodeId) {
        mindmapService.deleteNode(userId, nodeId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/v1/mindmaps")
    public ResponseEntity<Void> deleteMindmap(@RequestHeader("X-User-Id") UUID userId) {
        mindmapService.deleteMindmap(userId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/v1/mindmaps/connection")
    public ResponseEntity<Void> deleteConnection(@RequestHeader("X-User-Id") UUID userId,
                                                 @RequestBody MindmapEdgeRequest request) {
        mindmapService.deleteConnection(userId, request);
        return ResponseEntity.noContent().build();
    }
}
