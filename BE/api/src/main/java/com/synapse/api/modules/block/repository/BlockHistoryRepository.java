package com.synapse.api.modules.block.repository;

import com.synapse.api.modules.block.document.BlockHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;
import java.util.Optional;

public interface BlockHistoryRepository extends MongoRepository<BlockHistory, String> {

    Page<BlockHistory> findByBlockIdOrderByVersionDesc(String blockId, Pageable pageable);

    Optional<BlockHistory> findByBlockIdAndVersion(String blockId, int version);

    @Query(value = "{ 'blockId': ?0 }", sort = "{ 'version': -1 }")
    Optional<BlockHistory> findFirstByBlockIdOrderByVersionDesc(String blockId);

    long countByBlockId(String blockId);

    Optional<BlockHistory> findByBlockIdAndSlotNumber(String blockId, int slotNumber);

    List<BlockHistory> findByBlockIdOrderBySlotNumberAsc(String blockId);
}
