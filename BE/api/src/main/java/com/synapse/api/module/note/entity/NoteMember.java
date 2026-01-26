package com.synapse.api.module.note.entity;

import com.synapse.api.module.user.entity.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "note_members", indexes = {
        @Index(name = "idx_note_members_user_id", columnList = "user_id")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class NoteMember {

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

    @CreationTimestamp
    @Column(name = "joined_at", nullable = false, updatable = false)
    private LocalDateTime joinedAt;

    @Builder
    public NoteMember(Note note, User user, NoteRole role) {
        this.id = new NoteMemberId(note.getId(), user.getId());
        this.note = note;
        this.user = user;
        this.role = role;
    }

    public void changeRole(NoteRole role) {
        this.role = role;
    }
}
