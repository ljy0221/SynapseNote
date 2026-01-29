package com.synapse.api.modules.block.repository;

import com.synapse.api.modules.block.document.BaseBlock;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface BlockRepository extends MongoRepository<BaseBlock, String> {
    // 특정 문서의 블록 전체 조회 (순서 보장)
    List<BaseBlock> findByDocIdOrderByOrderAsc(String docId);

    // 블록 ID로 조회
    Optional<BaseBlock> findByBlockId(String blockId);

    // 문서 삭제 시 관련 블록 일괄 삭제 (필요 시)
    void deleteByDocId(String docId);
}