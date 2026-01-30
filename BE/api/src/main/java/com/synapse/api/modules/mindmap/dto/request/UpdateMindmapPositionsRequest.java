package com.synapse.api.modules.mindmap.dto.request;

import com.synapse.api.modules.mindmap.dto.NodePositionDto;

import java.util.List;

public record UpdateMindmapPositionsRequest(
        List<NodePositionDto> nodes
) {}
