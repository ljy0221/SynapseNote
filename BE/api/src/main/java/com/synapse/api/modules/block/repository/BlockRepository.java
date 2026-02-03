package com.synapse.api.modules.block.repository;

import com.synapse.api.modules.block.document.BaseBlock;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.data.mongodb.repository.Update;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BlockRepository extends MongoRepository<BaseBlock, String> {
    // 특정 문서의 블록 전체 조회 (순서 보장, 삭제 안 된 것만)
    List<BaseBlock> findByNoteIdAndDeletedAtIsNullOrderByOrderAsc(UUID noteId);

    // 블록 ID로 조회 (삭제 안 된 것만)
    Optional<BaseBlock> findByBlockIdAndDeletedAtIsNull(UUID blockId);

    // 노트 삭제 시 블록 Soft Delete
    @Query("{ 'noteId': ?0, 'deletedAt': null }")
    @Update("{ '$set': { 'deletedAt': ?1 } }")
    void softDeleteByNoteId(UUID noteId, LocalDateTime deletedAt);

    // 특정 소유자의 북마크된 블록 조회
    Page<BaseBlock> findByOwnerIdAndBookmarkTrueAndDeletedAtIsNull(UUID ownerId, Pageable pageable);
}