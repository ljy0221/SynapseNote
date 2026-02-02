package com.synapse.api.modules.webrtc.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * SDP Answer 메시지
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnswerMessage {
    private String sdp;
}
