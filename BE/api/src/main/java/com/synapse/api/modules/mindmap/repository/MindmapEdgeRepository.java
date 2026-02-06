package com.synapse.api.modules.mindmap.repository;

import com.synapse.api.modules.mindmap.entity.MindmapEdge;
import com.synapse.api.modules.mindmap.entity.MindmapEdgeId;
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
                WHERE e.member.id = :memberId
            """)
    int deleteAllByMemberId(@Param("memberId") UUID memberId);

    @Modifying
    @Query("""
            DELETE FROM MindmapEdge e
            WHERE e.from.id = :parentId
              AND e.to.id = :childId
              AND e.member.id = :memberId
            """)
    int deleteByMemberAndEdge(
            @Param("memberId") UUID memberId,
            @Param("parentId") UUID parentId,
            @Param("childId") UUID childId);

    @Query("""
            SELECT e FROM MindmapEdge e
            WHERE e.member.id = :memberId
            """)
    List<MindmapEdge> findAllByMember(UUID memberId);

}
