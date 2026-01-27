package com.synapse.api.module.mindmap.entity;

import com.synapse.api.module.note.entity.Note;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "mindmap_edges")
@Getter
@AllArgsConstructor
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MindmapEdge {

    @EmbeddedId
    private MindmapEdgeId id;

    @MapsId("fromId")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "from_id", nullable = false)
    private Note from;

    @MapsId("toId")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "to_id", nullable = false)
    private Note to;

    private MindmapEdge(Note from, Note to) {
        this.from = from;
        this.to = to;
        this.id = new MindmapEdgeId(from.getId(), to.getId());
    }

    public static MindmapEdge of(Note from, Note to) {
        return new MindmapEdge(from, to);
    }

    public static MindmapEdge createMindMapEdge(Note child, Note parent) {
        return MindmapEdge.builder()
                .from(child)
                .to(parent)
                .build();
    }
}
