package com.synapse.api.module.mindmap.repository;

import com.synapse.api.module.mindmap.entity.MindmapEdge;
import com.synapse.api.module.mindmap.entity.MindmapEdgeId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface MindmapEdgeRepository extends JpaRepository<MindmapEdge, MindmapEdgeId> {
    void deleteByFrom_Id(UUID nodeId);

    void deleteByTo_Id(UUID nodeId);

    @Modifying
    @Query("""
        DELETE FROM MindmapEdge e
        WHERE e.from.createdBy.id = :userId
           OR e.to.createdBy.id = :userId
    """)
    int deleteAllByUserId(@Param("userId") UUID userId);

    @Modifying
    @Query("""
    DELETE FROM MindmapEdge e
    WHERE e.from.id = :parentId
      AND e.to.id = :childId
      AND e.from.createdBy.id = :userId
    """)
    int deleteByUserAndEdge(
            @Param("userId") UUID userId,
            @Param("parentId") UUID parentId,
            @Param("childId") UUID childId
    );


    @Query("""
    SELECT e FROM MindmapEdge e
    WHERE e.from.createdBy.id = :userId
       OR e.to.createdBy.id = :userId
    """)
    List<MindmapEdge> findAllByUser(UUID userId);
}
