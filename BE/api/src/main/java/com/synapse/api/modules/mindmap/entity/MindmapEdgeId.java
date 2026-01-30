package com.synapse.api.modules.mindmap.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;
import java.util.UUID;

@Embeddable
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@EqualsAndHashCode
public class MindmapEdgeId implements Serializable {

    @Column(name = "from_id", columnDefinition = "uuid", nullable = false)
    private UUID fromId;

    @Column(name = "to_id", columnDefinition = "uuid", nullable = false)
    private UUID toId;
}
