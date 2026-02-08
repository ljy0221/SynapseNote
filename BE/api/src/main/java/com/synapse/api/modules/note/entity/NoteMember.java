package com.synapse.api.modules.note.entity;

import com.synapse.api.modules.member.entity.Member;
import com.synapse.api.util.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "note_members", indexes = {
        @Index(name = "idx_note_members_member_id", columnList = "member_id")
})
@Getter
@SuperBuilder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PROTECTED)
public class NoteMember extends BaseEntity {

    @EmbeddedId
    private NoteMemberId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("noteId")
    @JoinColumn(name = "note_id", nullable = false)
    private Note note;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("memberId")
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private NoteRole role;

    public void changeRole(NoteRole role) {
        this.role = role;
    }
}
