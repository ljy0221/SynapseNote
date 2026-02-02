package com.synapse.api.modules.member.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.synapse.api.util.entity.EnumParser;

public enum Theme {
    LIGHT,
    DARK,
    COOKIE,
    DEEPBLUE;

    @JsonCreator
    public static Theme from(String value) {
        return EnumParser.fromString(value, Theme.class);
    }

}
