package com.synapse.api.modules.webrtc.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * ICE Candidate 메시지
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class IceCandidateMessage {
    private String candidate;
    private String sdpMid;
    private Integer sdpMLineIndex;
}
