package com.synapse.api.modules.note.dto.request;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * 노트 목록 조회 필터
 */
public enum NoteFilter {
    ALL("all"), // 전체 노트 (owned + shared)
    OWNED("owned"), // 내가 만든 노트
    SHARED("shared"); // 공유받은 노트

    private final String value;

    NoteFilter(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }

    /**
     * 문자열을 NoteFilter로 변환 (대소문자 무시)
     * 잘못된 값이 들어오면 null 반환
     */
    @JsonCreator
    public static NoteFilter fromString(String value) {
        if (value == null) {
            return null;
        }

        for (NoteFilter filter : NoteFilter.values()) {
            if (filter.value.equalsIgnoreCase(value)) {
                return filter;
            }
        }

        return null;
    }
}
