package com.synapse.api.modules.mindmap.entity;

import com.synapse.api.modules.member.entity.Member;
import com.synapse.api.modules.note.entity.Note;
import com.synapse.api.util.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "mindmap_edges")
@Getter
@AllArgsConstructor
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MindmapEdge extends BaseEntity {

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

    @MapsId("memberId")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member memberId;

    private MindmapEdge(Note from, Note to, Member member) {
        this.from = from;
        this.to = to;
        this.id = new MindmapEdgeId(from.getId(), to.getId(), member.getId());
    }

    public static MindmapEdge of(Note from, Note to, Member member) {
        return new MindmapEdge(from, to, member);
    }
}
