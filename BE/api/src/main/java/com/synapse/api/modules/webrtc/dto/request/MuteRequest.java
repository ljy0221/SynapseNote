package com.synapse.api.modules.webrtc.dto.request;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
public class MuteRequest {
    private UUID noteId;
    private boolean isMuted;
}
