package com.synapse.api.modules.webrtc.dto.request;

import lombok.Data;

import java.util.UUID;

@Data
public class IceCandidateRequest {
    private UUID noteId;
    private String callId;
    private String candidate;
    private String sdpMid;
    private Integer sdpMLineIndex;
}
