package com.synapse.api.modules.mindmap.dto.request;

import java.util.UUID;

public record MindmapEdgeRequest(UUID parent, UUID child) {
}
