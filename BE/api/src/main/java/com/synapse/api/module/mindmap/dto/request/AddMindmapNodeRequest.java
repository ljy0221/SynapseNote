package com.synapse.api.module.mindmap.dto.request;

import java.util.UUID;

public record AddMindmapNodeRequest(Double pointX, Double pointY, UUID noteId) {
}
