package com.synapse.api.module.note.entity;

import com.synapse.api.module.user.entity.User;
import com.synapse.api.util.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "note_members", indexes = {
        @Index(name = "idx_note_members_user_id", columnList = "user_id")
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
    @MapsId("userId")
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private NoteRole role;

    public void changeRole(NoteRole role) {
        this.role = role;
    }
}
