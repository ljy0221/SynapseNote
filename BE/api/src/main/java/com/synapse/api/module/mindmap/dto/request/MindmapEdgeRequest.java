package com.synapse.api.module.mindmap.dto.request;

import java.util.UUID;

public record MindmapEdgeRequest(UUID parent, UUID child) {
}
