package com.synapse.api.modules.block.dto.response;

import com.synapse.api.modules.block.document.BlockHistory;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Getter
@Builder
public class BlockHistoryDetailResponse {
    private UUID blockId;
    private int slotNumber;
    private Map<String, Object> properties;
    private String blockType;
    private ChangedByInfo changedBy;
    private LocalDateTime changedAt;
    private String changeDescription;

    @Getter
    @Builder
    public static class ChangedByInfo {
        private String memberId;
        private String memberName;
    }

    public static BlockHistoryDetailResponse from(BlockHistory history) {
        return BlockHistoryDetailResponse.builder()
                .blockId(history.getBlockId())
                .slotNumber(history.getSlotNumber())
                .properties(history.getProperties())
                .blockType(history.getBlockType())
                .changedBy(ChangedByInfo.builder()
                        .memberId(history.getChangedBy().getMemberId())
                        .memberName(history.getChangedBy().getMemberName())
                        .build())
                .changedAt(history.getChangedAt())
                .changeDescription(history.getChangeDescription())
                .build();
    }
}
