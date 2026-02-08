package com.synapse.api.modules.mindmap.repository;

import com.synapse.api.modules.mindmap.entity.MindmapNodePosition;
import com.synapse.api.modules.mindmap.entity.MindmapNodePositionId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MindmapNodePositionRepository extends JpaRepository<MindmapNodePosition, MindmapNodePositionId> {
    List<MindmapNodePosition> findAllByIdMemberId(UUID memberId);

    void deleteByIdNoteId(UUID noteId);
}
