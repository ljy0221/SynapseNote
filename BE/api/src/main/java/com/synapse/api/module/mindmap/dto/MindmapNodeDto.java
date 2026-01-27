package com.synapse.api.module.mindmap.dto;

import java.util.UUID;

public record MindmapNodeDto(
        UUID id,
        String title,
        Double x,
        Double y,
        int priority,
        String directoryPath
) {}

