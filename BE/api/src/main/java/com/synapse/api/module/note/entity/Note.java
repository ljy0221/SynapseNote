package com.synapse.api.module.note.entity;

import com.synapse.api.module.user.entity.User;
import com.synapse.api.util.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.util.UUID;

@Entity
@Table(name = "notes", indexes = {
        @Index(name = "idx_notes_created_by", columnList = "created_by"),
        @Index(name = "idx_notes_title", columnList = "title")
})
@Getter
@SuperBuilder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PROTECTED)
public class Note extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(name = "directory_path", length = 500)
    private String directoryPath;

    @Column(name = "point_x")
    private Double pointX;

    @Column(name = "point_y")
    private Double pointY;

    @Column(name = "invitation_url", length = 1000)
    private String invitationUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    public void updateTitle(String title) {
        this.title = title;
    }

    public void updateDirectoryPath(String directoryPath) {
        this.directoryPath = directoryPath;
    }

    public void updatePosition(Double pointX, Double pointY) {
        this.pointX = pointX;
        this.pointY = pointY;
    }

    public void updateInvitationUrl(String invitationUrl) {
        this.invitationUrl = invitationUrl;
    }
}
