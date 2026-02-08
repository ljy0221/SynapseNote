package com.synapse.api.modules.block.repository;

import com.synapse.api.modules.block.document.BlockHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BlockHistoryRepository extends MongoRepository<BlockHistory, String> {

    Page<BlockHistory> findByBlockIdOrderByChangedAtDesc(UUID blockId, Pageable pageable);

    long countByBlockId(UUID blockId);

    Optional<BlockHistory> findByBlockIdAndSlotNumber(UUID blockId, int slotNumber);

    List<BlockHistory> findByBlockIdOrderBySlotNumberAsc(UUID blockId);
}
