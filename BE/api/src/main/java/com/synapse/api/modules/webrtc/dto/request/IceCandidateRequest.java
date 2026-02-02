package com.synapse.api.modules.webrtc.dto.request;

import lombok.Data;

@Data
public class IceCandidateRequest {
    private String noteId;
    private String candidate;
    private String sdpMid;
    private Integer sdpMLineIndex;
}
