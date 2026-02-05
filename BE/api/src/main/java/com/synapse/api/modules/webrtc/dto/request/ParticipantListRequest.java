package com.synapse.api.modules.webrtc.dto.request;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
public class ParticipantListRequest {
    private UUID noteId;
}
