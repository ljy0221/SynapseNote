package com.synapse.api.modules.webrtc.dto.request;

import lombok.Data;

@Data
public class OfferRequest {
    private String noteId;
    private String sdp;
}
