package com.synapse.api.modules.block.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.Map;

@Document(collection = "block_histories")
@CompoundIndexes({
    @CompoundIndex(name = "block_slot_unique_idx", def = "{'blockId': 1, 'slotNumber': 1}", unique = true),
    @CompoundIndex(name = "note_changed_idx", def = "{'noteId': 1, 'changedAt': -1}"),
    @CompoundIndex(name = "user_activity_idx", def = "{'changedBy.memberId': 1, 'changedAt': -1}")
})
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BlockHistory {

    @Id
    private String id;

    private String blockId;
    private String noteId;
    private int slotNumber;
    private int version;

    private Map<String, Object> properties;
    private String blockType;

    private ChangedBy changedBy;
    private LocalDateTime changedAt;
    private String changeDescription;

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChangedBy {
        private String memberId;
        private String memberName;
    }
}
