package com.synapse.api.module.mindmap.dto;

import java.util.UUID;

public record NodePositionDto(
        UUID nodeId,
        Double x,
        Double y
) {}
