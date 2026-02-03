package com.synapse.api.modules.webrtc.dto.request;

import lombok.Data;

import java.util.UUID;

@Data
public class JoinRoomRequest {
    private UUID noteId;
}
