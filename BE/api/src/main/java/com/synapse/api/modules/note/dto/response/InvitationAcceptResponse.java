package com.synapse.api.modules.note.dto.response;

import com.synapse.api.modules.note.entity.Invitation;
import com.synapse.api.modules.note.entity.NoteRole;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.UUID;

@Builder
public record InvitationAcceptResponse(
        UUID noteId,
        String noteTitle,
        NoteRole role,
        LocalDateTime acceptedAt
) {
    public static InvitationAcceptResponse from(Invitation invitation) {
        return InvitationAcceptResponse.builder()
                .noteId(invitation.getNote().getId())
                .noteTitle(invitation.getNote().getTitle())
                .role(invitation.getRole())
                .acceptedAt(invitation.getAcceptedAt())
                .build();
    }
}
