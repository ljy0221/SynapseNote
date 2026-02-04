package com.synapse.api.modules.block.repository;

import com.synapse.api.modules.block.entity.BlockBookmark;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BlockBookmarkRepository extends JpaRepository<BlockBookmark, UUID> {

    // blockId로 북마크 조회 (삭제되지 않은 것만)
    @Query("SELECT bb FROM BlockBookmark bb WHERE bb.blockId = :blockId AND bb.deletedAt IS NULL")
    Optional<BlockBookmark> findByBlockIdAndDeletedAtIsNull(@Param("blockId") UUID blockId);

    // blockId로 북마크 존재 여부 확인
    @Query("SELECT CASE WHEN COUNT(bb) > 0 THEN true ELSE false END FROM BlockBookmark bb " +
            "WHERE bb.blockId = :blockId AND bb.deletedAt IS NULL")
    boolean existsByBlockIdAndDeletedAtIsNull(@Param("blockId") UUID blockId);

    // 특정 사용자의 모든 북마크 조회 (페이징)
    @Query("SELECT bb FROM BlockBookmark bb " +
            "JOIN FETCH bb.note n " +
            "WHERE n.createdBy.id = :memberId AND bb.deletedAt IS NULL " +
            "ORDER BY bb.createdAt DESC")
    Page<BlockBookmark> findByNoteCreatedByIdAndDeletedAtIsNull(@Param("memberId") UUID memberId, Pageable pageable);

    // 특정 노트의 모든 북마크 조회
    @Query("SELECT bb FROM BlockBookmark bb WHERE bb.note.id = :noteId AND bb.deletedAt IS NULL")
    List<BlockBookmark> findByNoteIdAndDeletedAtIsNull(@Param("noteId") UUID noteId);

    // blockId로 북마크 삭제 (Soft Delete)
    @Query("SELECT bb FROM BlockBookmark bb WHERE bb.blockId = :blockId AND bb.deletedAt IS NULL")
    Optional<BlockBookmark> findByBlockId(@Param("blockId") UUID blockId);

    // 노트 삭제 시 관련 북마크 일괄 Soft Delete
    @Modifying(clearAutomatically = true)
    @Query("UPDATE BlockBookmark bb SET bb.deletedAt = CURRENT_TIMESTAMP WHERE bb.note.id = :noteId AND bb.deletedAt IS NULL")
    void softDeleteByNoteId(@Param("noteId") UUID noteId);
}
