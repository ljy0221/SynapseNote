package com.synapse.api.module.mindmap.dto.response;

import com.synapse.api.module.mindmap.dto.MindmapEdgeDto;
import com.synapse.api.module.mindmap.dto.MindmapNodeDto;

import java.util.List;

public record MindmapResponse(
        List<MindmapNodeDto> nodes,
        List<MindmapEdgeDto> edges
) {}

