package com.synapse.api.modules.mindmap.dto.response;

import com.synapse.api.modules.mindmap.dto.MindmapEdgeDto;
import com.synapse.api.modules.mindmap.dto.MindmapNodeDto;

import java.util.List;

public record MindmapResponse(
        List<MindmapNodeDto> nodes,
        List<MindmapEdgeDto> edges
) {}

