package com.synapse.api.modules.block.repository;

import com.synapse.api.modules.block.document.BaseBlock;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface BlockRepository extends MongoRepository<BaseBlock, String> {

    // 특정 문서의 모든 블록을 순서대로 가져오기 (NoteContent와 합칠 때 사용)
    List<BaseBlock> findByDocIdOrderByOrderAsc(String docId);

    // 블록 ID(UUID)로 특정 블록 찾기 (실행 히스토리 저장 시 사용)
    Optional<BaseBlock> findByBlockId(String blockId);
}