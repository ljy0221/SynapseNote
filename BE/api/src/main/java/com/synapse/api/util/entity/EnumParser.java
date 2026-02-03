package com.synapse.api.util.entity;

import com.synapse.api.util.exception.BusinessException;
import com.synapse.api.util.response.ErrorCode;

import java.util.Arrays;

public final class EnumParser {

    private EnumParser() {}

    public static <E extends Enum<E>> E fromString(
            String value,
            Class<E> enumType
    ) {
        if (value == null || value.isBlank()) {
            throw new BusinessException(ErrorCode.INVALID_ENUM_TYPE);
        }

        return Arrays.stream(enumType.getEnumConstants())
                .filter(e -> e.name().equalsIgnoreCase(value))
                .findFirst()
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_ENUM_TYPE));
    }

}

