package com.synapse.api.modules.block.document;

import lombok.*;
import lombok.experimental.SuperBuilder;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.annotation.TypeAlias;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@TypeAlias("image") // MongoDB _class: "image"
public class ImageBlock extends BaseBlock {

    @Field("properties.src")
    private String src; // 이미지 URL (S3 경로 등)

    @Field("properties.caption")
    private String caption; // 이미지 하단 설명

    @Field("properties.width")
    private Integer width; // 픽셀 단위 또는 %

    @Field("properties.align")
    private String align; // "left", "center", "right"

    @Field("properties.alt")
    private String alt; // 접근성 텍스트

    // --- 비즈니스 로직 ---

    public void updateCaption(String caption) {
        this.caption = caption;
    }
}