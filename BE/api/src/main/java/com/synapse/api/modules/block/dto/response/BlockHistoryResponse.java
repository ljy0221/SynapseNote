package com.synapse.api.modules.block.dto.response;

import com.synapse.api.modules.block.document.BlockHistory;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Builder
public class BlockHistoryResponse {
    private UUID blockId;
    private int slotNumber;
    private String blockType;
    private String changedByMemberId;
    private String changedByMemberName;
    private LocalDateTime changedAt;
    private String changeDescription;

    public static BlockHistoryResponse from(BlockHistory history) {
        return BlockHistoryResponse.builder()
                .blockId(history.getBlockId())
                .slotNumber(history.getSlotNumber())
                .blockType(history.getBlockType())
                .changedByMemberId(history.getChangedBy().getMemberId())
                .changedByMemberName(history.getChangedBy().getMemberName())
                .changedAt(history.getChangedAt())
                .changeDescription(history.getChangeDescription())
                .build();
    }
}
