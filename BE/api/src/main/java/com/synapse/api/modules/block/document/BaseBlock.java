package com.synapse.api.modules.block.document;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Document(collection = "blocks") // MongoDB 컬렉션 이름 'blocks'
public abstract class BaseBlock {

    @Id
    private String id; // MongoDB 내부 ObjectID

    @Indexed
    @Field("docId")
    private String docId; // 문서 ID (필수: 이 필드로 문서를 조회함)

    @Indexed(unique = true)
    @Field("blockId")
    private String blockId; // Yjs 및 프론트엔드에서 생성한 UUID

    @Field("type")
    private String type; // "code", "text", "image" 등 Discriminator 역할

    @Field("order")
    private Double order; // 블록 순서 (double 권장: 중간 삽입 용이)

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}