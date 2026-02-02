package com.synapse.api.modules.member.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.synapse.api.util.exception.BusinessException;
import com.synapse.api.util.response.ErrorCode;

import java.util.Arrays;

public enum Theme {
    LIGHT,
    DARK,
    COOKIE,
    DEEPBLUE;

    @JsonCreator
    public static Theme from(String value) {
        if (value == null || value.isBlank()) {
            throw new BusinessException(ErrorCode.INVALID_THEME);
        }

        return Arrays.stream(values())
                .filter(theme -> theme.name().equalsIgnoreCase(value))
                .findFirst()
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_THEME));
    }

}
