package com.synapse.api.modules.note.dto.response;

import lombok.Builder;

import java.util.List;

@Builder
public record InvitationListResponse(
        List<InvitationResponse> invitations
) {
    public static InvitationListResponse from(List<InvitationResponse> invitations) {
        return InvitationListResponse.builder()
                .invitations(invitations)
                .build();
    }
}
