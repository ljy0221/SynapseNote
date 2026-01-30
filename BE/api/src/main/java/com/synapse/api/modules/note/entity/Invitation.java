package com.synapse.api.modules.note.entity;

import com.synapse.api.modules.member.entity.Member;
import com.synapse.api.util.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.GenericGenerator;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "invitations", indexes = {
        @Index(name = "idx_invitations_token", columnList = "invitation_token"),
        @Index(name = "idx_invitations_note_id", columnList = "note_id"),
        @Index(name = "idx_invitations_invited_email", columnList = "invited_email"),
        @Index(name = "idx_invitations_status", columnList = "status")
})
@Getter
@SuperBuilder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PROTECTED)
public class Invitation extends BaseEntity {

    @Id
    @GeneratedValue(generator = "uuid-v7")
    @GenericGenerator(name = "uuid-v7", strategy = "com.synapse.api.util.generator.UuidV7Generator")
    @Column(columnDefinition = "UUID")
    private UUID id;

    @Column(name = "invitation_token", nullable = false, unique = true, columnDefinition = "UUID")
    private UUID invitationToken;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "note_id", nullable = false)
    private Note note;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invited_by_id", nullable = false)
    private Member invitedBy;

    @Column(name = "invited_email", nullable = false, length = 255)
    private String invitedEmail;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invited_member_id")
    private Member invitedMember;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private NoteRole role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private InvitationStatus status;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "accepted_at")
    private LocalDateTime acceptedAt;

    public void accept(Member member) {
        this.invitedMember = member;
        this.status = InvitationStatus.ACCEPTED;
        this.acceptedAt = LocalDateTime.now();
    }

    public void expire() {
        this.status = InvitationStatus.EXPIRED;
    }

    public void revoke() {
        this.status = InvitationStatus.REVOKED;
    }

    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }

    public boolean isPending() {
        return status == InvitationStatus.PENDING;
    }
}
