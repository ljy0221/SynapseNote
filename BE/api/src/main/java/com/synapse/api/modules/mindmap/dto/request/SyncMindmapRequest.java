package com.synapse.api.modules.mindmap.dto.request;

import com.synapse.api.modules.mindmap.dto.NodePositionDto;

import com.synapse.api.modules.mindmap.dto.MindmapEdgeDto;

import java.util.List;

public record SyncMindmapRequest(
                List<NodePositionDto> nodes,
                List<MindmapEdgeDto> edges) {
}
