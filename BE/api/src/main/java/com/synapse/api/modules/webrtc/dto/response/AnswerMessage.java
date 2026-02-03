package com.synapse.api.modules.webrtc.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * SDP Answer 메시지
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnswerMessage {
    private UUID noteId;
    private String callId;
    private String sdp;
}
