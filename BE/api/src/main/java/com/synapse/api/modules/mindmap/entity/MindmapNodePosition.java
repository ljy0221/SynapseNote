package com.synapse.api.modules.mindmap.entity;

import com.synapse.api.util.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "mindmap_node_positions")
@Getter
@SuperBuilder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PROTECTED)
public class MindmapNodePosition extends BaseEntity {

    @EmbeddedId
    private MindmapNodePositionId id;

    @Column(name = "point_x", nullable = false)
    private Double pointX;

    @Column(name = "point_y", nullable = false)
    private Double pointY;

    public void updatePosition(Double x, Double y) {
        this.pointX = x;
        this.pointY = y;
    }
}
