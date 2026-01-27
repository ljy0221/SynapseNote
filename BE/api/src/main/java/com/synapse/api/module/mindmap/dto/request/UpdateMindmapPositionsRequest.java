package com.synapse.api.module.mindmap.dto.request;

import com.synapse.api.module.mindmap.dto.NodePositionDto;

import java.util.List;

public record UpdateMindmapPositionsRequest(
        List<NodePositionDto> nodes
) {}
