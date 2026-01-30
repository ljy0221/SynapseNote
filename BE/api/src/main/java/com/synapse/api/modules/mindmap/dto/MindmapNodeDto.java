package com.synapse.api.modules.mindmap.dto;

import java.util.UUID;

public record MindmapNodeDto(
        UUID id,
        String title,
        Double x,
        Double y,
        int priority,
        String directoryPath
) {}

