package com.synapse.api.module.mindmap.dto;

import java.util.UUID;

public record MindmapEdgeDto(
        UUID fromId,
        UUID toId
) {}
