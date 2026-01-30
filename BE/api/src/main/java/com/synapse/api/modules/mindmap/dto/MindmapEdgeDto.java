package com.synapse.api.modules.mindmap.dto;

import java.util.UUID;

public record MindmapEdgeDto(
        UUID fromId,
        UUID toId
) {}
