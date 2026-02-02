package com.synapse.api.modules.block.repository;

import com.synapse.api.modules.block.document.BaseBlock;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BlockRepository extends MongoRepository<BaseBlock, String> {
    // 특정 문서의 블록 전체 조회 (순서 보장)
    List<BaseBlock> findByNoteIdOrderByOrderAsc(String noteId);

    // 블록 ID로 조회
    Optional<BaseBlock> findByBlockId(String blockId);

    // 북마크된 블록 조회 (최신순, 페이지네이션)
    Page<BaseBlock> findByNoteIdAndBookmarkTrueOrderByUpdatedAtDesc(String noteId, Pageable pageable);

    // 특정 문서의 블록 전체 조회 (순서 보장)
    List<BaseBlock> findAllByNoteIdOrderByOrderAsc(UUID noteId);

    // 문서 삭제 시 관련 블록 일괄 삭제 (필요 시)
    void deleteByNoteId(String noteId);
}