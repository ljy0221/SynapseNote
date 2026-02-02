package com.synapse.api.modules.note.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.synapse.api.util.entity.EnumParser;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum NoteRole {
    OWNER("소유자", 3),
    EDITOR("편집자", 2),
    VIEWER("뷰어", 1);

    private final String description;
    private final int priority;

    public boolean canEdit() {
        return this == OWNER || this == EDITOR;
    }

    public boolean canDelete() {
        return this == OWNER;
    }

    public boolean canView() {
        return true;
    }

    @JsonCreator
    public static NoteRole from(String value) {
        return EnumParser.fromString(value, NoteRole.class);
    }

}
