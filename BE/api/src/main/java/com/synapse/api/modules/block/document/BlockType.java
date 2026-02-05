package com.synapse.api.modules.block.document;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.synapse.api.util.entity.EnumParser;

public enum BlockType {
    TEXT,
    CODE,
    UNKNOWN;

    @JsonCreator
    public static BlockType from(String value) {
        return EnumParser.fromString(value, BlockType.class);
    }

}
