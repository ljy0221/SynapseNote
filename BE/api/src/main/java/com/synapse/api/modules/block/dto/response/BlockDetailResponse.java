package com.synapse.api.modules.block.dto.response;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;

import java.time.LocalDateTime;
import java.util.UUID;

@JsonTypeInfo(
        use = JsonTypeInfo.Id.NAME,
        include = JsonTypeInfo.As.PROPERTY,
        property = "type"
)
@JsonSubTypes({
        @JsonSubTypes.Type(value = TextBlockResponse.class, name = "text"),
        @JsonSubTypes.Type(value = CodeBlockResponse.class, name = "code")
})
public sealed interface BlockDetailResponse permits TextBlockResponse, CodeBlockResponse {

    String id();
    UUID noteId();
    UUID blockId();
    Double order();
    boolean bookmark();
    LocalDateTime createdAt();
    LocalDateTime updatedAt();

}
