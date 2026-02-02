package com.synapse.api.modules.block.document;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "blocks")
// API 응답 시 JSON 타입 추론을 위한 설정 (프론트엔드용)
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.EXISTING_PROPERTY, property = "type", visible = true)
@JsonSubTypes({
                @JsonSubTypes.Type(value = CodeBlock.class, name = "code"),
                @JsonSubTypes.Type(value = TextBlock.class, name = "text"),
})
public abstract class BaseBlock {

        @Id
        private String id; // MongoDB ObjectId

        @Indexed
        private UUID noteId; // PostgreSQL Note ID (UUID.toString())

        @Indexed(unique = true)
        private UUID blockId; // Yjs/Frontend UUID

        private boolean bookmark;

        private Double order; // 정렬 순서

        @CreatedDate
        private LocalDateTime createdAt;

        @LastModifiedDate
        private LocalDateTime updatedAt;

        // DB에는 저장하지 않고, JSON 응답에만 포함 (하위 클래스에서 구현)
        public abstract String getType();

        // 북마크 설정
        public void setBookmark() {
                this.bookmark = true;
        }

        // 북마크 해제
        public void unBookmark() {
                this.bookmark = false;
        }
}