package com.synapse.api.modules.webrtc.dto.request;

import lombok.Data;

import java.util.UUID;

@Data
public class OfferRequest {
    private UUID noteId;
    private String sdp;
    private String callId;
}
