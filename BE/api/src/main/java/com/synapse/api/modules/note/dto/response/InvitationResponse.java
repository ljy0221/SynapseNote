package com.synapse.api.modules.note.dto.response;

import com.synapse.api.modules.note.entity.Invitation;
import com.synapse.api.modules.note.entity.InvitationStatus;
import com.synapse.api.modules.note.entity.NoteRole;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.UUID;

@Builder
public record InvitationResponse(
        UUID id,
        UUID invitationToken,
        String invitationUrl,
        UUID noteId,
        String noteTitle,
        String invitedEmail,
        NoteRole role,
        InvitationStatus status,
        LocalDateTime expiresAt,
        LocalDateTime createdAt,
        com.synapse.api.modules.member.dto.response.ProfileResponse invitedMember) {
    public static InvitationResponse from(Invitation invitation, String baseUrl) {
        String invitationUrl = baseUrl + "/notes/invitation/" + invitation.getInvitationToken();

        com.synapse.api.modules.member.dto.response.ProfileResponse memberProfile = null;
        if (invitation.getInvitedMember() != null) {
            memberProfile = com.synapse.api.modules.member.dto.response.ProfileResponse.builder()
                    .id(invitation.getInvitedMember().getId())
                    .email(invitation.getInvitedMember().getEmail())
                    .name(invitation.getInvitedMember().getName())
                    .theme(invitation.getInvitedMember().getTheme())
                    .provider(null) // Member does not have provider field
                    .createdAt(invitation.getInvitedMember().getCreatedAt())
                    .build();
        }

        return InvitationResponse.builder()
                .id(invitation.getId())
                .invitationToken(invitation.getInvitationToken())
                .invitationUrl(invitationUrl)
                .noteId(invitation.getNote().getId())
                .noteTitle(invitation.getNote().getTitle())
                .invitedEmail(invitation.getInvitedEmail())
                .role(invitation.getRole())
                .status(invitation.getStatus())
                .expiresAt(invitation.getExpiresAt())
                .createdAt(invitation.getCreatedAt())
                .invitedMember(memberProfile)
                .build();
    }
}
