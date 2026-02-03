package com.synapse.api.modules.webrtc.dto.request;

import lombok.Data;

import java.util.UUID;

@Data
public class LeaveRoomRequest {
    private UUID noteId;
}
