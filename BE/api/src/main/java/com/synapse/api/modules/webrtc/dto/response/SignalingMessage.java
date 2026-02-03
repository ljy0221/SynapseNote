package com.synapse.api.modules.webrtc.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SignalingMessage {

    /**
     * 메시지 타입
     * JOIN_ROOM, LEAVE_ROOM, OFFER, ANSWER, ICE_CANDIDATE, ERROR
     */
    private String type;

    /**
     * 노트 ID (룸 식별자)
     */
    private UUID noteId;

    /**
     * 발신자 사용자 ID (Member ID)
     */
    private UUID memberId;

    /**
     * 수신자 사용자 ID (1:1 통신 시)
     */
    private UUID targetMemberId;

    /**
     * 메시지 페이로드 (JSON 문자열)
     */
    private String payload;

    /**
     * 상태 (예: READY)
     */
    private String status;
}
