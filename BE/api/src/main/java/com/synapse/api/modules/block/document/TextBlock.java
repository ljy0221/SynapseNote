package com.synapse.api.modules.block.document;

import lombok.*;
import lombok.experimental.SuperBuilder;
import org.springframework.data.annotation.TypeAlias;

import java.util.Map;

@Getter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@TypeAlias("text") // MongoDB _class: "text"
public class TextBlock extends BaseBlock {

    private TextProperties properties;

    @Override
    public BlockType getType() {
        return BlockType.TEXT;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TextProperties {
        private String content; // Markdown String
        private Map<String, Object> attributes; // Color, Align etc.
    }
}