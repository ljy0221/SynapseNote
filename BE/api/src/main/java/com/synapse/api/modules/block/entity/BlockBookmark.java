package com.synapse.api.modules.block.entity;

import com.synapse.api.modules.note.entity.Note;
import com.synapse.api.util.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.util.UUID;

@Entity
@Table(name = "block_bookmarks", indexes = {
        @Index(name = "idx_block_bookmarks_note_id", columnList = "note_id")
})
@Getter
@SuperBuilder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PROTECTED)
public class BlockBookmark extends BaseEntity {

    @Id
    @Column(name = "block_id", nullable = false)
    private UUID blockId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "note_id", nullable = false)
    private Note note;

    public static BlockBookmark create(UUID blockId, Note note) {
        return BlockBookmark.builder()
                .blockId(blockId)
                .note(note)
                .build();
    }
}
