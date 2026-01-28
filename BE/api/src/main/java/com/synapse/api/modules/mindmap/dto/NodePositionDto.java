package com.synapse.api.modules.mindmap.dto;

import java.util.UUID;

public record NodePositionDto(
        UUID nodeId,
        Double x,
        Double y
) {}
